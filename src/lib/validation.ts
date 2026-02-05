import { z } from 'zod';

/**
 * Reusable Zod schemas for common form validations
 */

// Email validation
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email format')
  .toLowerCase()
  .trim();

// Password validation
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// Phone number validation (Indian format)
export const phoneSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, 'Invalid phone number. Must be 10 digits starting with 6-9');

// Name validation
export const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must be less than 50 characters')
  .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces')
  .trim();

// Amount validation (currency)
export const amountSchema = z
  .number({
    required_error: 'Amount is required',
    invalid_type_error: 'Amount must be a number',
  })
  .positive('Amount must be positive')
  .finite('Amount must be a valid number');

// Flat number validation
export const flatNumberSchema = z
  .string()
  .min(1, 'Flat number is required')
  .regex(/^[A-Z0-9-/]+$/i, 'Invalid flat number format')
  .toUpperCase()
  .trim();

// Date validation
export const dateSchema = z
  .string()
  .refine((date) => !isNaN(Date.parse(date)), 'Invalid date format');

// Future date validation
export const futureDateSchema = dateSchema.refine(
  (date) => new Date(date) > new Date(),
  'Date must be in the future'
);

// Past date validation
export const pastDateSchema = dateSchema.refine(
  (date) => new Date(date) < new Date(),
  'Date must be in the past'
);

// URL validation
export const urlSchema = z
  .string()
  .url('Invalid URL format')
  .refine((url) => url.startsWith('http://') || url.startsWith('https://'), {
    message: 'URL must start with http:// or https://',
  });

/**
 * Common Form Schemas
 */

// Login form
export const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
});

// Registration form
export const registrationSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  societyName: z.string().min(2, 'Society name is required'),
  societyAddress: z.string().min(5, 'Society address is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// Flat form
export const flatSchema = z.object({
  flatNumber: flatNumberSchema,
  ownerName: nameSchema,
  ownerEmail: emailSchema,
  ownerPhone: phoneSchema,
  maintenanceAmount: amountSchema,
  status: z.enum(['active', 'inactive']),
});

// Payment form
export const paymentSchema = z.object({
  flatId: z.string().min(1, 'Please select a flat'),
  amount: amountSchema,
  paymentDate: dateSchema,
  paymentMode: z.enum(['cash', 'upi', 'cheque', 'bank_transfer', 'card']),
  referenceNumber: z.string().optional(),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
});

// Expense form
export const expenseSchema = z.object({
  category: z.enum(['electricity', 'water', 'security', 'repairs', 'salary', 'others']),
  vendor: z.string().min(2, 'Vendor name is required'),
  amount: amountSchema,
  expenseDate: dateSchema,
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
});

/**
 * Helper function to format Zod errors for display
 */
export function formatZodError(error: z.ZodError): Record<string, string> {
  const formatted: Record<string, string> = {};
  
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    formatted[path] = err.message;
  });
  
  return formatted;
}

/**
 * Password strength calculator
 */
export function calculatePasswordStrength(password: string): {
  score: number;
  label: 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';
  suggestions: string[];
} {
  let score = 0;
  const suggestions: string[] = [];

  if (password.length >= 8) score++;
  else suggestions.push('Use at least 8 characters');

  if (password.length >= 12) score++;
  if (password.length >= 16) score++;

  if (/[a-z]/.test(password)) score++;
  else suggestions.push('Add lowercase letters');

  if (/[A-Z]/.test(password)) score++;
  else suggestions.push('Add uppercase letters');

  if (/[0-9]/.test(password)) score++;
  else suggestions.push('Add numbers');

  if (/[^A-Za-z0-9]/.test(password)) score++;
  else suggestions.push('Add special characters');

  const labels: Array<'weak' | 'fair' | 'good' | 'strong' | 'very-strong'> = [
    'weak',
    'weak',
    'fair',
    'good',
    'strong',
    'very-strong',
    'very-strong',
    'very-strong',
  ];

  return {
    score: Math.min(score, 7),
    label: labels[score] || 'weak',
    suggestions,
  };
}
