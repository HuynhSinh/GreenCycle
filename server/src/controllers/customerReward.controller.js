import asyncHandler from "../utils/asyncHandler.js";
import * as customerRewardService from "../services/reward.service.js";

export const getWallet = asyncHandler(async (req, res) => {
  const wallet = await customerRewardService.getCustomerWallet(req.user.id);
  res.json({ data: wallet });
});

export const redeemReward = asyncHandler(async (req, res) => {
  const result = await customerRewardService.redeemReward(req.user.id, req.validated.params.rewardId);
  res.json({ data: result });
});
