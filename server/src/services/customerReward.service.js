import AppError from "../utils/AppError.js";
import * as customerRewardRepository from "../repositories/customerReward.repository.js";

const mapReward = (reward, walletBalance = 0) => {
  const inventory = reward.inventory || {
    stockQuantity: 0,
    isUnlimited: false,
    vouchers: [],
  };
  const voucherTotal = inventory.vouchers?.length || 0;
  const voucherUsed = inventory.vouchers?.filter((voucher) => voucher.isUsed).length || 0;
  const availableStock = inventory.isUnlimited ? null : inventory.stockQuantity;

  return {
    id: reward.idReward,
    name: reward.name,
    description: reward.description || "",
    type: reward.type,
    pointCost: reward.pointCost,
    partnerName: reward.partnerName || "",
    imageUrl: reward.imageUrl || "",
    available: inventory.isUnlimited || inventory.stockQuantity > 0,
    canRedeem: walletBalance >= reward.pointCost && (inventory.isUnlimited || inventory.stockQuantity > 0),
    inventory: {
      stockQuantity: availableStock,
      isUnlimited: inventory.isUnlimited,
      voucherTotal,
      voucherUsed,
    },
  };
};

const mapTransaction = (transaction) => ({
  id: transaction.idTransaction,
  type: transaction.type,
  amount: transaction.amount,
  description: transaction.description || "",
  createdAt: transaction.createdAt,
});

const mapExchange = (exchange) => ({
  id: exchange.idExchange,
  rewardId: exchange.idReward,
  rewardName: exchange.reward?.name || "Reward",
  pointCost: exchange.reward?.pointCost || 0,
  status: exchange.status,
  voucherCode: exchange.voucherCodeUsed || "",
  createdAt: exchange.createdAt,
});

const getOwnCustomerOrThrow = async (accountId) => {
  const customer = await customerRewardRepository.findCustomerByAccountId(accountId);

  if (!customer) {
    throw new AppError("Customer profile not found", 404);
  }

  return customer;
};

export const getOwnWallet = async (accountId) => {
  const customer = await getOwnCustomerOrThrow(accountId);
  const wallet = customer.wallet || (await customerRewardRepository.ensureWalletForCustomer(customer.idCustomer));

  return {
    customer: {
      id: customer.idCustomer,
      fullName: customer.fullName,
      phoneNumber: customer.phoneNumber,
    },
    wallet: {
      id: wallet.idWallet,
      balance: wallet.balance,
      transactions: wallet.transactions.map(mapTransaction),
    },
    passport: customer.greenPassport
      ? {
          totalKg: customer.greenPassport.totalKg,
          totalCO2: customer.greenPassport.totalCO2,
          totalPoints: customer.greenPassport.totalPoints,
          level: customer.greenPassport.level,
          badge: customer.greenPassport.badge || "",
        }
      : {
          totalKg: 0,
          totalCO2: 0,
          totalPoints: 0,
          level: 1,
          badge: "",
        },
    exchanges: customer.rewardExchanges.map(mapExchange),
  };
};

export const listAvailableRewards = async (accountId) => {
  const customer = await getOwnCustomerOrThrow(accountId);
  const wallet = customer.wallet || (await customerRewardRepository.ensureWalletForCustomer(customer.idCustomer));
  const rewards = await customerRewardRepository.findAvailableRewards();

  return rewards.map((reward) => mapReward(reward, wallet.balance));
};

const mapRedemptionResult = (result) => ({
  exchange: mapExchange(result.exchange),
  wallet: {
    id: result.wallet.idWallet,
    balance: result.wallet.balance,
    transactions: result.wallet.transactions.map(mapTransaction),
  },
  idempotent: Boolean(result.idempotent),
});

export const redeemReward = async (accountId, rewardId, idempotencyKey) => {
  const customer = await getOwnCustomerOrThrow(accountId);

  try {
    const result = await customerRewardRepository.redeemReward({
      idCustomer: customer.idCustomer,
      rewardId,
      idempotencyKey,
    });

    if (result.error === "REWARD_NOT_FOUND") {
      throw new AppError("Reward not found", 404);
    }

    if (result.error === "OUT_OF_STOCK") {
      throw new AppError("This reward is out of stock", 409);
    }

    if (result.error === "UNSUPPORTED_REWARD_TYPE") {
      throw new AppError("Only physical product rewards can be redeemed", 409);
    }

    if (result.error === "INSUFFICIENT_POINTS") {
      throw new AppError("Not enough eco-points to redeem this reward", 409);
    }

    if (result.error === "IDEMPOTENCY_KEY_CONFLICT") {
      throw new AppError("This redemption request could not be verified. Please refresh and try again.", 409);
    }

    return mapRedemptionResult(result);
  } catch (error) {
    if (error.code === "P2002") {
      const existingExchange = await customerRewardRepository.findExchangeByIdempotencyKey(idempotencyKey);

      if (existingExchange?.idCustomer === customer.idCustomer && existingExchange.idReward === rewardId) {
        const wallet = await customerRewardRepository.findWalletByCustomerId(customer.idCustomer);
        return mapRedemptionResult({ exchange: existingExchange, wallet, idempotent: true });
      }

      throw new AppError("This redemption request could not be verified. Please refresh and try again.", 409);
    }

    if (error.code === "OUT_OF_STOCK") {
      throw new AppError("This reward is out of stock", 409);
    }

    if (error.code === "INSUFFICIENT_POINTS") {
      throw new AppError("Not enough eco-points to redeem this reward", 409);
    }

    throw error;
  }
};
