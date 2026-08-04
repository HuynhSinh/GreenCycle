import AppError from "../utils/AppError.js";
import * as collectionScheduleRepository from "../repositories/collectionSchedule.repository.js";

const toDayRange = (dateString) => {
  const date = dateString ? new Date(`${dateString}T00:00:00.000Z`) : new Date();
  const startDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const endDate = new Date(startDate);
  endDate.setUTCDate(endDate.getUTCDate() + 1);

  return { startDate, endDate };
};

const toDayRangeFromDate = (date) => {
  const startDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const endDate = new Date(startDate);
  endDate.setUTCDate(endDate.getUTCDate() + 1);

  return { startDate, endDate };
};

const formatTime = (date) =>
  new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);

const formatWeight = (weight) => {
  const rounded = Number(weight || 0).toFixed(1).replace(/\.0$/, "");
  return `${rounded} kg`;
};

const mapRequest = (request) => {
  const evidenceImagesByUrl = new Map();

  for (const item of request.wasteItems) {
    for (const image of item.images || []) {
      if (image.type !== "COLLECTION_EVIDENCE" || evidenceImagesByUrl.has(image.url)) continue;

      evidenceImagesByUrl.set(image.url, {
        id: image.idImage,
        url: image.url,
        type: image.type,
        category: "Collection evidence",
        createdAt: image.createdAt,
      });
    }
  }

  return {
    id: request.idRequest,
    customer: request.customer?.fullName || "Unknown customer",
    address: request.address?.addressLine || "Unknown address",
    ward: request.address?.ward || "Unspecified ward",
    district: request.address?.district || "Unspecified district",
    preferredTime: request.note?.match(/preferred:\s*([^;]+)/i)?.[1] || formatTime(request.scheduledTime),
    scheduledTime: formatTime(request.scheduledTime),
    status: request.status,
    weight: formatWeight(request.totalWeight || request.wasteItems.reduce((total, item) => total + item.weight, 0)),
    items: request.wasteItems.map((item) => item.category?.name).filter(Boolean).join(", ") || "E-waste items",
    evidenceImages: [...evidenceImagesByUrl.values()],
    driverId: request.assignment?.idDriver || null,
    priority: request.totalWeight >= 15 ? "High" : "Normal",
  };
};

const mapDriver = (driver, hasDateFilter) => {
  const assignedWeight = driver.assignments.reduce(
    (total, assignment) => total + (assignment.request?.totalWeight || 0),
    0,
  );

  return {
    id: driver.idDriver,
    name: driver.fullName,
    vehicle: [driver.vehicleInfo, driver.licensePlate].filter(Boolean).join(" - ") || "Vehicle not set",
    active: driver.isActive,
    maxCapacityKg: driver.maxCapacityKg,
    load: formatWeight(assignedWeight),
    window: driver.isActive
      ? `${hasDateFilter ? "Available on selected date" : "Active"} (${formatWeight(driver.maxCapacityKg)} max)`
      : "Inactive",
    assignments: driver.assignments.length,
    conflict: false,
  };
};

const getStatusCount = (statusCounts, status) =>
  statusCounts.find((item) => item.status === status)?._count?._all || 0;

const buildMetrics = (statusCounts, drivers) => ({
  requestsToSchedule: ["PENDING", "VERIFYING", "APPROVED"].reduce(
    (total, status) => total + getStatusCount(statusCounts, status),
    0,
  ),
  assignedPickups: getStatusCount(statusCounts, "ASSIGNED"),
  activeDrivers: drivers.filter((driver) => driver.active).length,
  timeConflicts: drivers.filter((driver) => driver.conflict).length,
});

export const listSchedule = async ({ date, district = "", status = "ALL", page = 1, limit = 20 }) => {
  const { startDate, endDate } = date ? toDayRange(date) : { startDate: null, endDate: null };
  const skip = (page - 1) * limit;

  const [requestsRaw, totalRequests, statusCounts, driversRaw] = await Promise.all([
    collectionScheduleRepository.findPickupRequestsForSchedule({ startDate, endDate, district, status, skip, take: limit }),
    collectionScheduleRepository.countPickupRequestsForSchedule({ startDate, endDate, district, status }),
    collectionScheduleRepository.countPickupRequestsByStatusForSchedule({
      startDate,
      endDate,
      district,
      statuses: ["PENDING", "VERIFYING", "APPROVED", "ASSIGNED"],
    }),
    collectionScheduleRepository.findDriversForSchedule({ startDate, endDate }),
  ]);

  const requests = requestsRaw.map(mapRequest);
  const drivers = driversRaw.map((driver) => mapDriver(driver, Boolean(date)));
  const totalPages = Math.max(1, Math.ceil(totalRequests / limit));

  return {
    metrics: buildMetrics(statusCounts, drivers),
    pagination: {
      page,
      limit,
      total: totalRequests,
      totalPages,
      hasNextPage: page < totalPages,
    },
    requests,
    drivers,
    source: "database",
  };
};

