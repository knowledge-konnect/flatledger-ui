import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string(), // Temporarily remove min length validation
});

export const planCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  monthlyAmount: z.coerce
    .number()
    .positive('Amount must be positive'),
  currency: z.string().length(3, 'Currency must be 3 characters (e.g. INR)'),
  durationMonths: z.coerce
    .number()
    .int()
    .min(1, 'Minimum 1 month'),
});

export const planUpdateSchema = planCreateSchema.extend({
  isActive: z.boolean().optional(),
});

export const platformSettingSchema = z.object({
  key: z.string().min(1, 'Key is required').max(100),
  value: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type PlanCreateFormData = z.infer<typeof planCreateSchema>;
export type PlanUpdateFormData = z.infer<typeof planUpdateSchema>;
export type PlatformSettingFormData = z.infer<typeof platformSettingSchema>;
