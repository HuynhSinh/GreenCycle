import { z } from "zod";

export const PICKUP_START_HOUR = 8;
export const PICKUP_END_HOUR = 17;

const pickupItemSchema = z.object({
  categoryId: z.string().trim().min(1),
  weight: z.coerce.number().positive(),
});

export const createCustomerPickupSchema = z.object({
  body: z.object({
    fullName: z.string().trim().min(1).max(120),
    phoneNumber: z.string().trim().min(8).max(20),
    addressId: z.string().trim().min(1).optional().or(z.literal("")),
    address: z.object({
      label: z.string().trim().min(1).max(80).optional().default("Pickup address"),
      addressLine: z.string().trim().min(1).max(255),
      ward: z.string().trim().min(1).max(80),
      district: z.string().trim().max(80).optional().default(""),
      city: z.string().trim().min(1).max(80).optional().default("Ho Chi Minh"),
      latitude: z.coerce.number().optional().default(10.754),
      longitude: z.coerce.number().optional().default(106.666),
    }),
    scheduledTime: z.string().datetime({ offset: true }),
    note: z.string().trim().max(500).optional().default(""),
    items: z.array(pickupItemSchema).min(1),
  }),
});

export const customerPickupParamsSchema = z.object({
  params: z.object({
    pickupId: z.string().trim().min(1),
  }),
});

export const updateCustomerPickupSchema = z.object({
  params: z.object({
    pickupId: z.string().trim().min(1),
  }),
  body: createCustomerPickupSchema.shape.body,
});
