import asyncHandler from "../utils/asyncHandler.js";
import * as rewardService from "../services/reward.service.js";

export const list = asyncHandler(async (req, res) => {
  const rewards = await rewardService.listRewards(req.validated.query);
  res.json({ data: rewards });
});

export const create = asyncHandler(async (req, res) => {
  const reward = await rewardService.createReward(req.validated.body);
  res.status(201).json({ data: reward });
});

export const update = asyncHandler(async (req, res) => {
  const reward = await rewardService.updateReward(req.validated.params.rewardId, req.validated.body);
  res.json({ data: reward });
});

export const updateInventory = asyncHandler(async (req, res) => {
  const reward = await rewardService.updateRewardInventory(req.validated.params.rewardId, req.validated.body);
  res.json({ data: reward });
});

export const remove = asyncHandler(async (req, res) => {
  const result = await rewardService.deleteReward(req.validated.params.rewardId);
  res.json(result);
});
