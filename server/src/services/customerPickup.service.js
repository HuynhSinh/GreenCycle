import AppError from "../utils/AppError.js";
import * as customerPickupRepository from "../repositories/customerPickup.repository.js";
import { PICKUP_END_HOUR, PICKUP_START_HOUR } from "../validators/customerPickup.validator.js";

const mapCategory = (category) => ({
  id: category.idCategory,
  name: category.name,
  co2Factor: category.co2Factor,
  pointFactor: category.pointFactor,
  hazardLevel: category.hazardLevel,
  pricePerKg: category.pricePerKg,
  iconUrl: category.iconUrl || "",
});

const mapAddress = (address) => ({
  id: address.idAddress,
  label: address.label,
  addressLine: address.addressLine,
  ward: address.ward || "",
  district: address.district,
  city: address.city,
  latitude: address.latitude,
  longitude: address.longitude,
  isDefault: address.isDefault,
});

const mapPickup = (pickup) => ({
  id: pickup.idRequest,
  status: pickup.status,
  scheduledTime: pickup.scheduledTime,
  totalWeight: pickup.totalWeight,
  totalPoints: pickup.totalPoints,
  note: pickup.note || "",
  address: pickup.address ? mapAddress(pickup.address) : null,
  driver: pickup.assignment?.driver
    ? {
        id: pickup.assignment.driver.idDriver,
        name: pickup.assignment.driver.fullName,
        phoneNumber: pickup.assignment.driver.phoneNumber,
        vehicle: [pickup.assignment.driver.vehicleInfo, pickup.assignment.driver.licensePlate].filter(Boolean).join(" - "),
      }
    : null,
  items: pickup.wasteItems.map((item) => ({
    id: item.idItem,
    category: item.category?.name || "Waste item",
    categoryId: item.idCategory,
    weight: item.weight,
    pointsEarned: item.pointsEarned,
  })),
});

export const getBookingData = async (accountId) => {
  const [customer, categoriesRaw] = await Promise.all([
    customerPickupRepository.findCustomerByAccountId(accountId),
    customerPickupRepository.findWasteCategories(),
  ]);

  return {
    customer: customer
      ? {
          id: customer.idCustomer,
          fullName: customer.fullName,
          phoneNumber: customer.phoneNumber,
          addresses: customer.addresses.map(mapAddress),
        }
      : null,
    categories: categoriesRaw.map(mapCategory),
  };
};

export const listOwnPickups = async (accountId) => {
  const customer = await customerPickupRepository.findCustomerByAccountId(accountId);

  if (!customer) {
    return [];
  }

  const pickups = await customerPickupRepository.findCustomerPickups(customer.idCustomer);
  return pickups.map(mapPickup);
};

const validateScheduleAndItems = async (payload) => {
  const scheduledTime = new Date(payload.scheduledTime);

  if (Number.isNaN(scheduledTime.getTime()) || scheduledTime <= new Date()) {
    throw new AppError("Scheduled time must be in the future", 400);
  }

  const localHour = Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: "Asia/Ho_Chi_Minh",
    }).format(scheduledTime),
  );

  if (localHour < PICKUP_START_HOUR || localHour >= PICKUP_END_HOUR) {
    throw new AppError("Pickup time must be between 08:00 and 17:00", 400);
  }

  const categoryIds = [...new Set(payload.items.map((item) => item.categoryId))];
  const categories = await customerPickupRepository.findWasteCategoriesByIds(categoryIds);

  if (categories.length !== categoryIds.length) {
    throw new AppError("One or more waste categories are invalid", 400);
  }

  const categoryById = new Map(categories.map((category) => [category.idCategory, category]));

  return { scheduledTime, categoryById };
};

const buildPickupItems = ({ payload, categoryById }) => {
  const totalWeight = payload.items.reduce((total, item) => total + item.weight, 0);
  const items = payload.items.map((item) => {
    const category = categoryById.get(item.categoryId);

    return {
      idCategory: item.categoryId,
      weight: item.weight,
      pointsEarned: Math.round(item.weight * (category?.pointFactor || 0)),
    };
  });
  const totalPoints = items.reduce((total, item) => total + item.pointsEarned, 0);

  return { totalWeight, items, totalPoints };
};

