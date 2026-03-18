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

export const subscriptionUpdateSchema = z.object({
  planId: z.string().uuid('Invalid plan selected'),
  status: z.enum(['active', 'cancelled', 'trial', 'expired']),
  currentPeriodStart: z.string().optional().nullable(),
  currentPeriodEnd: z.string().optional().nullable(),
});

export const featureFlagCreateSchema = z.object({
  key: z
    .string()
    .min(1, 'Key is required')
    .regex(/^[A-Z0-9_]+$/, 'Key must be UPPER_SNAKE_CASE (e.g. MY_FEATURE)'),
  description: z.string().optional(),
  isEnabled: z.boolean(),
  societyId: z.coerce.number().int().min(1).optional().nullable(),
});

export const featureFlagUpdateSchema = z.object({
  description: z.string().optional(),
  isEnabled: z.boolean(),
});

export const platformSettingSchema = z.object({
  key: z.string().min(1, 'Key is required').max(100),
  value: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

export const societyUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  pincode: z.string().optional().nullable(),
  currency: z.string().length(3, 'Currency must be 3 characters'),
  defaultMaintenanceCycle: z.enum(['monthly', 'quarterly', 'yearly']),
  isDeleted: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type PlanCreateFormData = z.infer<typeof planCreateSchema>;
export type PlanUpdateFormData = z.infer<typeof planUpdateSchema>;
export type SubscriptionUpdateFormData = z.infer<typeof subscriptionUpdateSchema>;
export type FeatureFlagCreateFormData = z.infer<typeof featureFlagCreateSchema>;
export type FeatureFlagUpdateFormData = z.infer<typeof featureFlagUpdateSchema>;
export type PlatformSettingFormData = z.infer<typeof platformSettingSchema>;
export type SocietyUpdateFormData = z.infer<typeof societyUpdateSchema>;
