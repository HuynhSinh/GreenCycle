import { prisma } from "../config/db.js";

const buildRewardWhere = ({ q, type }) => {
  const where = {
    type: type && type !== "ALL" ? type : "PHYSICAL_PRODUCT",
  };

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { partnerName: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
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
      type: "PHYSICAL_PRODUCT",
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
      reward: {
        type: "PHYSICAL_PRODUCT",
      },
    },
  });

export const findRewardById = (idReward) =>
  prisma.reward.findUnique({
    where: { idReward },
    include: rewardInclude,
  });

export const createReward = ({ reward, inventory }) =>
  prisma.reward.create({
    data: {
      ...reward,
      inventory: {
        create: inventory,
      },
    },
    include: rewardInclude,
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

export const countRewardExchanges = (rewardId) =>
  prisma.rewardExchange.count({
    where: { idReward: rewardId },
  });

export const deleteReward = (rewardId) =>
  prisma.$transaction(async (tx) => {
    const inventory = await tx.rewardInventory.findUnique({
      where: { idReward: rewardId },
      select: { idInventory: true },
    });

    if (inventory) {
      await tx.voucherCode.deleteMany({
        where: { idInventory: inventory.idInventory },
      });

      await tx.rewardInventory.delete({
        where: { idInventory: inventory.idInventory },
      });
    }

    await tx.reward.delete({
      where: { idReward: rewardId },
    });
  });
