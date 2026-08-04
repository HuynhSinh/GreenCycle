import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createPickupRequestSchema } from "../validators/pickupRequest.validator.js";
import * as pickupRequestController from "../controllers/pickupRequest.controller.js";

const router = Router();

router.post(
  "/customer/pickup-requests",
  requireAuth,
  requireRole("CUSTOMER"),
  validate(createPickupRequestSchema),
  pickupRequestController.create,
);

export default router;
