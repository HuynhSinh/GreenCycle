import { z } from "zod";

const rewardTypes = ["DIGITAL_VOUCHER", "PHYSICAL_PRODUCT"];

const optionalText = (max = 500) => z.string().trim().max(max).optional().default("");

const imageDataUriSchema = z
  .string()
  .trim()
  .regex(/^data:image\/(png|jpeg|jpg|webp);base64,/i, "Invalid image data")
  .optional();

const rewardPayloadSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: optionalText(1000),
  type: z.enum(rewardTypes),
  pointCost: z.coerce.number().int().positive(),
  partnerName: optionalText(120),
  imageUrl: z.string().trim().url().optional().or(z.literal("")),
  imageDataUri: imageDataUriSchema,
  stockQuantity: z.coerce.number().int().min(0).optional().default(0),
  isUnlimited: z.boolean().optional().default(false),
});

export const listRewardsSchema = z.object({
  query: z.object({
    q: z.string().trim().max(120).optional().default(""),
    type: z.enum(["ALL", ...rewardTypes]).optional().default("ALL"),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  }),
});

export const createRewardSchema = z.object({
  body: rewardPayloadSchema,
});

export const updateRewardSchema = z.object({
  params: z.object({
    rewardId: z.string().trim().min(1),
  }),
  body: rewardPayloadSchema.partial().refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  }),
});

export const updateRewardInventorySchema = z.object({
  params: z.object({
    rewardId: z.string().trim().min(1),
  }),
  body: z.object({
    stockQuantity: z.coerce.number().int().min(0).optional(),
    isUnlimited: z.boolean().optional(),
  }),
});
