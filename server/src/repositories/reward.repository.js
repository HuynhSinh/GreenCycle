import { prisma } from "../config/db.js";

const buildRewardWhere = ({ q, type }) => {
  const where = {};

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { partnerName: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  if (type && type !== "ALL") {
    where.type = type;
  }

  return where;
};

const rewardInclude = {
  inventory: {
    include: {
      vouchers: true,
    },
  },
};

export const findRewards = ({ q, type, skip, take }) =>
  prisma.reward.findMany({
    where: buildRewardWhere({ q, type }),
    skip,
    take,
    orderBy: [{ name: "asc" }],
    include: rewardInclude,
  });

export const countRewards = ({ q, type }) =>
  prisma.reward.count({
    where: buildRewardWhere({ q, type }),
  });

export const countAvailableRewards = () =>
  prisma.reward.count({
    where: {
      OR: [
        { inventory: { is: { isUnlimited: true } } },
        { inventory: { is: { stockQuantity: { gt: 0 } } } },
      ],
    },
  });

export const countLowStockRewards = () =>
  prisma.rewardInventory.count({
    where: {
      isUnlimited: false,
      stockQuantity: {
        lte: 10,
      },
    },
  });

export const findRewardById = (idReward) =>
  prisma.reward.findUnique({
    where: { idReward },
    include: rewardInclude,
  });

export const findCustomerByAccountId = (idAccount) =>
  prisma.customer.findUnique({
    where: { idAccount },
  });

export const findWalletByCustomerId = (idCustomer) =>
  prisma.ecoWallet.findUnique({
    where: { idCustomer },
    include: { transactions: true },
  });

export const createRewardExchange = ({ idCustomer, idReward, status, voucherCodeUsed }) =>
  prisma.rewardExchange.create({
    data: {
      idCustomer,
      idReward,
      status,
      voucherCodeUsed,
    },
  });

export const updateVoucherCode = ({ idVoucher, data }) =>
  prisma.voucherCode.update({
    where: { idVoucher },
    data,
  });

export const updateWallet = ({ idWallet, data }) =>
  prisma.ecoWallet.update({
    where: { idWallet },
    data,
  });

export const createTransaction = ({ idWallet, type, amount, description }) =>
  prisma.transaction.create({
    data: {
      idWallet,
      type,
      amount,
      description,
    },
  });

export const updateReward = ({ rewardId, reward, inventory }) =>
  prisma.reward.update({
    where: { idReward: rewardId },
    data: {
      ...reward,
      ...(inventory
        ? {
            inventory: {
              upsert: {
                create: inventory,
                update: inventory,
              },
            },
          }
        : {}),
    },
    include: rewardInclude,
  });

export const updateRewardInventory = ({ rewardId, inventory }) =>
  prisma.rewardInventory.upsert({
    where: { idReward: rewardId },
    create: {
      idReward: rewardId,
      ...inventory,
    },
    update: inventory,
  });
