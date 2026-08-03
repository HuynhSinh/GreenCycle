import AppError from "../utils/AppError.js";
import * as collectionScheduleRepository from "../repositories/collectionSchedule.repository.js";

const toDayRange = (dateString) => {
  const date = dateString ? new Date(`${dateString}T00:00:00.000Z`) : new Date();
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

const routeTitle = (scheduledDate, district) => {
  const hour = Number(formatTime(scheduledDate).slice(0, 2));
  const period = hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Evening";
  return `${period} ${district} Route`;
};

const mapRequest = (request) => ({
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
  cluster: request.assignment?.cluster
    ? routeTitle(request.assignment.cluster.scheduledDate, request.assignment.cluster.district)
    : "Unclustered",
  clusterId: request.assignment?.idCluster || null,
  driverId: request.assignment?.idDriver || null,
  priority: request.totalWeight >= 15 ? "High" : "Normal",
});

const mapDriver = (driver) => {
  const assignedWeight = driver.assignments.reduce(
    (total, assignment) => total + (assignment.request?.totalWeight || 0),
    0,
  );

  return {
    id: driver.idDriver,
    name: driver.fullName,
    vehicle: [driver.vehicleInfo, driver.licensePlate].filter(Boolean).join(" - ") || "Vehicle not set",
    active: driver.isActive,
    load: formatWeight(assignedWeight),
    window: driver.isActive ? "Available today" : "Inactive",
    assignments: driver.assignments.length,
    conflict: false,
  };
};

const mapCluster = (cluster) => {
  const requests = cluster.assignments.map((assignment) => mapRequest(assignment.request));
  const totalWeight = requests.reduce((total, request) => total + Number.parseFloat(request.weight), 0);

  return {
    id: cluster.idCluster,
    title: routeTitle(cluster.scheduledDate, cluster.district),
    time: formatTime(cluster.scheduledDate),
    load: formatWeight(totalWeight),
    status: cluster.status,
    warning: cluster.assignments.length > 3 ? "High route density" : null,
    requestIds: requests.map((request) => request.id),
  };
};

const buildMetrics = (requests, drivers, clusters) => ({
  requestsToSchedule: requests.filter((request) => ["PENDING", "VERIFYING", "APPROVED"].includes(request.status)).length,
  routesOpen: clusters.filter((cluster) => cluster.status !== "CLOSED").length,
  activeDrivers: drivers.filter((driver) => driver.active).length,
  timeConflicts: drivers.filter((driver) => driver.conflict).length,
});

export const listSchedule = async ({ date, district = "District 5", status = "ALL" }) => {
  const { startDate, endDate } = toDayRange(date);

  const [requestsRaw, driversRaw, clustersRaw] = await Promise.all([
    collectionScheduleRepository.findPickupRequestsForSchedule({ startDate, endDate, district, status }),
    collectionScheduleRepository.findDriversForSchedule({ startDate, endDate }),
    collectionScheduleRepository.findClustersForSchedule({ startDate, endDate, district }),
  ]);

  const requests = requestsRaw.map(mapRequest);
  const drivers = driversRaw.map(mapDriver);
  const clusters = clustersRaw.map(mapCluster);

  return {
    metrics: buildMetrics(requests, drivers, clusters),
    requests,
    drivers,
    clusters,
    source: "database",
  };
};

export const assignSchedule = async ({ requestId, driverId, clusterId, routeOrder }, actorId) => {
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

  if (request.status !== "APPROVED") {
    throw new AppError("Only approved pickup requests can be assigned", 409);
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
      clusterId: clusterId || null,
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
