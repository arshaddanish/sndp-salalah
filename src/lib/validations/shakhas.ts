import { z } from 'zod';

/**
 * Schema for validating shakha updates
 */
export const updateShakhaSchema = z.object({
  id: z.string().min(1, 'Shakha ID is required'),
  name: z
    .string()
    .min(1, 'Shakha name is required')
    .max(100, 'Shakha name must be 100 characters or less'),
});

export type UpdateShakhaInput = z.infer<typeof updateShakhaSchema>;

/**
 * Schema for just the shakha name field (used in form validation)
 */
export const shakhaNameSchema = z.object({
  name: z
    .string()
    .min(1, 'Shakha name is required')
    .max(100, 'Shakha name must be 100 characters or less'),
});

export type ShakhaNameInput = z.infer<typeof shakhaNameSchema>;
