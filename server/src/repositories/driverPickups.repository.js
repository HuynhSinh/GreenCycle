import { prisma } from "../config/db.js";

const ACTIVE_STATUSES = ["ASSIGNED", "COLLECTING"];
const DRIVER_PICKUP_STATUSES = ["ASSIGNED", "COLLECTING", "COLLECTED"];

const pickupInclude = {
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
  timeline: {
    orderBy: { createdAt: "desc" },
  },
};

export const findDriverByAccountId = (idAccount) =>
  prisma.driver.findUnique({
    where: { idAccount },
  });

export const findUnassignedPickups = () =>
  prisma.pickupRequest.findMany({
    where: {
      status: "APPROVED",
      assignment: null,
    },
    orderBy: [{ scheduledTime: "asc" }, { createdAt: "asc" }],
    include: pickupInclude,
  });

export const findDriverPickups = (idDriver) =>
  prisma.pickupRequest.findMany({
    where: {
      assignment: {
        idDriver,
      },
      status: {
        in: DRIVER_PICKUP_STATUSES,
      },
    },
    orderBy: [{ scheduledTime: "desc" }, { createdAt: "desc" }],
    include: pickupInclude,
  });

export const countDriverActivePickups = (idDriver, tx = prisma) =>
  tx.pickupAssignment.count({
    where: {
      idDriver,
      request: {
        status: {
          in: ACTIVE_STATUSES,
        },
      },
    },
  });

export const findPickupById = (idRequest, tx = prisma) =>
  tx.pickupRequest.findUnique({
    where: { idRequest },
    include: {
      assignment: true,
      wasteItems: true,
      timeline: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

export const claimPickupInTransaction = async ({ idRequest, idDriver, actorId }) =>
  prisma.$transaction(async (tx) => {
    const pickup = await tx.pickupRequest.findUnique({
      where: { idRequest },
      include: { assignment: true },
    });

    if (!pickup) {
      return { error: { message: "Pickup request not found", statusCode: 404 } };
    }

    if (pickup.assignment) {
      return {
        error: {
          message: "This order has already been claimed by another driver.",
          statusCode: 409,
        },
      };
    }

    if (pickup.status !== "APPROVED") {
      return {
        error: {
          message: "Only approved unassigned pickups can be claimed",
          statusCode: 409,
        },
      };
    }

    const activeCount = await countDriverActivePickups(idDriver, tx);
    if (activeCount >= 3) {
      return {
        error: {
          message: "You can only hold up to 3 active pickups.",
          statusCode: 400,
        },
      };
    }

    const updated = await tx.pickupRequest.update({
      where: { idRequest },
      data: { status: "ASSIGNED" },
    });

    const assignment = await tx.pickupAssignment.create({
      data: {
        idRequest,
        idDriver,
      },
    });

    await tx.pickupTimeline.create({
      data: {
        idRequest,
        status: "ASSIGNED",
        note: "Pickup claimed by driver",
        createdBy: actorId,
      },
    });

    return { data: { pickup: updated, assignment } };
  });

export const releasePickupInTransaction = async ({ idRequest, idDriver, actorId }) =>
  prisma.$transaction(async (tx) => {
    const pickup = await tx.pickupRequest.findUnique({
      where: { idRequest },
      include: { assignment: true },
    });

    if (!pickup) {
      return { error: { message: "Pickup request not found", statusCode: 404 } };
    }

    if (!pickup.assignment || pickup.assignment.idDriver !== idDriver) {
      return { error: { message: "You do not own this pickup", statusCode: 403 } };
    }

    if (pickup.status !== "ASSIGNED") {
      return {
        error: {
          message: "Only ASSIGNED pickups can be returned to unassigned",
          statusCode: 400,
        },
      };
    }

    await tx.pickupAssignment.delete({
      where: { idRequest },
    });

    const updated = await tx.pickupRequest.update({
      where: { idRequest },
      data: { status: "APPROVED" },
    });

    await tx.pickupTimeline.create({
      data: {
        idRequest,
        status: "APPROVED",
        note: "Pickup returned to unassigned by driver",
        createdBy: actorId,
      },
    });

    return { data: { pickup: updated } };
  });

export const updatePickupStatusInTransaction = async ({
  idRequest,
  idDriver,
  actorId,
  status,
  actualQuantity,
  note,
  imageUrl,
}) =>
  prisma.$transaction(async (tx) => {
    const pickup = await tx.pickupRequest.findUnique({
      where: { idRequest },
      include: {
        assignment: true,
        wasteItems: true,
      },
    });

    if (!pickup) {
      return { error: { message: "Pickup request not found", statusCode: 404 } };
    }

    if (!pickup.assignment || pickup.assignment.idDriver !== idDriver) {
      return { error: { message: "You do not own this pickup", statusCode: 403 } };
    }

    if (status === "COLLECTING") {
      if (pickup.status !== "ASSIGNED") {
        return {
          error: {
            message: "Only ASSIGNED pickups can move to COLLECTING",
            statusCode: 400,
          },
        };
      }
    }

    if (status === "COLLECTED") {
      if (pickup.status !== "COLLECTING") {
        return {
          error: {
            message: "Only COLLECTING pickups can move to COLLECTED",
            statusCode: 400,
          },
        };
      }

      if (!(Number(actualQuantity) > 0)) {
        return {
          error: {
            message: "Actual quantity is required to complete pickup",
            statusCode: 400,
          },
        };
      }
    }

    const updated = await tx.pickupRequest.update({
      where: { idRequest },
      data: {
        status,
        ...(status === "COLLECTED"
          ? {
              totalWeight: Number(actualQuantity),
              ...(note != null ? { note } : {}),
            }
          : {}),
        ...(status === "COLLECTING" && note != null ? { note } : {}),
      },
    });

    await tx.pickupTimeline.create({
      data: {
        idRequest,
        status,
        note:
          status === "COLLECTED"
            ? note || `Collected with actual quantity ${actualQuantity}`
            : note || `Status updated to ${status}`,
        createdBy: actorId,
      },
    });

    if (status === "COLLECTED" && imageUrl && pickup.wasteItems[0]) {
      await tx.wasteImage.create({
        data: {
          idItem: pickup.wasteItems[0].idItem,
          url: imageUrl,
          type: "AFTER_PICKUP",
        },
      });
    }

    if (status === "COLLECTED" && pickup.wasteItems[0] && Number(actualQuantity) > 0) {
      await tx.wasteItem.update({
        where: { idItem: pickup.wasteItems[0].idItem },
        data: { weight: Number(actualQuantity) },
      });
    }

    return { data: { pickup: updated } };
  });
