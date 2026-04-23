import { z } from 'zod';

import { MEMBER_PHOTO_DEFAULT_MAX_BYTES } from './validations/members';
import { TRANSACTION_ATTACHMENT_DEFAULT_MAX_BYTES } from './validations/transactions';

const serverSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  BETTER_AUTH_SECRET: z.string().min(1, 'BETTER_AUTH_SECRET is required'),
  AWS_REGION: z.string().trim().optional(),
  S3_TRANSACTIONS_BUCKET: z.string().trim().optional(),
  S3_MEMBERS_BUCKET: z.string().trim().optional(),
  AWS_ACCESS_KEY_ID: z.string().trim().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().trim().optional(),
});

const clientSchema = z.object({
  NODE_ENV: z.enum(['dev', 'prod', 'development', 'production', 'test']).optional().default('dev'),
  BETTER_AUTH_URL: z.string().min(1, 'BETTER_AUTH_URL is required'),
  TRANSACTION_ATTACHMENT_MAX_BYTES: z.coerce.number().int().positive().optional(),
  MEMBER_PHOTO_MAX_BYTES: z.coerce.number().int().positive().optional(),
});

const isServer = typeof window === 'undefined';

const serverEnv = isServer
  ? serverSchema.parse({
      DATABASE_URL: process.env['DATABASE_URL'],
      BETTER_AUTH_SECRET: process.env['BETTER_AUTH_SECRET'],
      AWS_REGION: process.env['AWS_REGION'],
      S3_TRANSACTIONS_BUCKET: process.env['S3_TRANSACTIONS_BUCKET'],
      S3_MEMBERS_BUCKET: process.env['S3_MEMBERS_BUCKET'],
      AWS_ACCESS_KEY_ID: process.env['AWS_ACCESS_KEY_ID'],
      AWS_SECRET_ACCESS_KEY: process.env['AWS_SECRET_ACCESS_KEY'],
    })
  : ({} as z.infer<typeof serverSchema>);

const clientEnv = clientSchema.parse({
  NODE_ENV: process.env['NODE_ENV'],
  BETTER_AUTH_URL: process.env['NEXT_PUBLIC_BETTER_AUTH_URL'],
  TRANSACTION_ATTACHMENT_MAX_BYTES: process.env['TRANSACTION_ATTACHMENT_MAX_BYTES'],
  MEMBER_PHOTO_MAX_BYTES: process.env['MEMBER_PHOTO_MAX_BYTES'],
});

export const env = {
  ...serverEnv,
  ...clientEnv,
};

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
