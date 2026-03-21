import { z } from 'zod';

const shakhaNameFieldSchema = z
  .string()
  .trim()
  .min(1, 'Shakha name is required')
  .max(100, 'Shakha name must be 100 characters or less');

/**
 * Schema for validating shakha updates
 */
export const updateShakhaSchema = z.object({
  id: z.string().min(1, 'Shakha ID is required'),
  name: shakhaNameFieldSchema,
});

export type UpdateShakhaInput = z.infer<typeof updateShakhaSchema>;

/**
 * Schema for validating shakha creation
 */
export const createShakhaSchema = z.object({
  name: shakhaNameFieldSchema,
});

export type CreateShakhaInput = z.infer<typeof createShakhaSchema>;

/**
 * Schema for validating shakha deletion
 */
export const deleteShakhaSchema = z.object({
  id: z.string().min(1, 'Shakha ID is required'),
});

export type DeleteShakhaInput = z.infer<typeof deleteShakhaSchema>;

/**
 * Schema for just the shakha name field (used in form validation)
 */
export const shakhaNameSchema = z.object({
  name: shakhaNameFieldSchema,
});

export type ShakhaNameInput = z.infer<typeof shakhaNameSchema>;
