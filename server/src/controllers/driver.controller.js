import asyncHandler from "../utils/asyncHandler.js";
import * as driverService from "../services/driver.service.js";

export const list = asyncHandler(async (req, res) => {
  const drivers = await driverService.listDrivers(req.validated.query);
  res.json({ data: drivers });
});

export const getById = asyncHandler(async (req, res) => {
  const driver = await driverService.getDriver(req.validated.params.accountId);
  res.json({ data: driver });
});

export const create = asyncHandler(async (req, res) => {
  const driver = await driverService.createDriverAccount(req.validated.body);
  res.status(201).json({ data: driver });
});

export const getOwnProfile = asyncHandler(async (req, res) => {
  const driver = await driverService.getOwnDriverProfile(req.user.id);
  res.json({ data: driver });
});

export const updateOwnProfile = asyncHandler(async (req, res) => {
  const currentDriver = await driverService.getOwnDriverProfile(req.user.id);
  const driver = await driverService.updateOwnDriverProfile(req.user.id, req.validated.body);
  res.json({
    data: driver,
    message:
      currentDriver.status === "ACTIVE"
        ? "Driver profile updated successfully"
        : "Driver profile submitted and waiting for admin approval",
  });
});

export const approve = asyncHandler(async (req, res) => {
  const driver = await driverService.approveDriver(req.validated.params.accountId);
  res.json({ data: driver, message: "Driver approved successfully" });
});

export const enable = asyncHandler(async (req, res) => {
  const driver = await driverService.enableDriver(req.validated.params.accountId);
  res.json({ data: driver, message: "Driver enabled successfully" });
});

export const disable = asyncHandler(async (req, res) => {
  const driver = await driverService.disableDriver(req.validated.params.accountId);
  res.json({ data: driver, message: "Driver disabled successfully" });
});
