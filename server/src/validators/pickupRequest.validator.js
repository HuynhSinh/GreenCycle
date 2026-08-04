import { z } from "zod";

const wasteItemSchema = z.object({
  categoryName: z.string().trim().min(1).max(80),
  weight: z.coerce.number().positive().max(1000),
});

const datetimeStringSchema = z
  .string()
  .trim()
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "scheduledTime must be a valid date string",
  });

export const createPickupRequestSchema = z.object({
  body: z.object({
    fullName: z.string().trim().min(1).max(120),
    phoneNumber: z.string().trim().min(6).max(20),
    addressLine: z.string().trim().min(1).max(255),
    ward: z.string().trim().max(120).optional().default(""),
    district: z.string().trim().min(1).max(120),
    city: z.string().trim().min(1).max(120).default("Ho Chi Minh"),
    latitude: z.coerce.number().finite().min(-90).max(90),
    longitude: z.coerce.number().finite().min(-180).max(180),
    scheduledTime: datetimeStringSchema,
    note: z.string().trim().max(500).optional().default(""),
    wasteItems: z.array(wasteItemSchema).min(1).max(20),
  }),
});
