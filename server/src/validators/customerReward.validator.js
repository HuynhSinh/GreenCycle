import { z } from "zod";

export const redeemRewardSchema = z.object({
  params: z.object({
    rewardId: z.string().trim().min(1),
  }),
});
