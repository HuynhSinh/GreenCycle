import AppError from "../utils/AppError.js";
import * as rewardRepository from "../repositories/reward.repository.js";
import { uploadRewardImage } from "./cloudinary.service.js";

const mapReward = (reward) => {
  const inventory = reward.inventory || {
    stockQuantity: 0,
    isUnlimited: false,
    vouchers: [],
  };
  const voucherTotal = inventory.vouchers?.length || 0;
  const voucherUsed = inventory.vouchers?.filter((voucher) => voucher.isUsed).length || 0;

  return {
    id: reward.idReward,
    name: reward.name,
    description: reward.description || "",
    type: reward.type,
    pointCost: reward.pointCost,
    partnerName: reward.partnerName || "",
    imageUrl: reward.imageUrl || "",
    available: inventory.isUnlimited || inventory.stockQuantity > 0,
    inventory: {
      stockQuantity: inventory.stockQuantity,
      isUnlimited: inventory.isUnlimited,
      voucherTotal,
      voucherUsed,
    },
  };
};

const buildRewardData = async (payload) => {
  const reward = {};
  const inventory = {};

  if (payload.name !== undefined) reward.name = payload.name;
  if (payload.description !== undefined) reward.description = payload.description || null;
  if (payload.type !== undefined) reward.type = payload.type;
  if (payload.pointCost !== undefined) reward.pointCost = payload.pointCost;
  if (payload.partnerName !== undefined) reward.partnerName = payload.partnerName || null;
  if (payload.imageUrl !== undefined) reward.imageUrl = payload.imageUrl || null;

  if (payload.imageDataUri) {
    reward.imageUrl = await uploadRewardImage(payload.imageDataUri);
  }

  if (payload.stockQuantity !== undefined) inventory.stockQuantity = payload.stockQuantity;
  if (payload.isUnlimited !== undefined) inventory.isUnlimited = payload.isUnlimited;

  return {
    reward,
    inventory: Object.keys(inventory).length > 0 ? inventory : null,
  };
};

export const listRewards = async ({ q, type, page = 1, limit = 20 }) => {
  const skip = (page - 1) * limit;
  const [rewardsRaw, total, availableRewards, lowStockRewards] = await Promise.all([
    rewardRepository.findRewards({ q, type, skip, take: limit }),
    rewardRepository.countRewards({ q, type }),
    rewardRepository.countAvailableRewards(),
    rewardRepository.countLowStockRewards(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    metrics: {
      totalRewards: total,
      availableRewards,
      lowStockRewards,
    },
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
    },
    rewards: rewardsRaw.map(mapReward),
  };
};

export const createReward = async (payload) => {
  const { reward, inventory } = await buildRewardData(payload);

  const created = await rewardRepository.createReward({
    reward,
    inventory: {
      stockQuantity: inventory?.stockQuantity || 0,
      isUnlimited: inventory?.isUnlimited || false,
    },
  });

  return mapReward(created);
};

export const updateReward = async (rewardId, payload) => {
  const existingReward = await rewardRepository.findRewardById(rewardId);

  if (!existingReward) {
    throw new AppError("Reward not found", 404);
  }

  const { reward, inventory } = await buildRewardData(payload);
  const updated = await rewardRepository.updateReward({ rewardId, reward, inventory });

  return mapReward(updated);
};

export const updateRewardInventory = async (rewardId, payload) => {
  const existingReward = await rewardRepository.findRewardById(rewardId);

  if (!existingReward) {
    throw new AppError("Reward not found", 404);
  }

  await rewardRepository.updateRewardInventory({ rewardId, inventory: payload });

  const updatedReward = await rewardRepository.findRewardById(rewardId);
  return mapReward(updatedReward);
};
