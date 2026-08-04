import AppError from "../utils/AppError.js";
import * as driverAssignmentRepository from "../repositories/driverAssignment.repository.js";

const activeStatuses = ["ASSIGNED", "COLLECTING", "ARRIVED"];
const terminalStatuses = ["COLLECTED", "FAILED", "CANCELLED", "REJECTED"];

const formatTime = (date) =>
  new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);

const mapAssignment = (assignment) => ({
  id: assignment.idAssignment,
  assignedAt: assignment.assignedAt,
  routeOrder: assignment.routeOrder,
  status: assignment.request.status,
  canWork: activeStatuses.includes(assignment.request.status),
  customer: assignment.request.customer?.fullName || "Unknown customer",
  address: assignment.request.address?.addressLine || "Unknown address",
  ward: assignment.request.address?.ward || "Unspecified ward",
  district: assignment.request.address?.district || "Unspecified district",
  scheduledTime: assignment.request.scheduledTime,
  scheduledTimeLabel: formatTime(assignment.request.scheduledTime),
  totalWeight: assignment.request.totalWeight,
  note: assignment.request.note || "",
  wasteItems: assignment.request.wasteItems.map((item) => ({
    id: item.idItem,
    category: item.category?.name || "Waste item",
    scheduledWeight: item.weight,
    actualWeight: item.weight,
    pointsEarned: item.pointsEarned,
    evidenceCount: item.images?.length || 0,
  })),
  timeline: assignment.request.timeline.map((entry) => ({
    id: entry.idTimeline,
    status: entry.status,
    note: entry.note || "",
    createdAt: entry.createdAt,
  })),
});

const getOwnDriver = async (accountId) => {
  const driver = await driverAssignmentRepository.findDriverByAccountId(accountId);

  if (!driver) {
    throw new AppError("Driver profile is not completed yet", 409);
  }

  if (!driver.isActive) {
    throw new AppError("Driver must be approved before working on assignments", 409);
  }

  return driver;
};

export const listOwnAssignments = async (accountId) => {
  const driver = await getOwnDriver(accountId);
  const assignmentsRaw = await driverAssignmentRepository.findAssignmentsByDriver(driver.idDriver);
  const assignments = assignmentsRaw.map(mapAssignment);

  return {
    activeAssignmentId: assignments.find((assignment) => ["COLLECTING", "ARRIVED"].includes(assignment.status))?.id || null,
    assignments,
  };
};

export const updateOwnAssignmentStatus = async (accountId, assignmentId, payload) => {
  const driver = await getOwnDriver(accountId);
  const assignment = await driverAssignmentRepository.findAssignmentForDriver({
    idAssignment: assignmentId,
    idDriver: driver.idDriver,
  });

  if (!assignment) {
    throw new AppError("Assignment not found", 404);
  }

  if (terminalStatuses.includes(assignment.request.status)) {
    throw new AppError("This assignment is already closed", 409);
  }

  if (["COLLECTING", "ARRIVED"].includes(payload.status)) {
    const inProgressCount = await driverAssignmentRepository.countInProgressAssignments({
      idDriver: driver.idDriver,
      excludeAssignmentId: assignmentId,
    });

    if (inProgressCount > 0) {
      throw new AppError("Driver can only work on one assignment at a time", 409);
    }
  }

  if (payload.status === "COLLECTING" && assignment.request.status !== "ASSIGNED") {
    throw new AppError("Only assigned pickups can be started", 409);
  }

  if (payload.status === "ARRIVED" && assignment.request.status !== "COLLECTING") {
    throw new AppError("Driver must start the pickup before marking arrival", 409);
  }

  if (payload.status === "COLLECTED" && !["COLLECTING", "ARRIVED"].includes(assignment.request.status)) {
    throw new AppError("Driver must start the pickup before collecting items", 409);
  }

  const items = [];
  const evidenceImages = [];

  if (payload.status === "COLLECTED") {
    if (!payload.evidenceImageDataUri) {
      throw new AppError("Evidence image is required when marking a pickup as collected", 400);
    }

    if (payload.items.length !== assignment.request.wasteItems.length) {
      throw new AppError("Actual weight is required for every scheduled waste item", 400);
    }

    const scheduledItems = new Map(assignment.request.wasteItems.map((item) => [item.idItem, item]));
    const receivedItemIds = new Set();

    for (const item of payload.items) {
      const scheduledItem = scheduledItems.get(item.wasteItemId);

      if (!scheduledItem) {
        throw new AppError("Actual weight contains an invalid waste item", 400);
      }

      if (receivedItemIds.has(item.wasteItemId)) {
        throw new AppError("Actual weight contains a duplicate waste item", 400);
      }

      receivedItemIds.add(item.wasteItemId);

      items.push({
        wasteItemId: item.wasteItemId,
        actualWeight: item.actualWeight,
        pointsEarned: Math.round(item.actualWeight * (scheduledItem.category?.pointFactor || 0)),
      });
      evidenceImages.push({
        idItem: item.wasteItemId,
        url: payload.evidenceImageDataUri,
        type: "COLLECTION_EVIDENCE",
      });
    }
  }

  await driverAssignmentRepository.updateAssignmentResult({
    requestId: assignment.request.idRequest,
    status: payload.status,
    note: payload.note || `Driver updated pickup to ${payload.status}`,
    createdBy: accountId,
    items,
    evidenceImages,
  });

  const updatedAssignment = await driverAssignmentRepository.findAssignmentForDriver({
    idAssignment: assignmentId,
    idDriver: driver.idDriver,
  });

  return mapAssignment(updatedAssignment);
};
