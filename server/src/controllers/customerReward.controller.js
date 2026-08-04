import asyncHandler from "../utils/asyncHandler.js";
import * as customerRewardService from "../services/customerReward.service.js";

export const getWallet = asyncHandler(async (req, res) => {
  const wallet = await customerRewardService.getOwnWallet(req.user.id);
  res.json({ data: wallet });
});

export const listRewards = asyncHandler(async (req, res) => {
  const rewards = await customerRewardService.listAvailableRewards(req.user.id);
  res.json({ data: { rewards } });
});

export const redeemReward = asyncHandler(async (req, res) => {
  const result = await customerRewardService.redeemReward(req.user.id, req.validated.params.rewardId);
  res.status(201).json({
    message: "Reward exchange request created successfully.",
    data: result,
  });
});
