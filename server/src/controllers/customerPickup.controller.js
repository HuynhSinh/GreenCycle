import asyncHandler from "../utils/asyncHandler.js";
import * as customerPickupService from "../services/customerPickup.service.js";

export const bookingData = asyncHandler(async (req, res) => {
  const data = await customerPickupService.getBookingData(req.user.id);
  res.json({ data });
});

export const listOwn = asyncHandler(async (req, res) => {
  const pickups = await customerPickupService.listOwnPickups(req.user.id);
  res.json({ data: { pickups } });
});

export const getOwn = asyncHandler(async (req, res) => {
  const pickup = await customerPickupService.getOwnPickup(req.user.id, req.validated.params.pickupId);
  res.json({ data: pickup });
});

export const createOwn = asyncHandler(async (req, res) => {
  const pickup = await customerPickupService.createOwnPickup(req.user.id, req.validated.body);
  res.status(201).json({
    data: pickup,
    message: "Pickup request submitted successfully",
  });
});

export const updateOwn = asyncHandler(async (req, res) => {
  const pickup = await customerPickupService.updateOwnPickup(
    req.user.id,
    req.validated.params.pickupId,
    req.validated.body,
  );
  res.json({
    data: pickup,
    message: "Pickup request updated successfully",
  });
});

export const cancelOwn = asyncHandler(async (req, res) => {
  const pickup = await customerPickupService.cancelOwnPickup(req.user.id, req.validated.params.pickupId);
  res.json({
    data: pickup,
    message: "Pickup request cancelled successfully",
  });
});
