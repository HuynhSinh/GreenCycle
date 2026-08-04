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

const passportProgress = (totalPoints) => {
  if (totalPoints >= 5000) return { level: 5, badge: "Earth Guardian" };
  if (totalPoints >= 2500) return { level: 4, badge: "Circular Champion" };
  if (totalPoints >= 1000) return { level: 3, badge: "Green Hero" };
  if (totalPoints >= 250) return { level: 2, badge: "Eco Warrior" };
  return { level: 1, badge: "Green Starter" };
};

const statusTransitionGuards = {
  COLLECTING: ["ASSIGNED"],
  ARRIVED: ["COLLECTING"],
  COLLECTED: ["COLLECTING", "ARRIVED"],
  FAILED: ["ASSIGNED", "COLLECTING", "ARRIVED"],
};

const assignmentConflict = (code) => Object.assign(new Error(code), { code });

export const updateAssignmentResult = ({ requestId, status, note, createdBy, items = [], evidenceImages = [] }) =>
  prisma.$transaction(async (tx) => {
    const totalWeight = items.reduce((total, item) => total + item.actualWeight, 0);
    const totalPoints = items.reduce((total, item) => total + item.pointsEarned, 0);
    const totalCO2 = items.reduce((total, item) => total + (item.co2Reduced || 0), 0);
    const allowedCurrentStatuses = statusTransitionGuards[status];

    const pickupUpdate = await tx.pickupRequest.updateMany({
      where: {
        idRequest: requestId,
        ...(allowedCurrentStatuses ? { status: { in: allowedCurrentStatuses } } : {}),
      },
      data: {
        status,
        ...(status === "COLLECTED"
          ? {
              totalWeight,
              totalPoints,
            }
          : {}),
      },
    });

    if (pickupUpdate.count !== 1) {
      throw assignmentConflict("INVALID_ASSIGNMENT_STATUS_TRANSITION");
    }

    const pickup = await tx.pickupRequest.findUnique({
      where: { idRequest: requestId },
      select: {
        idCustomer: true,
      },
    });

    if (!pickup) {
      throw assignmentConflict("ASSIGNMENT_NOT_FOUND");
    }

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

    if (status === "COLLECTED") {
      const passport = await tx.greenPassport.upsert({
        where: { idCustomer: pickup.idCustomer },
        create: {
          idCustomer: pickup.idCustomer,
          totalKg: totalWeight,
          totalCO2,
          totalPoints,
          ...passportProgress(totalPoints),
        },
        update: {
          totalKg: { increment: totalWeight },
          totalCO2: { increment: totalCO2 },
          totalPoints: { increment: totalPoints },
        },
      });

      const progress = passportProgress(passport.totalPoints);

      if (passport.level !== progress.level || passport.badge !== progress.badge) {
        await tx.greenPassport.update({
          where: { idPassport: passport.idPassport },
          data: progress,
        });
      }

      if (totalPoints > 0) {
        const wallet = await tx.ecoWallet.upsert({
          where: { idCustomer: pickup.idCustomer },
          create: {
            idCustomer: pickup.idCustomer,
            balance: totalPoints,
          },
          update: {
            balance: { increment: totalPoints },
          },
        });

        await tx.transaction.create({
          data: {
            idWallet: wallet.idWallet,
            type: "EARN_RECYCLING",
            amount: totalPoints,
            description: `Eco-points earned from collected pickup ${requestId}`,
          },
        });
      }
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
