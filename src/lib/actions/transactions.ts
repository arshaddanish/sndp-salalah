'use server';

import { and, desc, eq, gte, ilike, lte, or, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { db } from '@/lib/db';
import { transactionCategories, transactions } from '@/lib/db/schema';
import { getTransactionAttachmentLimits } from '@/lib/env';
import {
  buildTransactionAttachmentKey,
  deleteS3Object,
  getPresignedDownloadUrl,
  getPresignedUploadUrl,
} from '@/lib/s3';
import { parseEndOfDayOrNull, parseStartOfDayOrNull } from '@/lib/utils/date';
import {
  createOpeningBalanceSchema,
  createTransactionAttachmentUploadSchema,
  createTransactionSchema,
  type UpdateTransactionInput,
  updateTransactionSchema,
} from '@/lib/validations/transactions';
import type { ActionResult } from '@/types/actions';
import type { TransactionsQuery } from '@/types/filters/transactions';
import type { PaginationResponse } from '@/types/pagination';
import type { ExistingOpeningBalance, RegularTransactionRow } from '@/types/transactions';

const OPENING_BALANCE_TRANSACTION_CODES = {
  cash: 999,
  bank: 1000,
} as const;

/** Shared subset of db and PgTransaction that supports Drizzle's select API */
type TxOrDb = Pick<typeof db, 'select'>;

function normalizeAttachmentKey(attachmentKey: string | undefined): string | null {
  const trimmed = attachmentKey?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
}

export async function getNextTransactionCode(tx: TxOrDb = db): Promise<number> {
  const result = await tx
    .select({ max: sql<number>`max(${transactions.transaction_code})` })
    .from(transactions)
    .where(eq(transactions.entry_kind, 'regular'));

  return (result[0]?.max ?? 1000) + 1;
}

export async function createTransaction(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const validationResult = createTransactionSchema.safeParse(input);

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? 'Invalid transaction input.',
      };
    }

    const category = await db.query.transactionCategories.findFirst({
      where: and(
        eq(transactionCategories.id, validationResult.data.categoryId),
        eq(transactionCategories.is_system, false),
        eq(transactionCategories.type, validationResult.data.type),
      ),
    });

    if (!category) {
      return {
        success: false,
        error: 'Please select a valid category for the selected transaction type.',
      };
    }

    const amount = Number(validationResult.data.amount).toFixed(3);

    const created = await db.transaction(async (tx) => {
      const nextTransactionCode = await getNextTransactionCode(tx);
      const [row] = await tx
        .insert(transactions)
        .values({
          transaction_code: nextTransactionCode,
          transaction_date: new Date(validationResult.data.transactionDate),
          entry_kind: 'regular',
          category_id: category.id,
          type: validationResult.data.type,
          payment_mode: validationResult.data.paymentMode,
          fund_account: validationResult.data.fundAccount,
          payee_merchant: validationResult.data.payeeMerchant,
          paid_receipt_by: validationResult.data.paidReceiptBy,
          amount,
          remarks: validationResult.data.remarks ?? '',
          attachment_key: normalizeAttachmentKey(validationResult.data.attachmentKey),
        })
        .returning();
      if (!row) throw new Error('Failed to create transaction.');
      return row;
    });

    if (!created) {
      return { success: false, error: 'Failed to create transaction.' };
    }

    revalidatePath('/transactions');

    return {
      success: true,
      data: { id: created.id },
    };
  } catch (error) {
    console.error('Error creating transaction:', error);
    return {
      success: false,
      error: 'Unable to create transaction. Please try again.',
    };
  }
}

/**
 * Request a pre-signed URL to upload an attachment for a transaction.
 * Does NOT update the transaction record itself; the caller must provide the
 * resulting attachmentKey to create/update transaction actions.
 */
