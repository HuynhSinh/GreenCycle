import { z } from "zod";

export const pickupIdParamsSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1),
  }),
});

export const updatePickupStatusSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1),
  }),
  body: z
    .object({
      status: z.enum(["COLLECTING", "COLLECTED"]),
      actualQuantity: z.coerce.number().positive().optional(),
      note: z.string().trim().max(1000).optional(),
      imageUrl: z.string().trim().max(2000).optional(),
    })
    .superRefine((value, ctx) => {
      if (value.status === "COLLECTED" && !(Number(value.actualQuantity) > 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "actualQuantity is required when status is COLLECTED",
          path: ["actualQuantity"],
        });
      }
    }),
});