export const assignSchedule = async ({ requestId, driverId, routeOrder }, actorId) => {
  const [request, driver] = await Promise.all([
    collectionScheduleRepository.findPickupRequestById(requestId),
    collectionScheduleRepository.findDriverById(driverId),
  ]);

  if (!request) {
    throw new AppError("Pickup request not found", 404);
  }

  if (!driver) {
    throw new AppError("Driver not found", 404);
  }

  if (!driver.isActive) {
    throw new AppError("Only active drivers can receive new assignments", 409);
  }

  if (!driver.maxCapacityKg || driver.maxCapacityKg <= 0) {
    throw new AppError("Driver vehicle capacity must be configured before assignment", 409);
  }

  if (request.status !== "APPROVED") {
    throw new AppError("Only approved pickup requests can be assigned", 409);
  }

  const { startDate, endDate } = toDayRangeFromDate(request.scheduledTime);
  const assignedWeight = await collectionScheduleRepository.sumDriverAssignedWeightForSchedule({
    idDriver: driverId,
    startDate,
    endDate,
    excludeRequestId: requestId,
  });

  if (assignedWeight + request.totalWeight > driver.maxCapacityKg) {
    throw new AppError(
      `Driver capacity exceeded`,
      409,
    );
  }

  const conflictCount = await collectionScheduleRepository.countDriverAssignmentsAtTime({
    idDriver: driverId,
    scheduledTime: request.scheduledTime,
    excludeRequestId: requestId,
  });

  if (conflictCount > 0) {
    throw new AppError("Driver already has an active assignment at this requested time", 409);
  }

  await collectionScheduleRepository.runInTransaction([
    collectionScheduleRepository.updatePickupSchedule({
      requestId,
      status: "ASSIGNED",
    }),
    collectionScheduleRepository.upsertAssignment({
      requestId,
      driverId,
      routeOrder,
    }),
    collectionScheduleRepository.createPickupTimeline({
      requestId,
      status: "ASSIGNED",
      note: "Pickup assigned by admin using the customer's requested time",
      createdBy: actorId,
    }),
  ]);

  return { message: "Pickup scheduled and assigned successfully" };
};

export const approveSchedule = async (requestId, actorId) => {
  const request = await collectionScheduleRepository.findPickupRequestById(requestId);

  if (!request) {
    throw new AppError("Pickup request not found", 404);
  }

  if (!["PENDING", "VERIFYING", "APPROVED"].includes(request.status)) {
    throw new AppError("Only pending or verifying requests can be approved", 409);
  }

  if (request.status === "APPROVED") {
    return { message: "Pickup request is already approved" };
  }

  await collectionScheduleRepository.runInTransaction([
    collectionScheduleRepository.updatePickupSchedule({
      requestId,
      status: "APPROVED",
    }),
    collectionScheduleRepository.createPickupTimeline({
      requestId,
      status: "APPROVED",
      note: "Pickup request approved by admin",
      createdBy: actorId,
    }),
  ]);

  return { message: "Pickup request approved successfully" };
};

export const rejectSchedule = async (requestId, reason, actorId) => {
  const request = await collectionScheduleRepository.findPickupRequestById(requestId);

  if (!request) {
    throw new AppError("Pickup request not found", 404);
  }

  if (!["PENDING", "VERIFYING", "APPROVED"].includes(request.status)) {
    throw new AppError("Only pending, verifying, or approved requests can be rejected", 409);
  }

  await collectionScheduleRepository.runInTransaction([
    collectionScheduleRepository.updatePickupSchedule({
      requestId,
      status: "REJECTED",
    }),
    collectionScheduleRepository.createPickupTimeline({
      requestId,
      status: "REJECTED",
      note: reason || "Rejected by admin",
      createdBy: actorId,
    }),
  ]);

  return { message: "Pickup request rejected successfully" };
};
