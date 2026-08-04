import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createCustomerPickupSchema,
  customerPickupParamsSchema,
  updateCustomerPickupSchema,
} from "../validators/customerPickup.validator.js";
import * as customerPickupController from "../controllers/customerPickup.controller.js";

const router = Router();

router.get(
  "/customer/pickup-booking",
  requireAuth,
  requireRole("CUSTOMER"),
  customerPickupController.bookingData,
);

router.get(
  "/customer/pickups",
  requireAuth,
  requireRole("CUSTOMER"),
  customerPickupController.listOwn,
);

router.post(
  "/customer/pickups",
  requireAuth,
  requireRole("CUSTOMER"),
  validate(createCustomerPickupSchema),
  customerPickupController.createOwn,
);

router.get(
  "/customer/pickups/:pickupId",
  requireAuth,
  requireRole("CUSTOMER"),
  validate(customerPickupParamsSchema),
  customerPickupController.getOwn,
);

router.put(
  "/customer/pickups/:pickupId",
  requireAuth,
  requireRole("CUSTOMER"),
  validate(updateCustomerPickupSchema),
  customerPickupController.updateOwn,
);

router.patch(
  "/customer/pickups/:pickupId/cancel",
  requireAuth,
  requireRole("CUSTOMER"),
  validate(customerPickupParamsSchema),
  customerPickupController.cancelOwn,
);

export default router;
