import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  assignCollectionScheduleSchema,
  approveCollectionScheduleSchema,
  listCollectionScheduleSchema,
  rejectCollectionScheduleSchema,
} from "../validators/collectionSchedule.validator.js";
import * as collectionScheduleController from "../controllers/collectionSchedule.controller.js";

const router = Router();

router.get(
  "/admin/collection-schedules",
  requireAuth,
  requireRole("ADMIN"),
  validate(listCollectionScheduleSchema),
  collectionScheduleController.list,
);

router.patch(
  "/admin/collection-schedules/assign",
  requireAuth,
  requireRole("ADMIN"),
  validate(assignCollectionScheduleSchema),
  collectionScheduleController.assign,
);

router.patch(
  "/admin/collection-schedules/:requestId/approve",
  requireAuth,
  requireRole("ADMIN"),
  validate(approveCollectionScheduleSchema),
  collectionScheduleController.approve,
);

router.patch(
  "/admin/collection-schedules/:requestId/reject",
  requireAuth,
  requireRole("ADMIN"),
  validate(rejectCollectionScheduleSchema),
  collectionScheduleController.reject,
);

export default router;
