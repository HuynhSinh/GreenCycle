import { prisma } from "../config/db.js";

export const findPickupRequestsForSchedule = ({ startDate, endDate, district, status }) => {
  const where = {
    scheduledTime: {
      gte: startDate,
      lt: endDate,
    },
  };

  if (district) {
    where.address = {
      district: {
        contains: district,
        mode: "insensitive",
      },
    };
  }

  if (status && status !== "ALL") {
    where.status = status;
  }

  return prisma.pickupRequest.findMany({
    where,
    orderBy: [{ scheduledTime: "asc" }, { createdAt: "asc" }],
    include: {
      customer: true,
      address: true,
      wasteItems: {
        include: {
          category: true,
        },
      },
      assignment: {
        include: {
          driver: true,
          cluster: true,
        },
      },
    },
  });
};

export const findDriversForSchedule = ({ startDate, endDate }) =>
  prisma.driver.findMany({
    orderBy: [{ isActive: "desc" }, { fullName: "asc" }],
    include: {
      assignments: {
        where: {
          request: {
            scheduledTime: {
              gte: startDate,
              lt: endDate,
            },
          },
        },
        include: {
          request: true,
          cluster: true,
        },
      },
      clusters: {
        where: {
          scheduledDate: {
            gte: startDate,
            lt: endDate,
          },
        },
      },
    },
  });

export const findClustersForSchedule = ({ startDate, endDate, district }) => {
  const where = {
    scheduledDate: {
      gte: startDate,
      lt: endDate,
    },
  };

  if (district) {
    where.district = {
      contains: district,
      mode: "insensitive",
    };
  }

  return prisma.collectionCluster.findMany({
    where,
    orderBy: [{ scheduledDate: "asc" }],
    include: {
      driver: true,
      assignments: {
        orderBy: [{ routeOrder: "asc" }],
        include: {
          request: {
            include: {
              customer: true,
              address: true,
              wasteItems: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
      },
    },
  });
};

export const findPickupRequestById = (idRequest) =>
  prisma.pickupRequest.findUnique({
    where: { idRequest },
    include: {
      assignment: true,
    },
  });

export const findDriverById = (idDriver) =>
  prisma.driver.findUnique({
    where: { idDriver },
  });

export const countDriverAssignmentsAtTime = ({ idDriver, scheduledTime, excludeRequestId }) =>
  prisma.pickupAssignment.count({
    where: {
      idDriver,
      request: {
        idRequest: excludeRequestId ? { not: excludeRequestId } : undefined,
        scheduledTime,
        status: {
          in: ["ASSIGNED", "COLLECTING", "ARRIVED", "COLLECTED", "IN_TRANSIT"],
        },
      },
    },
  });

export const upsertAssignment = ({ requestId, driverId, clusterId, routeOrder }) =>
  prisma.pickupAssignment.upsert({
    where: { idRequest: requestId },
    create: {
      idRequest: requestId,
      idDriver: driverId,
      idCluster: clusterId,
      routeOrder,
    },
    update: {
      idDriver: driverId,
      idCluster: clusterId,
      routeOrder,
    },
  });

export const updatePickupSchedule = ({ requestId, scheduledTime, status }) =>
  prisma.pickupRequest.update({
    where: { idRequest: requestId },
    data: {
      ...(scheduledTime ? { scheduledTime } : {}),
      status,
    },
  });

export const createPickupTimeline = ({ requestId, status, note, createdBy }) =>
  prisma.pickupTimeline.create({
    data: {
      idRequest: requestId,
      status,
      note,
      createdBy,
    },
  });

export const runInTransaction = (operations) => prisma.$transaction(operations);
