import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createRewardSchema,
  listRewardsSchema,
  updateRewardInventorySchema,
  updateRewardSchema,
} from "../validators/reward.validator.js";
import * as rewardController from "../controllers/reward.controller.js";

const router = Router();

router.get(
  "/admin/rewards",
  requireAuth,
  requireRole("ADMIN"),
  validate(listRewardsSchema),
  rewardController.list,
);

router.post(
  "/admin/rewards",
  requireAuth,
  requireRole("ADMIN"),
  validate(createRewardSchema),
  rewardController.create,
);

router.put(
  "/admin/rewards/:rewardId",
  requireAuth,
  requireRole("ADMIN"),
  validate(updateRewardSchema),
  rewardController.update,
);

router.patch(
  "/admin/rewards/:rewardId/inventory",
  requireAuth,
  requireRole("ADMIN"),
  validate(updateRewardInventorySchema),
  rewardController.updateInventory,
);

export default router;
