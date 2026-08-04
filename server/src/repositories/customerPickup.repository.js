import { prisma } from "../config/db.js";

export const findCustomerByAccountId = (idAccount) =>
  prisma.customer.findUnique({
    where: { idAccount },
    include: {
      addresses: {
        orderBy: [{ isDefault: "desc" }, { label: "asc" }],
      },
    },
  });

export const findCustomerByPhoneNumber = (phoneNumber) =>
  prisma.customer.findUnique({
    where: { phoneNumber },
  });

export const findWasteCategories = () =>
  prisma.wasteCategory.findMany({
    orderBy: { name: "asc" },
  });

export const findWasteCategoriesByIds = (ids) =>
  prisma.wasteCategory.findMany({
    where: {
      idCategory: {
        in: ids,
      },
    },
  });

export const findCustomerPickups = (idCustomer) =>
  prisma.pickupRequest.findMany({
    where: { idCustomer },
    orderBy: [{ createdAt: "desc" }, { scheduledTime: "desc" }],
    include: {
      address: true,
      wasteItems: {
        include: {
          category: true,
        },
      },
      assignment: {
        include: {
          driver: true,
        },
      },
    },
  });

export const findCustomerPickupById = ({ idCustomer, idRequest }) =>
  prisma.pickupRequest.findFirst({
    where: {
      idCustomer,
      idRequest,
    },
    include: {
      address: true,
      wasteItems: {
        include: {
          category: true,
        },
      },
      assignment: {
        include: {
          driver: true,
        },
      },
    },
  });

export const upsertCustomerProfile = async ({ idAccount, fullName, phoneNumber, address }) =>
  prisma.$transaction(async (tx) => {
    const customer = await tx.customer.upsert({
      where: { idAccount },
      create: {
        idAccount,
        fullName,
        phoneNumber,
        isEnterprise: false,
      },
      update: {
        fullName,
        phoneNumber,
      },
    });

    const savedAddress = await tx.address.create({
      data: {
        idCustomer: customer.idCustomer,
        label: address.label,
        addressLine: address.addressLine,
        ward: address.ward,
        district: address.district,
        city: address.city,
        latitude: address.latitude,
        longitude: address.longitude,
        isDefault: false,
      },
    });

    return { customer, address: savedAddress };
  });

export const createPickup = ({ idCustomer, idAddress, scheduledTime, totalWeight, totalPoints, note, items }) =>
  prisma.pickupRequest.create({
    data: {
      idCustomer,
      idAddress,
      scheduledTime,
      totalWeight,
      totalPoints,
      note,
      status: "PENDING",
      wasteItems: {
        create: items,
      },
      timeline: {
        create: {
          status: "PENDING",
          note: "Pickup request submitted by customer",
        },
      },
    },
    include: {
      address: true,
      wasteItems: {
        include: {
          category: true,
        },
      },
    },
  });

export const updatePickup = ({ pickup, address, scheduledTime, totalWeight, totalPoints, note, items, actorId }) =>
  prisma.$transaction(async (tx) => {
    await tx.address.update({
      where: { idAddress: pickup.idAddress },
      data: address,
    });

    await tx.wasteItem.deleteMany({
      where: { idRequest: pickup.idRequest },
    });

    const updated = await tx.pickupRequest.update({
      where: { idRequest: pickup.idRequest },
      data: {
        scheduledTime,
        totalWeight,
        totalPoints,
        note,
        wasteItems: {
          create: items,
        },
        timeline: {
          create: {
            status: "PENDING",
            note: "Pickup request updated by customer",
            createdBy: actorId,
          },
        },
      },
      include: {
        address: true,
        wasteItems: {
          include: {
            category: true,
          },
        },
        assignment: {
          include: {
            driver: true,
          },
        },
      },
    });

    return updated;
  });

export const cancelPickup = ({ pickup, actorId }) =>
  prisma.pickupRequest.update({
    where: { idRequest: pickup.idRequest },
    data: {
      status: "CANCELLED",
      timeline: {
        create: {
          status: "CANCELLED",
          note: "Pickup request cancelled by customer",
          createdBy: actorId,
        },
      },
    },
    include: {
      address: true,
      wasteItems: {
        include: {
          category: true,
        },
      },
      assignment: {
        include: {
          driver: true,
        },
      },
    },
  });
