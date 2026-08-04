import asyncHandler from "../utils/asyncHandler.js";
import * as driverAssignmentService from "../services/driverAssignment.service.js";

export const listOwn = asyncHandler(async (req, res) => {
  const assignments = await driverAssignmentService.listOwnAssignments(req.user.id);
  res.json({ data: assignments });
});

export const updateStatus = asyncHandler(async (req, res) => {
  const assignment = await driverAssignmentService.updateOwnAssignmentStatus(
    req.user.id,
    req.validated.params.assignmentId,
    req.validated.body,
  );

  res.json({
    data: assignment,
    message: "Assignment updated successfully",
  });
});
