import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  getCustomerWalletSchema,
  redeemRewardSchema,
  listRewardsSchema,
} from "../validators/reward.validator.js";
import * as customerRewardController from "../controllers/customerReward.controller.js";
import * as rewardController from "../controllers/reward.controller.js";

const router = Router();

router.get(
  "/customer/wallet",
  requireAuth,
  requireRole("CUSTOMER"),
  validate(getCustomerWalletSchema),
  customerRewardController.getWallet,
);

router.get(
  "/customer/rewards",
  requireAuth,
  requireRole("CUSTOMER"),
  validate(listRewardsSchema),
  rewardController.list,
);

router.post(
  "/customer/rewards/:rewardId/redeem",
  requireAuth,
  requireRole("CUSTOMER"),
  validate(redeemRewardSchema),
  customerRewardController.redeemReward,
);

export default router;
