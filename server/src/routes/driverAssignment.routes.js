import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { updateDriverAssignmentStatusSchema } from "../validators/driverAssignment.validator.js";
import * as driverAssignmentController from "../controllers/driverAssignment.controller.js";

const router = Router();

router.get(
  "/driver/assignments",
  requireAuth,
  requireRole("DRIVER"),
  driverAssignmentController.listOwn,
);

router.patch(
  "/driver/assignments/:assignmentId/status",
  requireAuth,
  requireRole("DRIVER"),
  validate(updateDriverAssignmentStatusSchema),
  driverAssignmentController.updateStatus,
);

export default router;
