import { z } from 'zod';

export const requiredText = (label: string) => z.string().trim().min(1, `${label} is required`);

export const toOptionalTrimmedText = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const optionalText = () =>
  z.union([z.string(), z.undefined(), z.null()]).transform((value) => toOptionalTrimmedText(value));

export const optionalTextMax = (label: string, max: number) =>
  optionalText().refine((value) => value === null || value.length <= max, `${label} is too long`);

export const isValidDateValue = (value: string) => !Number.isNaN(Date.parse(value));

export const requiredDate = (label: string) =>
  requiredText(label).refine((value) => isValidDateValue(value), `${label} must be a valid date`);

export const optionalDate = z
  .union([z.string(), z.undefined(), z.null()])
  .transform((value) => toOptionalTrimmedText(value))
  .refine((value) => value === null || isValidDateValue(value), 'Date must be valid');
