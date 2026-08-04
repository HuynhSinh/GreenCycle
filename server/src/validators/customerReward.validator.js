import { z } from "zod";

export const redeemRewardSchema = z.object({
  params: z.object({
    rewardId: z.string().trim().min(1),
  }),
  body: z.object({
    idempotencyKey: z.string().trim().min(16).max(120),
  }),
});
