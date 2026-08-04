import AppError from "../utils/AppError.js";
import * as pickupRequestRepository from "../repositories/pickupRequest.repository.js";

const normalizeNote = ({ scheduledTime, note }) => {
  const localTime = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(scheduledTime));

  const trimmedNote = note?.trim() || "";
  return trimmedNote
    ? `preferred:${localTime}; ${trimmedNote}`
    : `preferred:${localTime}`;
};

export const createPickupRequest = async (actorId, payload) => {
  let customer = await pickupRequestRepository.findCustomerByAccountId(actorId);

  if (!customer) {
    customer = await pickupRequestRepository.createCustomer({
      idAccount: actorId,
      fullName: payload.fullName,
      phoneNumber: payload.phoneNumber,
    });
  }

  const address = await pickupRequestRepository.findAddressByCustomer({
    idCustomer: customer.idCustomer,
    addressLine: payload.addressLine,
    district: payload.district,
    city: payload.city,
  });

  const persistedAddress =
    address ||
    (await pickupRequestRepository.createAddress({
      idCustomer: customer.idCustomer,
      addressLine: payload.addressLine,
      ward: payload.ward,
      district: payload.district,
      city: payload.city,
      latitude: payload.latitude,
      longitude: payload.longitude,
    }));

  const wasteItems = [];
  let totalWeight = 0;
  let totalPoints = 0;

  for (const item of payload.wasteItems) {
    const category = await pickupRequestRepository.findWasteCategoryByName(
      item.categoryName,
    );

    if (!category) {
      throw new AppError(
        `Unsupported waste category: ${item.categoryName}`,
        400,
      );
    }

    const weight = Number(item.weight);
    const pointsEarned = Math.round(category.pointFactor * weight);

    totalWeight += weight;
    totalPoints += pointsEarned;

    wasteItems.push({
      idCategory: category.idCategory,
      weight,
      pointsEarned,
    });
  }

  const request = await pickupRequestRepository.createPickupRequestWithItems({
    idCustomer: customer.idCustomer,
    idAddress: persistedAddress.idAddress,
    scheduledTime: new Date(payload.scheduledTime),
    note: normalizeNote({
      scheduledTime: payload.scheduledTime,
      note: payload.note,
    }),
    totalWeight,
    totalPoints,
    wasteItems,
    actorId,
  });

  return {
    id: request.idRequest,
    status: request.status,
    scheduledTime: request.scheduledTime,
    message: "Pickup request created successfully",
  };
};
