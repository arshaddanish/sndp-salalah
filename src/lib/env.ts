import { z } from 'zod';

import { TRANSACTION_ATTACHMENT_DEFAULT_MAX_BYTES } from '@/lib/validations/transactions';
import { MEMBER_PHOTO_DEFAULT_MAX_BYTES } from '@/lib/validations/members';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  NODE_ENV: z.enum(['dev', 'prod', 'development', 'production', 'test']).optional().default('dev'),
  AWS_REGION: z.string().trim().optional(),
  S3_TRANSACTIONS_BUCKET: z.string().trim().optional(),
  S3_MEMBERS_BUCKET: z.string().trim().optional(),
  AWS_ACCESS_KEY_ID: z.string().trim().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().trim().optional(),
  TRANSACTION_ATTACHMENT_MAX_BYTES: z.coerce.number().int().positive().optional(),
  MEMBER_PHOTO_MAX_BYTES: z.coerce.number().int().positive().optional(),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env['DATABASE_URL'],
  NODE_ENV: process.env['NODE_ENV'],
  AWS_REGION: process.env['AWS_REGION'],
  S3_TRANSACTIONS_BUCKET: process.env['S3_TRANSACTIONS_BUCKET'],
  S3_MEMBERS_BUCKET: process.env['S3_MEMBERS_BUCKET'],
  AWS_ACCESS_KEY_ID: process.env['AWS_ACCESS_KEY_ID'],
  AWS_SECRET_ACCESS_KEY: process.env['AWS_SECRET_ACCESS_KEY'],
  TRANSACTION_ATTACHMENT_MAX_BYTES: process.env['TRANSACTION_ATTACHMENT_MAX_BYTES'],
  MEMBER_PHOTO_MAX_BYTES: process.env['MEMBER_PHOTO_MAX_BYTES'],
});

export function getTransactionAttachmentLimits() {
  return {
    attachmentMaxBytes:
      env.TRANSACTION_ATTACHMENT_MAX_BYTES ?? TRANSACTION_ATTACHMENT_DEFAULT_MAX_BYTES,
  };
}

export function getMemberPhotoLimits() {
  return {
    photoMaxBytes: env.MEMBER_PHOTO_MAX_BYTES ?? MEMBER_PHOTO_DEFAULT_MAX_BYTES,
  };
}

export const isProduction = env.NODE_ENV === 'production' || env.NODE_ENV === 'prod';
export const shouldShowDetailedErrors = !isProduction;
export const isActionsWorkbenchEnabled = !isProduction;
