import { z } from 'zod';

export const TRANSACTION_REMARKS_MAX_LENGTH = 500;
const OMR_AMOUNT_PATTERN = /^\d+(?:\.\d{1,3})?$/;
const transactionPartySchema = z.string().trim().max(200, 'Must be 200 characters or less');

const transactionRemarksSchema = z
  .string()
  .trim()
  .max(
    TRANSACTION_REMARKS_MAX_LENGTH,
    `Remarks must be ${TRANSACTION_REMARKS_MAX_LENGTH} characters or less`,
  )
  .optional()
  .or(z.literal(''));

export const createTransactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z
    .string()
    .trim()
    .min(1, 'Amount is required')
    .regex(OMR_AMOUNT_PATTERN, 'Amount must be a valid OMR value with up to 3 decimals')
    .refine((value) => Number(value) > 0, 'Amount must be greater than 0'),
  transactionDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Transaction date is required')
    .refine((value) => !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime()), {
      message: 'Transaction date is invalid',
    }),
  categoryId: z.string().trim().min(1, 'Category is required'),
  paymentMode: z.enum(['cash', 'bank', 'online_transaction', 'cheque'], {
    message: 'Please select a payment method.',
  }),
  fundAccount: z.enum(['cash', 'bank'], { message: 'Please select a fund account.' }),
  payeeMerchant: transactionPartySchema.optional().default(''),
  paidReceiptBy: transactionPartySchema.optional().default(''),
  remarks: transactionRemarksSchema,
  attachmentKey: z.string().trim().optional().or(z.literal('')),
});

export const createOpeningBalanceSchema = z.object({
  fundAccount: z.enum(['cash', 'bank'], { message: 'Please select a fund account.' }),
  amount: z
    .string()
    .trim()
    .min(1, 'Amount is required')
    .regex(OMR_AMOUNT_PATTERN, 'Amount must be a valid OMR value with up to 3 decimals')
    .refine((value) => Number(value) >= 0, 'Amount cannot be negative'),
  transactionDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Transaction date is required')
    .refine((value) => !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime()), {
      message: 'Transaction date is invalid',
    }),
  remarks: transactionRemarksSchema,
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type CreateOpeningBalanceInput = z.infer<typeof createOpeningBalanceSchema>;
