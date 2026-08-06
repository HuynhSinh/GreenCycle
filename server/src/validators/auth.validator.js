import { z } from "zod";

const username = z
  .string()
  .trim()
  .min(3)
  .max(50)
  .regex(/^[a-zA-Z0-9_.-]+$/);

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must not exceed 128 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const registerSchema = z.object({
  body: z.object({
    username,
    email: z.string().trim().email().max(255),
    password,
  }),
});

export const loginSchema = z.object({
  body: z.object({
    identifier: z.string().trim().min(1).max(255).optional(),
    email: z.string().trim().max(255).optional(),
    password: z.string().min(1).max(128),
    rememberMe: z.boolean().optional().default(false),
  }).refine((body) => body.identifier || body.email, {
    message: "Email or username is required",
    path: ["identifier"],
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().trim().email().max(255),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string().trim().email().max(255),
    otp: z.string().trim().regex(/^\d{6}$/, "OTP must be a 6-digit code"),
    password,
  }),
});
