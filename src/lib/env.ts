import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  ENABLE_ACTIONS_PLAYGROUND: z.enum(['true', 'false']).optional().default('false'),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env['DATABASE_URL'],
  ENABLE_ACTIONS_PLAYGROUND: process.env['ENABLE_ACTIONS_PLAYGROUND'],
});

export const isActionsPlaygroundEnabled = env.ENABLE_ACTIONS_PLAYGROUND === 'true';
