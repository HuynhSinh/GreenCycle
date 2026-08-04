import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  pickupIdParamsSchema,
  updatePickupStatusSchema,
} from "../validators/driverPickups.validator.js";
import * as driverPickupsController from "../controllers/driverPickups.controller.js";

const router = Router();

router.get(
  "/driver/pickups/unassigned",
  requireAuth,
  requireRole("DRIVER"),
  driverPickupsController.listUnassigned,
);

router.get(
  "/driver/pickups",
  requireAuth,
  requireRole("DRIVER"),
  driverPickupsController.listMine,
);

router.post(
  "/driver/pickups/:id/claim",
  requireAuth,
  requireRole("DRIVER"),
  validate(pickupIdParamsSchema),
  driverPickupsController.claim,
);

router.post(
  "/driver/pickups/:id/release",
  requireAuth,
  requireRole("DRIVER"),
  validate(pickupIdParamsSchema),
  driverPickupsController.release,
);

router.patch(
  "/driver/pickups/:id/status",
  requireAuth,
  requireRole("DRIVER"),
  validate(updatePickupStatusSchema),
  driverPickupsController.updateStatus,
);

export default router;
