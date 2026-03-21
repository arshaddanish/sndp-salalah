import { z } from 'zod';

export const categoryNameSchema = z
  .string()
  .trim()
  .min(1, 'Category name is required')
  .max(100, 'Category name must be 100 characters or less');

export const categoryTypeSchema = z.enum(['income', 'expense']);

export const createCategorySchema = z.object({
  name: categoryNameSchema,
  type: categoryTypeSchema,
});

export const updateCategorySchema = z.object({
  id: z.string().trim().min(1, 'Category ID is required'),
  name: categoryNameSchema,
  type: categoryTypeSchema,
});

export const deleteCategorySchema = z.object({
  id: z.string().trim().min(1, 'Category ID is required'),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type DeleteCategoryInput = z.infer<typeof deleteCategorySchema>;
