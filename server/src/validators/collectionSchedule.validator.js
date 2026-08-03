import { z } from "zod";

const pickupStatuses = [
  "PENDING",
  "VERIFYING",
  "APPROVED",
  "ASSIGNED",
  "COLLECTING",
  "ARRIVED",
  "COLLECTED",
  "IN_TRANSIT",
  "AT_WAREHOUSE",
  "COMPLETED",
  "CANCELLED",
  "REJECTED",
  "FAILED",
  "RESCHEDULED",
];

export const listCollectionScheduleSchema = z.object({
  query: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    district: z.string().trim().min(1).max(80).optional(),
    status: z.enum(["ALL", ...pickupStatuses]).optional().default("ALL"),
  }),
});

export const assignCollectionScheduleSchema = z.object({
  body: z.object({
    requestId: z.string().trim().min(1),
    driverId: z.string().trim().min(1),
    clusterId: z.string().trim().min(1).nullable().optional(),
    routeOrder: z.number().int().positive().optional(),
  }),
});

export const approveCollectionScheduleSchema = z.object({
  params: z.object({
    requestId: z.string().trim().min(1),
  }),
});

export const rejectCollectionScheduleSchema = z.object({
  params: z.object({
    requestId: z.string().trim().min(1),
  }),
  body: z.object({
    reason: z.string().trim().max(500).optional().default(""),
  }),
});