export async function requestTransactionAttachmentUpload(
  input: unknown,
): Promise<ActionResult<{ attachmentKey: string; uploadUrl: string }>> {
  try {
    const validationResult = createTransactionAttachmentUploadSchema.safeParse(input);

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? 'Invalid attachment details.',
      };
    }

    const { attachmentMaxBytes } = getTransactionAttachmentLimits();
    if (validationResult.data.fileSize > attachmentMaxBytes) {
      const maxSizeLabel =
        attachmentMaxBytes >= 1024 * 1024
          ? `${(attachmentMaxBytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, '')} MB`
          : `${Math.ceil(attachmentMaxBytes / 1024)} KB`;
      return {
        success: false,
        error: `Attachment must be ${maxSizeLabel} or smaller.`,
      };
    }

    const attachmentKey = buildTransactionAttachmentKey(validationResult.data.fileName);
    const uploadUrl = await getPresignedUploadUrl(
      'transactions',
      attachmentKey,
      validationResult.data.fileType,
    );

    return {
      success: true,
      data: {
        attachmentKey,
        uploadUrl,
      },
    };
  } catch (error) {
    console.error('Error creating transaction attachment upload URL:', error);
    return {
      success: false,
      error: 'Unable to prepare attachment upload. Please try again.',
    };
  }
}

/**
 * Generates a pre-signed download URL for a transaction's attachment.
 */
export async function getTransactionAttachmentDownload(
  transactionId: string,
): Promise<ActionResult<{ downloadUrl: string }>> {
  try {
    const idValidation = z.string().uuid().safeParse(transactionId);
    if (!idValidation.success) {
      return { success: false, error: 'Invalid transaction ID.' };
    }

    const transaction = await db.query.transactions.findFirst({
      where: eq(transactions.id, transactionId),
      columns: {
        id: true,
        attachment_key: true,
      },
    });

    if (!transaction) {
      return { success: false, error: 'Transaction not found.' };
    }

    if (!transaction.attachment_key) {
      return { success: false, error: 'No attachment found for this transaction.' };
    }

    const downloadUrl = await getPresignedDownloadUrl('transactions', transaction.attachment_key);

    if (!downloadUrl) {
      return { success: false, error: 'Unable to open attachment. Please try again.' };
    }

    return {
      success: true,
      data: {
        downloadUrl,
      },
    };
  } catch (error) {
    console.error('Error creating transaction attachment download URL:', error);
    return {
      success: false,
      error: 'Unable to open attachment. Please try again.',
    };
  }
}

export async function createOpeningBalance(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const validationResult = createOpeningBalanceSchema.safeParse(input);

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? 'Invalid opening balance input.',
      };
    }

    const amount = Number(validationResult.data.amount).toFixed(3);
    const transactionCode = OPENING_BALANCE_TRANSACTION_CODES[validationResult.data.fundAccount];

    const existing = await db.query.transactions.findFirst({
      where: and(
        eq(transactions.entry_kind, 'opening_balance'),
        eq(transactions.fund_account, validationResult.data.fundAccount),
      ),
    });

    if (existing) {
      await db
        .update(transactions)
        .set({
          amount,
          transaction_date: new Date(validationResult.data.transactionDate),
          remarks: validationResult.data.remarks ?? '',
          updated_at: new Date(),
        })
        .where(eq(transactions.id, existing.id));

      revalidatePath('/transactions');
      return { success: true, data: { id: existing.id } };
    }

    const [created] = await db
      .insert(transactions)
      .values({
        transaction_code: transactionCode,
        transaction_date: new Date(validationResult.data.transactionDate),
        entry_kind: 'opening_balance',
        fund_account: validationResult.data.fundAccount,
        amount,
        remarks: validationResult.data.remarks ?? '',
      })
      .returning();

    if (!created) {
      return { success: false, error: 'Failed to set opening balance.' };
    }

    revalidatePath('/transactions');
    return { success: true, data: { id: created.id } };
  } catch (error) {
    console.error('Error creating opening balance:', error);
    return {
      success: false,
      error: 'Unable to set opening balance. Please try again.',
    };
  }
}

export async function fetchOpeningBalances(): Promise<
  ActionResult<{ cash: ExistingOpeningBalance | null; bank: ExistingOpeningBalance | null }>
> {
  try {
    const openingBalances = await db.query.transactions.findMany({
      where: eq(transactions.entry_kind, 'opening_balance'),
    });

    const toExistingOpeningBalance = (
      transaction: typeof transactions.$inferSelect | undefined,
    ): ExistingOpeningBalance | null => {
      if (!transaction) return null;
      return {
        id: transaction.id,
        amount: transaction.amount,
        transactionDate: transaction.transaction_date.toISOString().slice(0, 10),
        remarks: transaction.remarks,
      };
    };

    return {
      success: true,
      data: {
        cash: toExistingOpeningBalance(openingBalances.find((t) => t.fund_account === 'cash')),
        bank: toExistingOpeningBalance(openingBalances.find((t) => t.fund_account === 'bank')),
      },
    };
  } catch (error) {
    console.error('Error fetching opening balances:', error);
    return {
      success: false,
      error: 'Unable to load opening balances. Please try again.',
    };
  }
}

