import { z } from 'zod';

export const TransactionSignalsSchema = z.object({
  deviceTrust: z.enum(['TRUSTED', 'UNKNOWN', 'NEW']).default('UNKNOWN'),
  ipReputation: z.enum(['GOOD', 'SUSPICIOUS', 'BLACKLISTED']).default('GOOD'),
  geographicVelocityStatus: z.enum(['NORMAL', 'IMPOSSIBLE_TRAVEL']).default('NORMAL'),
  dwellTime: z.number().min(0).max(3600).default(3.5),
  mouseEntropy: z.number().min(0).max(1).default(0.75),
  pasteDetected: z.boolean().default(false),
  typingCadence: z.enum(['NORMAL', 'BOT_LIKE', 'IRREGULAR']).default('NORMAL'),
  transactionVelocity: z.enum(['NORMAL', 'HIGH', 'BURST']).default('NORMAL'),
  ipAddress: z.string().optional().default('103.21.244.18'),
  location: z.string().optional().default('Mumbai, India'),
  deviceId: z.string().optional().default('dev_demo_88f9'),
  userAgent: z.string().optional(),
});

export const EvaluateScoreRequestSchema = z.object({
  amount: z.number().positive().max(10000000).default(2499.00),
  currency: z.string().min(2).max(5).default('INR'),
  signals: TransactionSignalsSchema,
});

export const CreateTransactionRequestSchema = z.object({
  amount: z.number().positive().max(10000000),
  currency: z.string().min(2).max(5).default('INR'),
  customerName: z.string().min(1).max(100).default('Aarav Sharma'),
  customerEmail: z.string().email().default('aarav.sharma@example.com'),
  merchantName: z.string().min(1).max(100).default('SecurePay Cloud Merchant'),
  signals: TransactionSignalsSchema,
});

export const VerifyOtpRequestSchema = z.object({
  transactionId: z.string().uuid(),
  otp: z.string().regex(/^\d{6}$/, 'OTP must be exactly 6 digits'),
});

export const ResendOtpRequestSchema = z.object({
  transactionId: z.string().uuid(),
});

export const TransactionQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  decision: z.enum(['ALLOW', 'CHALLENGE', 'BLOCK']).optional(),
  status: z.enum(['NOT_REQUIRED', 'PENDING', 'VERIFIED', 'FAILED', 'BLOCKED']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
