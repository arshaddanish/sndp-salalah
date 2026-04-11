'use server';

import { and, asc, desc, eq, gte, ilike, lte, or, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { db } from '@/lib/db';
import { transactionCategories, transactions } from '@/lib/db/schema';
import { parseEndOfDayOrNull, parseStartOfDayOrNull } from '@/lib/utils/date';
import {
  createOpeningBalanceSchema,
  createTransactionSchema,
  type UpdateTransactionInput,
  updateTransactionSchema,
} from '@/lib/validations/transactions';
import type { ActionResult } from '@/types/actions';
import type { TransactionsQuery } from '@/types/filters/transactions';
import type { PaginationResponse } from '@/types/pagination';
import type {
  ExistingOpeningBalance,
  RegularTransactionRow,
  TransactionStatementRow,
} from '@/types/transactions';

const OPENING_BALANCE_TRANSACTION_CODES = {
  cash: 999,
  bank: 1000,
} as const;

async function getNextTransactionCode(): Promise<number> {
  const result = await db
    .select({ max: sql<number>`max(${transactions.transaction_code})` })
    .from(transactions)
    .where(eq(transactions.entry_kind, 'regular'));

  return (result[0]?.max ?? 1000) + 1;
}

function isRegularTransactionRow(
  transaction: TransactionStatementRow,
): transaction is RegularTransactionRow {
  return (
    transaction.entryKind === 'regular' &&
    transaction.categoryId !== null &&
    transaction.categoryName !== null &&
    transaction.type !== null &&
    transaction.paymentMode !== null
  );
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

    const nextTransactionCode = await getNextTransactionCode();
    const amount = Number(validationResult.data.amount).toFixed(3);

    const [created] = await db
      .insert(transactions)
      .values({
        transaction_code: nextTransactionCode,
        transaction_date: new Date(validationResult.data.transactionDate),
        entry_kind: 'regular',
        category_id: category.id,
        type: validationResult.data.type,
        payment_mode: validationResult.data.paymentMode as
          | 'cash'
          | 'bank'
          | 'online_transaction'
          | 'cheque',
        fund_account: validationResult.data.fundAccount,
        payee_merchant: validationResult.data.payeeMerchant,
        paid_receipt_by: validationResult.data.paidReceiptBy,
        amount,
        remarks: validationResult.data.remarks ?? '',
        attachment_key: validationResult.data.attachmentKey,
      })
      .returning();

    revalidatePath('/transactions');

    return {
      success: true,
      data: { id: created!.id },
    };
  } catch (error) {
    console.error('Error creating transaction:', error);
    return {
      success: false,
      error: 'Unable to create transaction. Please try again.',
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

    revalidatePath('/transactions');
    return { success: true, data: { id: created!.id } };
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
      transaction: (typeof openingBalances)[0] | undefined,
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
function computeRunningBalances(
  allTransactions: {
    id: string;
    amount: string;
    type: string | null;
    fundAccount: string;
    entryKind: string;
  }[],
): Map<string, { cashBalance: string; bankBalance: string }> {
  let cashBalance = 0;
  let bankBalance = 0;
  const balanceMap = new Map<string, { cashBalance: string; bankBalance: string }>();

  for (const t of allTransactions) {
    let delta = Number(t.amount);
    if (t.entryKind === 'regular' && t.type === 'expense') delta = -delta;
    if (t.fundAccount === 'cash') cashBalance += delta;
    else bankBalance += delta;
    balanceMap.set(t.id, {
      cashBalance: cashBalance.toFixed(3),
      bankBalance: bankBalance.toFixed(3),
    });
  }

  return balanceMap;
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
    if (typeFilter) conditions.push(eq(transactions.type, typeFilter));
    if (fundAccountFilter) conditions.push(eq(transactions.fund_account, fundAccountFilter));
    if (startDateFilter) conditions.push(gte(transactions.transaction_date, startDateFilter));
    if (endDateFilter) conditions.push(lte(transactions.transaction_date, endDateFilter));

    const offset = (page - 1) * pageSize;

    const [rows, countResult, allTransactions] = await Promise.all([
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
        .orderBy(desc(transactions.transaction_date), desc(transactions.created_at))
        .limit(pageSize)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(transactions)
        .where(and(...conditions)),
      db
        .select({
          id: transactions.id,
          amount: transactions.amount,
          type: transactions.type,
          fundAccount: transactions.fund_account,
          entryKind: transactions.entry_kind,
          transactionDate: transactions.transaction_date,
          createdAt: transactions.created_at,
          transactionCode: transactions.transaction_code,
        })
        .from(transactions)
        .orderBy(asc(transactions.transaction_date), asc(transactions.created_at)),
    ]);

    const balanceMap = computeRunningBalances(allTransactions);

    const totalCount = Number(countResult[0]?.count ?? 0);

    const items: RegularTransactionRow[] = rows.filter(isRegularTransactionRow).map((row) => {
      const balances = balanceMap.get(row.id) ?? {
        cashBalance: '0.000',
        bankBalance: '0.000',
      };
      return { ...row, ...balances };
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
    });

    if (!existing) {
      return { success: false, error: 'Transaction not found.' };
    }

    await db.delete(transactions).where(eq(transactions.id, id));
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

    await db
      .update(transactions)
      .set({
        type: validationResult.data.type,
        amount: Number(validationResult.data.amount).toFixed(3),
        transaction_date: new Date(validationResult.data.transactionDate),
        category_id: validationResult.data.categoryId,
        payment_mode: validationResult.data.paymentMode as
          | 'cash'
          | 'bank'
          | 'online_transaction'
          | 'cheque',
        fund_account: validationResult.data.fundAccount,
        payee_merchant: validationResult.data.payeeMerchant,
        paid_receipt_by: validationResult.data.paidReceiptBy,
        remarks: validationResult.data.remarks ?? '',
        updated_at: new Date(),
      })
      .where(eq(transactions.id, id));

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
