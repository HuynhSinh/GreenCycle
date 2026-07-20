import { z } from "zod";

const username = z
  .string()
  .trim()
  .min(3)
  .max(50)
  .regex(/^[a-zA-Z0-9_.-]+$/);

const password = z.string().min(8).max(128);

export const registerSchema = z.object({
  body: z.object({
    username,
    email: z.string().trim().email().max(255),
    password,
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email().max(255),
    password: z.string().min(1).max(128),
    rememberMe: z.boolean().optional().default(false),
  }),
});
