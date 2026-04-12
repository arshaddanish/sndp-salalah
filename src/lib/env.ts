import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  NODE_ENV: z.enum(['dev', 'prod', 'development', 'production', 'test']).optional().default('dev'),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env['DATABASE_URL'],
  NODE_ENV: process.env['NODE_ENV'],
});

export const isProduction = env.NODE_ENV === 'production' || env.NODE_ENV === 'prod';
export const shouldShowDetailedErrors = !isProduction;
export const isActionsWorkbenchEnabled = !isProduction;
