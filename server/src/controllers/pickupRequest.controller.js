import asyncHandler from "../utils/asyncHandler.js";
import * as pickupRequestService from "../services/pickupRequest.service.js";

export const create = asyncHandler(async (req, res) => {
  const result = await pickupRequestService.createPickupRequest(
    req.user.id,
    req.validated.body,
  );
  res.status(201).json(result);
});