export async function fetchTransactions(
  page: number,
  pageSize: number,
  query?: TransactionsQuery,
): Promise<ActionResult<PaginationResponse<RegularTransactionRow>>> {
  const isValidPage = Number.isInteger(page) && page > 0;
  const isValidPageSize = Number.isInteger(pageSize) && pageSize > 0;

  if (!isValidPage || !isValidPageSize) {
    return {
      success: false,
      error: 'Invalid pagination: page and pageSize must be positive integers.',
    };
  }

  try {
    const searchQuery = (query?.q ?? '').trim();
    const categoryIdFilter = (query?.categoryId ?? '').trim();
    const typeFilter = (query?.type ?? '').trim();
    const fundAccountFilter = (query?.fundAccount ?? '').trim();
    const startDateFilter = parseStartOfDayOrNull(query?.startDate);
    const endDateFilter = parseEndOfDayOrNull(query?.endDate);

    const conditions = [eq(transactions.entry_kind, 'regular')];

    if (searchQuery) {
      conditions.push(
        or(
          ilike(transactions.remarks, `%${searchQuery}%`),
          sql`${transactions.transaction_code}::text ilike ${'%' + searchQuery + '%'}`,
        )!,
      );
    }

    if (categoryIdFilter) conditions.push(eq(transactions.category_id, categoryIdFilter));
    if (typeFilter === 'income' || typeFilter === 'expense') {
      conditions.push(eq(transactions.type, typeFilter));
    }
    if (fundAccountFilter === 'cash' || fundAccountFilter === 'bank') {
      conditions.push(eq(transactions.fund_account, fundAccountFilter));
    }
    if (startDateFilter) conditions.push(gte(transactions.transaction_date, startDateFilter));
    if (endDateFilter) conditions.push(lte(transactions.transaction_date, endDateFilter));

    const offset = (page - 1) * pageSize;

    const [rows, countResult, balanceResult] = await Promise.all([
      db
        .select({
          id: transactions.id,
          transactionCode: transactions.transaction_code,
          transactionDate: transactions.transaction_date,
          entryKind: transactions.entry_kind,
          categoryId: transactions.category_id,
          categoryName: transactionCategories.name,
          type: transactions.type,
          paymentMode: transactions.payment_mode,
          fundAccount: transactions.fund_account,
          payeeMerchant: transactions.payee_merchant,
          paidReceiptBy: transactions.paid_receipt_by,
          amount: transactions.amount,
          remarks: transactions.remarks,
          attachmentKey: transactions.attachment_key,
          createdAt: transactions.created_at,
          updatedAt: transactions.updated_at,
        })
        .from(transactions)
        .leftJoin(transactionCategories, eq(transactions.category_id, transactionCategories.id))
        .where(and(...conditions))
        .orderBy(
          desc(transactions.transaction_date),
          desc(transactions.created_at),
          desc(transactions.transaction_code),
        )
        .limit(pageSize)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(transactions)
        .where(and(...conditions)),
      db.execute(sql`
        SELECT
          id,
          SUM(CASE
            WHEN fund_account = 'cash' AND (entry_kind = 'opening_balance' OR type = 'income') THEN amount::numeric
            WHEN fund_account = 'cash' AND type = 'expense' THEN -amount::numeric
            ELSE 0
          END) OVER (ORDER BY transaction_date, created_at) AS cash_balance,
          SUM(CASE
            WHEN fund_account = 'bank' AND (entry_kind = 'opening_balance' OR type = 'income') THEN amount::numeric
            WHEN fund_account = 'bank' AND type = 'expense' THEN -amount::numeric
            ELSE 0
          END) OVER (ORDER BY transaction_date, created_at) AS bank_balance
        FROM transactions
        ORDER BY transaction_date, created_at
      `),
    ]);

    const balanceMap = new Map<string, { cashBalance: string; bankBalance: string }>();
    for (const row of balanceResult.rows as {
      id: string;
      cash_balance: string;
      bank_balance: string;
    }[]) {
      balanceMap.set(row.id, {
        cashBalance: Number(row.cash_balance).toFixed(3),
        bankBalance: Number(row.bank_balance).toFixed(3),
      });
    }

    const totalCount = Number(countResult[0]?.count ?? 0);

    const items: RegularTransactionRow[] = rows
      .filter(
        (row) =>
          row.entryKind === 'regular' &&
          row.categoryId !== null &&
          row.categoryName !== null &&
          row.type !== null &&
          row.paymentMode !== null,
      )
      .map((row) => {
        const balances = balanceMap.get(row.id) ?? {
          cashBalance: '0.000',
          bankBalance: '0.000',
        };
        return {
          ...row,
          entryKind: 'regular' as const,
          categoryId: row.categoryId!,
          categoryName: row.categoryName!,
          type: row.type!,
          paymentMode: row.paymentMode!,
          payeeMerchant: row.payeeMerchant ?? '',
          paidReceiptBy: row.paidReceiptBy ?? '',
          attachmentKey: row.attachmentKey ?? '',
          ...balances,
        };
      });
    return {
      success: true,
      data: { items, totalCount },
    };
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return {
      success: false,
      error: 'Unable to load transactions. Please try again.',
    };
  }
}

