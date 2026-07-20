import * as z from 'zod';

// Common validation schemas
export const emailSchema = z
  .string()
  .min(1, 'Email address is required')
  .email('Please enter a valid email address')
  .toLowerCase()
  .trim();

export const passwordSchema = z
  .string()
  .min(1, 'Password is required')
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const passwordSchemaLogin = z
  .string()
  .min(1, 'Password is required')
  .min(8, 'Password must be at least 8 characters');

export const fullNameSchema = z
  .string()
  .min(1, 'Full Name is required')
  .min(2, 'Full Name must be at least 2 characters')
  .max(50, 'Full Name must not exceed 50 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Full Name can only contain letters, spaces, hyphens, and apostrophes')
  .trim();

// Login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchemaLogin,
  rememberMe: z.boolean().optional(),
});

// Sign up schema
export const signupSchema = z
  .object({
    fullName: fullNameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    acceptTerms: z
      .boolean()
      .refine((val) => val === true, {
        message: 'You must agree to the Terms and Conditions and Privacy Policy',
      }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// Password strength calculator
export const calculatePasswordStrength = (pwd) => {
  if (!pwd) return { score: 0, label: '', color: '' };

  let score = 0;
  const checks = {
    length: pwd.length >= 8,
    uppercase: /[A-Z]/.test(pwd),
    lowercase: /[a-z]/.test(pwd),
    number: /[0-9]/.test(pwd),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
  };

  Object.values(checks).forEach((check) => {
    if (check) score++;
  });

  const strengthLevels = {
    1: { label: 'Weak', color: 'bg-red-500' },
    2: { label: 'Fair', color: 'bg-orange-500' },
    3: { label: 'Good', color: 'bg-yellow-500' },
    4: { label: 'Strong', color: 'bg-blue-500' },
    5: { label: 'Very Strong', color: 'bg-emerald-500' },
  };

  return {
    score,
    ...strengthLevels[score],
    checks,
  };
};
