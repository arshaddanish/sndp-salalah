import { z } from 'zod';

export const TRANSACTION_REMARKS_MAX_LENGTH = 500;

export const transactionRemarksSchema = z
  .string()
  .trim()
  .max(
    TRANSACTION_REMARKS_MAX_LENGTH,
    `Remarks must be ${TRANSACTION_REMARKS_MAX_LENGTH} characters or less`,
  )
  .optional()
  .or(z.literal(''));

export const createTransactionSchema = z.object({
  remarks: transactionRemarksSchema,
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
