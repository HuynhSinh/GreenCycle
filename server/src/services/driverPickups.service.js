import AppError from "../utils/AppError.js";
import * as driverPickupsRepository from "../repositories/driverPickups.repository.js";

const toRadians = (degrees) => (degrees * Math.PI) / 180;

const haversineKm = (lat1, lng1, lat2, lng2) => {
  if ([lat1, lng1, lat2, lng2].some((value) => value == null || Number.isNaN(Number(value)))) {
    return null;
  }

  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const formatDistance = (km) => {
  if (km == null) return null;
  return `${km.toFixed(1)} km`;
};

const getPrimaryCategory = (wasteItems = []) => wasteItems[0]?.category?.name || "E-Waste";

const getEstimatedQuantity = (request) => {
  if (request.totalWeight > 0) return request.totalWeight;
  const sum = (request.wasteItems || []).reduce((total, item) => total + (item.weight || 0), 0);
  return sum > 0 ? sum : (request.wasteItems || []).length || 0;
};

const getCompletedAt = (request) => {
  const collectedEntry = (request.timeline || []).find((entry) => entry.status === "COLLECTED");
  return collectedEntry?.createdAt?.toISOString?.() || collectedEntry?.createdAt || null;
};

const getConfirmationImageUrl = (request) => {
  for (const item of request.wasteItems || []) {
    const image = (item.images || []).find((entry) => entry.type === "AFTER_PICKUP");
    if (image?.url) return image.url;
  }
  return null;
};

const mapPickupCard = (request, driver = null) => {
  const distanceKm = haversineKm(
    driver?.currentLat,
    driver?.currentLng,
    request.address?.latitude,
    request.address?.longitude,
  );

  return {
    id: request.idRequest,
    customerName: request.customer?.fullName || "Unknown customer",
    phone: request.customer?.phoneNumber || null,
    address: [
      request.address?.addressLine,
      request.address?.ward,
      request.address?.district,
    ]
      .filter(Boolean)
      .join(", "),
    distance: formatDistance(distanceKm) || "—",
    categoryName: getPrimaryCategory(request.wasteItems),
    estimatedQuantity: getEstimatedQuantity(request),
    status: request.status,
    actualQuantity: request.status === "COLLECTED" ? request.totalWeight : undefined,
    note: request.note || undefined,
    imageUrl: getConfirmationImageUrl(request) || undefined,
    completedAt: request.status === "COLLECTED" ? getCompletedAt(request) : undefined,
    driverId: request.assignment?.idDriver || null,
  };
};

const resolveActiveDriver = async (accountId) => {
  const driver = await driverPickupsRepository.findDriverByAccountId(accountId);

  if (!driver) {
    throw new AppError("Driver profile not found", 404);
  }

  if (!driver.isActive) {
    throw new AppError("Only ACTIVE drivers can manage pickups", 403);
  }

  return driver;
};

const throwTransactionError = (result) => {
  if (result?.error) {
    throw new AppError(result.error.message, result.error.statusCode);
  }
  return result.data;
};

export const listUnassignedPickups = async (accountId) => {
  const driver = await resolveActiveDriver(accountId);
  const pickups = await driverPickupsRepository.findUnassignedPickups();
  return pickups.map((pickup) => mapPickupCard(pickup, driver));
};

export const listDriverPickups = async (accountId) => {
  const driver = await resolveActiveDriver(accountId);
  const pickups = await driverPickupsRepository.findDriverPickups(driver.idDriver);
  return pickups.map((pickup) => mapPickupCard(pickup, driver));
};

export const claimPickup = async (accountId, pickupId) => {
  const driver = await resolveActiveDriver(accountId);

  const result = await driverPickupsRepository.claimPickupInTransaction({
    idRequest: pickupId,
    idDriver: driver.idDriver,
    actorId: accountId,
  });

  const data = throwTransactionError(result);

  return {
    success: true,
    message: "Order claimed successfully",
    data: {
      id: data.pickup.idRequest,
      status: data.pickup.status,
      driverId: data.assignment.idDriver,
    },
  };
};

export const releasePickup = async (accountId, pickupId) => {
  const driver = await resolveActiveDriver(accountId);

  const result = await driverPickupsRepository.releasePickupInTransaction({
    idRequest: pickupId,
    idDriver: driver.idDriver,
    actorId: accountId,
  });

  throwTransactionError(result);

  return {
    success: true,
    message: "Pickup returned to unassigned",
    data: { id: pickupId },
  };
};

export const updatePickupStatus = async (accountId, pickupId, payload) => {
  const driver = await resolveActiveDriver(accountId);
  const { status, actualQuantity, note, imageUrl } = payload;

  if (!["COLLECTING", "COLLECTED"].includes(status)) {
    throw new AppError("Unsupported status transition", 400);
  }

  if (status === "COLLECTED" && !(Number(actualQuantity) > 0)) {
    throw new AppError("Actual quantity must be greater than 0", 400);
  }

  const result = await driverPickupsRepository.updatePickupStatusInTransaction({
    idRequest: pickupId,
    idDriver: driver.idDriver,
    actorId: accountId,
    status,
    actualQuantity,
    note,
    imageUrl,
  });

  const data = throwTransactionError(result);

  return {
    success: true,
    message: `Pickup status updated to ${status}`,
    data: {
      id: data.pickup.idRequest,
      status: data.pickup.status,
      actualQuantity: data.pickup.totalWeight,
      note: data.pickup.note,
    },
  };
};
