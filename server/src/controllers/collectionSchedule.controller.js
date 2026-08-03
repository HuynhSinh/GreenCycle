import asyncHandler from "../utils/asyncHandler.js";
import * as collectionScheduleService from "../services/collectionSchedule.service.js";

export const list = asyncHandler(async (req, res) => {
  const schedule = await collectionScheduleService.listSchedule(req.validated.query);
  res.json({ data: schedule });
});

export const assign = asyncHandler(async (req, res) => {
  const result = await collectionScheduleService.assignSchedule(req.validated.body, req.user.id);
  res.json(result);
});

export const approve = asyncHandler(async (req, res) => {
  const result = await collectionScheduleService.approveSchedule(req.validated.params.requestId, req.user.id);
  res.json(result);
});

export const reject = asyncHandler(async (req, res) => {
  const result = await collectionScheduleService.rejectSchedule(
    req.validated.params.requestId,
    req.validated.body.reason,
    req.user.id,
  );
  res.json(result);
});
