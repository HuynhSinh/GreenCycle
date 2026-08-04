import { z } from "zod";

const driverStatuses = ["ALL", "ACTIVE", "INACTIVE", "PENDING_PROFILE"];

export const listDriversSchema = z.object({
  query: z.object({
    q: z.string().trim().max(120).optional().default(""),
    status: z.enum(driverStatuses).optional().default("ALL"),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  }),
});

export const createDriverAccountSchema = z.object({
  body: z.object({
    username: z.string().trim().min(3).max(50),
    email: z.string().trim().email().max(120).optional().or(z.literal("")),
    password: z.string().min(8).max(100),
    fullName: z.string().trim().min(1).max(120).optional(),
    phoneNumber: z.string().trim().min(8).max(20).optional(),
    vehicleInfo: z.string().trim().max(120).optional().default(""),
    licensePlate: z.string().trim().max(30).optional().default(""),
    maxCapacityKg: z.coerce.number().positive().optional(),
  }),
});

export const driverAccountParamsSchema = z.object({
  params: z.object({
    accountId: z.string().trim().min(1),
  }),
});

export const updateOwnDriverProfileSchema = z.object({
  body: z.object({
    fullName: z.string().trim().min(1).max(120),
    phoneNumber: z.string().trim().min(8).max(20),
    vehicleInfo: z.string().trim().min(1).max(120),
    licensePlate: z.string().trim().min(1).max(30),
    maxCapacityKg: z.coerce.number().positive(),
    email: z.string().trim().email().max(120),
  }),
});
