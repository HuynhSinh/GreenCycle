import { prisma } from "../config/db.js";

export const findDriverByAccountId = (idAccount) =>
  prisma.driver.findUnique({
    where: { idAccount },
  });

const assignmentInclude = {
  driver: true,
  request: {
    include: {
      customer: true,
      address: true,
      wasteItems: {
        include: {
          category: true,
          images: true,
        },
        orderBy: {
          category: {
            name: "asc",
          },
        },
      },
      timeline: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  },
};

export const findAssignmentsByDriver = (idDriver) =>
  prisma.pickupAssignment.findMany({
    where: {
      idDriver,
      request: {
        status: {
          in: ["ASSIGNED", "COLLECTING", "ARRIVED", "COLLECTED", "FAILED"],
        },
      },
    },
    orderBy: [
      {
        request: {
          scheduledTime: "asc",
        },
      },
      { assignedAt: "asc" },
    ],
    include: assignmentInclude,
  });

export const findAssignmentForDriver = ({ idAssignment, idDriver }) =>
  prisma.pickupAssignment.findFirst({
    where: {
      idAssignment,
      idDriver,
    },
    include: assignmentInclude,
  });

export const countInProgressAssignments = ({ idDriver, excludeAssignmentId }) =>
  prisma.pickupAssignment.count({
    where: {
      idDriver,
      idAssignment: excludeAssignmentId ? { not: excludeAssignmentId } : undefined,
      request: {
        status: {
          in: ["COLLECTING", "ARRIVED"],
        },
      },
    },
  });

export const updateAssignmentResult = ({ requestId, status, note, createdBy, items = [], evidenceImages = [] }) =>
  prisma.$transaction(async (tx) => {
    await tx.pickupRequest.update({
      where: { idRequest: requestId },
      data: {
        status,
        ...(status === "COLLECTED"
          ? {
              totalWeight: items.reduce((total, item) => total + item.actualWeight, 0),
            }
          : {}),
      },
    });

    for (const item of items) {
      await tx.wasteItem.update({
        where: { idItem: item.wasteItemId },
        data: {
          weight: item.actualWeight,
          pointsEarned: item.pointsEarned,
        },
      });
    }

    if (evidenceImages.length > 0) {
      await tx.wasteImage.createMany({
        data: evidenceImages,
      });
    }

    await tx.pickupTimeline.create({
      data: {
        idRequest: requestId,
        status,
        note: note || null,
        createdBy,
      },
    });
  });
