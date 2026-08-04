import asyncHandler from "../utils/asyncHandler.js";
import * as driverPickupsService from "../services/driverPickups.service.js";

export const listUnassigned = asyncHandler(async (req, res) => {
  const pickups = await driverPickupsService.listUnassignedPickups(req.user.id);
  res.json(pickups);
});

export const listMine = asyncHandler(async (req, res) => {
  const pickups = await driverPickupsService.listDriverPickups(req.user.id);
  res.json(pickups);
});

export const claim = asyncHandler(async (req, res) => {
  const result = await driverPickupsService.claimPickup(req.user.id, req.validated.params.id);
  res.json(result);
});

export const release = asyncHandler(async (req, res) => {
  const result = await driverPickupsService.releasePickup(req.user.id, req.validated.params.id);
  res.json(result);
});

export const updateStatus = asyncHandler(async (req, res) => {
  const result = await driverPickupsService.updatePickupStatus(
    req.user.id,
    req.validated.params.id,
    req.validated.body,
  );
  res.json(result);
});
