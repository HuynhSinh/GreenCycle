import { prisma } from "../config/db.js";

const rewardInclude = {
  inventory: {
    include: {
      vouchers: {
        orderBy: [{ expiryDate: "asc" }, { code: "asc" }],
      },
    },
  },
};

const redemptionConflict = (code) => Object.assign(new Error(code), { code });

const exchangeInclude = {
  reward: true,
};

const findWalletByCustomer = (tx, idCustomer) =>
  tx.ecoWallet.findUnique({
    where: { idCustomer },
    include: {
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 30,
      },
    },
  });

export const findCustomerByAccountId = (idAccount) =>
  prisma.customer.findUnique({
    where: { idAccount },
    include: {
      wallet: {
        include: {
          transactions: {
            orderBy: { createdAt: "desc" },
            take: 30,
          },
        },
      },
      greenPassport: true,
      rewardExchanges: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          reward: true,
        },
      },
    },
  });

export const ensureWalletForCustomer = (idCustomer) =>
  prisma.ecoWallet.upsert({
    where: { idCustomer },
    create: { idCustomer, balance: 0 },
    update: {},
    include: {
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 30,
      },
    },
  });

export const findAvailableRewards = () =>
  prisma.reward.findMany({
    where: {
      type: "PHYSICAL_PRODUCT",
      OR: [
        { inventory: { is: { isUnlimited: true } } },
        { inventory: { is: { stockQuantity: { gt: 0 } } } },
      ],
    },
    orderBy: [{ pointCost: "asc" }, { name: "asc" }],
    include: rewardInclude,
  });

export const findExchangeByIdempotencyKey = (idempotencyKey) =>
  prisma.rewardExchange.findUnique({
    where: { idempotencyKey },
    include: exchangeInclude,
  });

export const findWalletByCustomerId = (idCustomer) =>
  prisma.ecoWallet.findUnique({
    where: { idCustomer },
    include: {
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 30,
      },
    },
  });

export const redeemReward = ({ idCustomer, rewardId, idempotencyKey }) =>
  prisma.$transaction(async (tx) => {
    const existingExchange = await tx.rewardExchange.findUnique({
      where: { idempotencyKey },
      include: exchangeInclude,
    });

    if (existingExchange) {
      if (existingExchange.idCustomer !== idCustomer || existingExchange.idReward !== rewardId) {
        return { error: "IDEMPOTENCY_KEY_CONFLICT" };
      }

      const wallet = await findWalletByCustomer(tx, idCustomer);
      return { exchange: existingExchange, wallet, idempotent: true };
    }

    const reward = await tx.reward.findUnique({
      where: { idReward: rewardId },
      include: rewardInclude,
    });

    if (!reward) {
      return { error: "REWARD_NOT_FOUND" };
    }

    if (reward.type !== "PHYSICAL_PRODUCT") {
      return { error: "UNSUPPORTED_REWARD_TYPE" };
    }

    const inventory = reward.inventory;

    if (!inventory || (!inventory.isUnlimited && inventory.stockQuantity <= 0)) {
      return { error: "OUT_OF_STOCK" };
    }

    const wallet = await tx.ecoWallet.upsert({
      where: { idCustomer },
      create: { idCustomer, balance: 0 },
      update: {},
    });

    if (wallet.balance < reward.pointCost) {
      return { error: "INSUFFICIENT_POINTS", balance: wallet.balance, pointCost: reward.pointCost };
    }

    if (!inventory.isUnlimited) {
      const inventoryUpdate = await tx.rewardInventory.updateMany({
        where: {
          idInventory: inventory.idInventory,
          stockQuantity: { gt: 0 },
        },
        data: {
          stockQuantity: { decrement: 1 },
        },
      });

      if (inventoryUpdate.count !== 1) {
        return { error: "OUT_OF_STOCK" };
      }
    }

    let voucherCodeUsed = null;

    if (reward.type === "DIGITAL_VOUCHER") {
      const now = new Date();
      const voucher = await tx.voucherCode.findFirst({
        where: {
          idInventory: inventory.idInventory,
          isUsed: false,
          OR: [{ expiryDate: null }, { expiryDate: { gt: now } }],
        },
        orderBy: [{ expiryDate: "asc" }, { code: "asc" }],
      });

      if (voucher) {
        const voucherUpdate = await tx.voucherCode.updateMany({
          where: {
            idVoucher: voucher.idVoucher,
            isUsed: false,
          },
          data: {
            isUsed: true,
          },
        });

        if (voucherUpdate.count !== 1) {
          throw redemptionConflict("OUT_OF_STOCK");
        }

        voucherCodeUsed = voucher.code;
      } else if (!inventory.isUnlimited) {
        throw redemptionConflict("OUT_OF_STOCK");
      }
    }

    const walletUpdate = await tx.ecoWallet.updateMany({
      where: {
        idWallet: wallet.idWallet,
        balance: { gte: reward.pointCost },
      },
      data: {
        balance: { decrement: reward.pointCost },
      },
    });

    if (walletUpdate.count !== 1) {
      throw redemptionConflict("INSUFFICIENT_POINTS");
    }

    await tx.transaction.create({
      data: {
        idWallet: wallet.idWallet,
        type: "REDEEM_REWARD",
        amount: -reward.pointCost,
        description: `Redeemed reward: ${reward.name}`,
      },
    });

    const exchange = await tx.rewardExchange.create({
      data: {
        idCustomer,
        idReward: reward.idReward,
        status: "SUCCESS",
        voucherCodeUsed,
        idempotencyKey,
      },
      include: exchangeInclude,
    });

    const updatedWallet = await findWalletByCustomer(tx, idCustomer);

    return { exchange, wallet: updatedWallet };
  });