export async function deleteTransaction(id: string): Promise<ActionResult<null>> {
  try {
    const existing = await db.query.transactions.findFirst({
      where: eq(transactions.id, id),
      columns: { id: true, entry_kind: true, attachment_key: true },
    });

    if (!existing) {
      return { success: false, error: 'Transaction not found.' };
    }

    if (existing.entry_kind !== 'regular') {
      return { success: false, error: 'Only regular transactions can be deleted.' };
    }

    const attachmentKey = existing.attachment_key;

    await db.delete(transactions).where(eq(transactions.id, id));

    // Cleanup: Delete attachment from S3
    if (attachmentKey) {
      deleteS3Object('transactions', attachmentKey);
    }

    revalidatePath('/transactions');
    return { success: true, data: null };
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return {
      success: false,
      error: 'Unable to delete transaction. Please try again.',
    };
  }
}

export async function updateTransaction(
  id: string,
  input: UpdateTransactionInput,
): Promise<ActionResult<null>> {
  try {
    const validationResult = updateTransactionSchema.safeParse(input);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? 'Invalid transaction input.',
      };
    }

    const category = await db.query.transactionCategories.findFirst({
      where: and(
        eq(transactionCategories.id, validationResult.data.categoryId),
        eq(transactionCategories.is_system, false),
        eq(transactionCategories.type, validationResult.data.type),
      ),
    });

    if (!category) {
      return {
        success: false,
        error: 'Please select a valid category for the selected transaction type.',
      };
    }

    const existing = await db.query.transactions.findFirst({
      where: eq(transactions.id, id),
    });

    if (!existing) {
      return { success: false, error: 'Transaction not found.' };
    }

    if (existing.entry_kind !== 'regular') {
      return { success: false, error: 'Only regular transactions can be updated.' };
    }

    const oldAttachmentKey = existing.attachment_key;
    const newAttachmentKey = normalizeAttachmentKey(validationResult.data.attachmentKey);

    await db
      .update(transactions)
      .set({
        type: validationResult.data.type,
        amount: Number(validationResult.data.amount).toFixed(3),
        transaction_date: new Date(validationResult.data.transactionDate),
        category_id: validationResult.data.categoryId,
        payment_mode: validationResult.data.paymentMode,
        fund_account: validationResult.data.fundAccount,
        payee_merchant: validationResult.data.payeeMerchant,
        paid_receipt_by: validationResult.data.paidReceiptBy,
        remarks: validationResult.data.remarks ?? '',
        attachment_key: validationResult.data.attachmentKey,
        updated_at: new Date(),
      })
      .where(eq(transactions.id, id));

    // Cleanup S3: If attachment changed, delete the old one
    if (oldAttachmentKey && oldAttachmentKey !== newAttachmentKey) {
      await deleteS3Object('transactions', oldAttachmentKey);
    }

    revalidatePath('/transactions');
    return { success: true, data: null };
  } catch (error) {
    console.error('Error updating transaction:', error);
    return {
      success: false,
      error: 'Unable to update transaction. Please try again.',
    };
  }
}
