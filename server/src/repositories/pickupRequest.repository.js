import { prisma } from "../config/db.js";

export const findCustomerByAccountId = (idAccount) =>
  prisma.customer.findUnique({
    where: { idAccount },
  });

export const createCustomer = ({ idAccount, fullName, phoneNumber }) =>
  prisma.customer.create({
    data: {
      idAccount,
      fullName,
      phoneNumber,
      isEnterprise: false,
    },
  });

export const findAddressByCustomer = ({
  idCustomer,
  addressLine,
  district,
  city,
}) =>
  prisma.address.findFirst({
    where: {
      idCustomer,
      addressLine: {
        equals: addressLine,
        mode: "insensitive",
      },
      district: {
        equals: district,
        mode: "insensitive",
      },
      city: {
        equals: city,
        mode: "insensitive",
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

export const createAddress = ({
  idCustomer,
  addressLine,
  ward,
  district,
  city,
  latitude,
  longitude,
}) =>
  prisma.address.create({
    data: {
      idCustomer,
      label: "Home",
      addressLine,
      ward: ward || null,
      district,
      city,
      latitude,
      longitude,
      isDefault: true,
    },
  });

export const findWasteCategoryByName = (name) =>
  prisma.wasteCategory.findFirst({
    where: {
      name: {
        equals: name,
        mode: "insensitive",
      },
    },
  });

export const createPickupRequestWithItems = async ({
  idCustomer,
  idAddress,
  scheduledTime,
  note,
  totalWeight,
  totalPoints,
  wasteItems,
  actorId,
}) =>
  prisma.$transaction(async (tx) => {
    const request = await tx.pickupRequest.create({
      data: {
        idCustomer,
        idAddress,
        scheduledTime,
        note,
        totalWeight,
        totalPoints,
        status: "PENDING",
      },
    });

    await tx.wasteItem.createMany({
      data: wasteItems.map((item) => ({
        idRequest: request.idRequest,
        idCategory: item.idCategory,
        weight: item.weight,
        pointsEarned: item.pointsEarned,
      })),
    });

    await tx.pickupTimeline.create({
      data: {
        idRequest: request.idRequest,
        status: "PENDING",
        note: "Pickup request created by customer",
        createdBy: actorId,
      },
    });

    return request;
  });
