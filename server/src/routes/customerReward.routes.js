import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import * as customerRewardController from "../controllers/customerReward.controller.js";
import { redeemRewardSchema } from "../validators/customerReward.validator.js";

const router = Router();

router.get(
  "/customer/wallet",
  requireAuth,
  requireRole("CUSTOMER"),
  customerRewardController.getWallet,
);

router.get(
  "/customer/rewards",
  requireAuth,
  requireRole("CUSTOMER"),
  customerRewardController.listRewards,
);

router.post(
  "/customer/rewards/:rewardId/redeem",
  requireAuth,
  requireRole("CUSTOMER"),
  validate(redeemRewardSchema),
  customerRewardController.redeemReward,
);

export default router;
