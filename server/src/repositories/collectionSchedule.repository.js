import { prisma } from "../config/db.js";

const buildScheduleRequestWhere = ({ startDate, endDate, district, status }) => {
  const where = {};

  if (startDate && endDate) {
    where.scheduledTime = {
      gte: startDate,
      lt: endDate,
    };
  }

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

  return where;
};

export const findPickupRequestsForSchedule = ({ startDate, endDate, district, status, skip = 0, take = 20 }) => {
  const where = buildScheduleRequestWhere({ startDate, endDate, district, status });

  return prisma.pickupRequest.findMany({
    where,
    skip,
    take,
    orderBy: [{ scheduledTime: "asc" }, { createdAt: "asc" }],
    include: {
      customer: true,
      address: true,
      wasteItems: {
        include: {
          category: true,
          images: true,
        },
      },
      assignment: {
        include: {
          driver: true,
        },
      },
    },
  });
};

export const countPickupRequestsForSchedule = ({ startDate, endDate, district, status }) =>
  prisma.pickupRequest.count({
    where: buildScheduleRequestWhere({ startDate, endDate, district, status }),
  });

export const countPickupRequestsByStatusForSchedule = ({ startDate, endDate, district, statuses }) => {
  const where = buildScheduleRequestWhere({ startDate, endDate, district, status: "ALL" });

  return prisma.pickupRequest.groupBy({
    by: ["status"],
    where: {
      ...where,
      status: {
        in: statuses,
      },
    },
    _count: {
      _all: true,
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
            status: {
              in: ["ASSIGNED", "COLLECTING", "ARRIVED"],
            },
            ...(startDate && endDate
              ? {
                  scheduledTime: {
                    gte: startDate,
                    lt: endDate,
                  },
                }
              : {}),
          },
        },
        include: {
          request: true,
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

export const sumDriverAssignedWeightForSchedule = async ({ idDriver, startDate, endDate, excludeRequestId }) => {
  const result = await prisma.pickupRequest.aggregate({
    where: {
      idRequest: excludeRequestId ? { not: excludeRequestId } : undefined,
      scheduledTime: {
        gte: startDate,
        lt: endDate,
      },
      status: {
        in: ["ASSIGNED", "COLLECTING", "ARRIVED"],
      },
      assignment: {
        is: {
          idDriver,
        },
      },
    },
    _sum: {
      totalWeight: true,
    },
  });

  return result._sum.totalWeight || 0;
};

export const countDriverAssignmentsAtTime = ({ idDriver, scheduledTime, excludeRequestId }) =>
  prisma.pickupAssignment.count({
    where: {
      idDriver,
      request: {
        idRequest: excludeRequestId ? { not: excludeRequestId } : undefined,
        scheduledTime,
        status: {
          in: ["ASSIGNED", "COLLECTING", "ARRIVED"],
        },
      },
    },
  });

export const upsertAssignment = ({ requestId, driverId, routeOrder }) =>
  prisma.pickupAssignment.upsert({
    where: { idRequest: requestId },
    create: {
      idRequest: requestId,
      idDriver: driverId,
      idCluster: null,
      routeOrder,
    },
    update: {
      idDriver: driverId,
      idCluster: null,
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