const getOwnCustomerOrThrow = async (accountId) => {
  const customer = await customerPickupRepository.findCustomerByAccountId(accountId);

  if (!customer) {
    throw new AppError("Customer profile not found", 404);
  }

  return customer;
};

export const getOwnPickup = async (accountId, pickupId) => {
  const customer = await getOwnCustomerOrThrow(accountId);
  const pickup = await customerPickupRepository.findCustomerPickupById({
    idCustomer: customer.idCustomer,
    idRequest: pickupId,
  });

  if (!pickup) {
    throw new AppError("Pickup request not found", 404);
  }

  return mapPickup(pickup);
};

export const createOwnPickup = async (accountId, payload) => {
  const { scheduledTime, categoryById } = await validateScheduleAndItems(payload);
  const existingCustomer = await customerPickupRepository.findCustomerByAccountId(accountId);
  const phoneOwner = await customerPickupRepository.findCustomerByPhoneNumber(payload.phoneNumber.trim());

  if (phoneOwner && phoneOwner.idAccount !== accountId) {
    throw new AppError("Phone number is already used by another customer", 409);
  }

  const { customer, address } = await customerPickupRepository.upsertCustomerProfile({
    idAccount: accountId,
    fullName: payload.fullName.trim(),
    phoneNumber: payload.phoneNumber.trim(),
    address: {
      label: payload.address.label || "Pickup address",
      addressLine: payload.address.addressLine.trim(),
      ward: payload.address.ward.trim(),
      district: payload.address.district?.trim() || "Unspecified district",
      city: payload.address.city || "Ho Chi Minh",
      latitude: payload.address.latitude,
      longitude: payload.address.longitude,
    },
  });

  const { totalWeight, items, totalPoints } = buildPickupItems({ payload, categoryById });
  const profileNote = existingCustomer ? "" : "Customer profile created during first booking. ";

  const pickup = await customerPickupRepository.createPickup({
    idCustomer: customer.idCustomer,
    idAddress: address.idAddress,
    scheduledTime,
    totalWeight,
    totalPoints,
    note: `${profileNote}${payload.note || ""}`.trim() || null,
    items,
  });

  return mapPickup(pickup);
};

export const updateOwnPickup = async (accountId, pickupId, payload) => {
  const { scheduledTime, categoryById } = await validateScheduleAndItems(payload);
  const customer = await getOwnCustomerOrThrow(accountId);
  const pickup = await customerPickupRepository.findCustomerPickupById({
    idCustomer: customer.idCustomer,
    idRequest: pickupId,
  });

  if (!pickup) {
    throw new AppError("Pickup request not found", 404);
  }

  if (pickup.status !== "PENDING") {
    throw new AppError("Only pending pickup requests can be updated", 409);
  }

  const phoneOwner = await customerPickupRepository.findCustomerByPhoneNumber(payload.phoneNumber.trim());

  if (phoneOwner && phoneOwner.idAccount !== accountId) {
    throw new AppError("Phone number is already used by another customer", 409);
  }

  const { totalWeight, items, totalPoints } = buildPickupItems({ payload, categoryById });
  const updated = await customerPickupRepository.updatePickup({
    pickup,
    address: {
      label: payload.address.label || "Pickup address",
      addressLine: payload.address.addressLine.trim(),
      ward: payload.address.ward.trim(),
      district: payload.address.district?.trim() || "Unspecified district",
      city: payload.address.city || "Ho Chi Minh",
      latitude: payload.address.latitude,
      longitude: payload.address.longitude,
    },
    scheduledTime,
    totalWeight,
    totalPoints,
    note: payload.note || null,
    items,
    actorId: accountId,
  });

  return mapPickup(updated);
};

export const cancelOwnPickup = async (accountId, pickupId) => {
  const customer = await getOwnCustomerOrThrow(accountId);
  const pickup = await customerPickupRepository.findCustomerPickupById({
    idCustomer: customer.idCustomer,
    idRequest: pickupId,
  });

  if (!pickup) {
    throw new AppError("Pickup request not found", 404);
  }

  if (pickup.status !== "PENDING") {
    throw new AppError("Only pending pickup requests can be cancelled", 409);
  }

  const cancelled = await customerPickupRepository.cancelPickup({
    pickup,
    actorId: accountId,
  });

  return mapPickup(cancelled);
};
