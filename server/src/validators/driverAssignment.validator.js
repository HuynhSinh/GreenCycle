import { z } from "zod";

const driverTaskStatuses = ["COLLECTING", "ARRIVED", "COLLECTED", "FAILED"];

const collectionItemSchema = z.object({
  wasteItemId: z.string().trim().min(1),
  actualWeight: z.coerce.number().positive(),
});

export const driverAssignmentParamsSchema = z.object({
  params: z.object({
    assignmentId: z.string().trim().min(1),
  }),
});

export const updateDriverAssignmentStatusSchema = z.object({
  params: z.object({
    assignmentId: z.string().trim().min(1),
  }),
  body: z.object({
    status: z.enum(driverTaskStatuses),
    note: z.string().trim().max(500).optional().default(""),
    evidenceImageDataUri: z
      .string()
      .trim()
      .regex(/^data:image\/(png|jpeg|jpg|webp);base64,/i, "Evidence image is required")
      .optional(),
    items: z.array(collectionItemSchema).optional().default([]),
  }),
});
