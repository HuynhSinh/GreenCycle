import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createDriverAccountSchema,
  driverAccountParamsSchema,
  listDriversSchema,
  updateOwnDriverProfileSchema,
} from "../validators/driver.validator.js";
import * as driverController from "../controllers/driver.controller.js";

const router = Router();

router.get(
  "/driver/profile",
  requireAuth,
  requireRole("DRIVER"),
  driverController.getOwnProfile,
);

router.put(
  "/driver/profile",
  requireAuth,
  requireRole("DRIVER"),
  validate(updateOwnDriverProfileSchema),
  driverController.updateOwnProfile,
);

router.get(
  "/admin/drivers",
  requireAuth,
  requireRole("ADMIN"),
  validate(listDriversSchema),
  driverController.list,
);

router.post(
  "/admin/drivers",
  requireAuth,
  requireRole("ADMIN"),
  validate(createDriverAccountSchema),
  driverController.create,
);

router.get(
  "/admin/drivers/:accountId",
  requireAuth,
  requireRole("ADMIN"),
  validate(driverAccountParamsSchema),
  driverController.getById,
);

router.patch(
  "/admin/drivers/:accountId/approve",
  requireAuth,
  requireRole("ADMIN"),
  validate(driverAccountParamsSchema),
  driverController.approve,
);

router.patch(
  "/admin/drivers/:accountId/enable",
  requireAuth,
  requireRole("ADMIN"),
  validate(driverAccountParamsSchema),
  driverController.enable,
);

router.patch(
  "/admin/drivers/:accountId/disable",
  requireAuth,
  requireRole("ADMIN"),
  validate(driverAccountParamsSchema),
  driverController.disable,
);

export default router;
