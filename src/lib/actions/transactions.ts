'use server';

import { revalidatePath } from 'next/cache';
import z from 'zod';

import { MOCK_TRANSACTION_CATEGORIES } from '@/lib/mock-data/transaction-categories';
import { MOCK_TRANSACTIONS } from '@/lib/mock-data/transactions';
import {
  createOpeningBalanceSchema,
  createTransactionSchema,
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

function getNextTransactionCode(): number {
  const maxRegularTransactionCode = MOCK_TRANSACTIONS.reduce((maxCode, transaction) => {
    if (transaction.entryKind !== 'regular') {
      return maxCode;
    }

    return Math.max(maxCode, transaction.transactionCode);
  }, 1000);

  return maxRegularTransactionCode + 1;
}

function parseStartDate(value: string | undefined): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

function parseEndDate(value: string | undefined): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  parsed.setHours(23, 59, 59, 999);
  return parsed;
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

    const category = MOCK_TRANSACTION_CATEGORIES.find(
      (item) => item.id === validationResult.data.categoryId,
    );

    if (!category || category.is_system || category.type !== validationResult.data.type) {
      return {
        success: false,
        error: 'Please select a valid category for the selected transaction type.',
      };
    }

    const nextTransactionCode = getNextTransactionCode();
    const timestamp = Date.now();
    const now = new Date();
    const transactionDate = new Date(`${validationResult.data.transactionDate}T00:00:00.000Z`);
    const amount = Number(validationResult.data.amount).toFixed(3);
    const remarks = validationResult.data.remarks ?? '';

    const createdTransaction: TransactionStatementRow = {
      id: `txn-${timestamp}`,
      transactionCode: nextTransactionCode,
      transactionDate,
      entryKind: 'regular',
      categoryId: category.id,
      categoryName: category.name,
      type: validationResult.data.type,
      paymentMode: validationResult.data.paymentMode,
      fundAccount: validationResult.data.fundAccount,
      payeeMerchant: validationResult.data.payeeMerchant,
      paidReceiptBy: validationResult.data.paidReceiptBy,
      amount,
      remarks,
      cashBalance: '0.000',
      bankBalance: '0.000',
      ...(validationResult.data.attachmentKey
        ? { attachmentKey: validationResult.data.attachmentKey }
        : {}),
      createdAt: now,
      updatedAt: now,
    };

    MOCK_TRANSACTIONS.unshift(createdTransaction);
    revalidatePath('/transactions');

    return {
      success: true,
      data: { id: createdTransaction.id },
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

    const now = new Date();
    const transactionDate = new Date(`${validationResult.data.transactionDate}T00:00:00.000Z`);
    const amount = Number(validationResult.data.amount).toFixed(3);
    const remarks = validationResult.data.remarks ?? '';

    const existingOpeningBalance = MOCK_TRANSACTIONS.find(
      (transaction) =>
        transaction.entryKind === 'opening_balance' &&
        transaction.fundAccount === validationResult.data.fundAccount,
    );

    if (existingOpeningBalance) {
      existingOpeningBalance.transactionCode =
        OPENING_BALANCE_TRANSACTION_CODES[validationResult.data.fundAccount];
      existingOpeningBalance.amount = amount;
      existingOpeningBalance.transactionDate = transactionDate;
      existingOpeningBalance.remarks = remarks;
      existingOpeningBalance.updatedAt = now;

      revalidatePath('/transactions');

      return {
        success: true,
        data: { id: existingOpeningBalance.id },
      };
    }

    const timestamp = Date.now();

    const openingTransaction: TransactionStatementRow = {
      id: `txn-${timestamp}`,
      transactionCode: OPENING_BALANCE_TRANSACTION_CODES[validationResult.data.fundAccount],
      transactionDate,
      entryKind: 'opening_balance',
      categoryId: null,
      categoryName: null,
      type: null,
      paymentMode: null,
      fundAccount: validationResult.data.fundAccount,
      amount,
      remarks,
      cashBalance: '0.000',
      bankBalance: '0.000',
      createdAt: now,
      updatedAt: now,
    };

    MOCK_TRANSACTIONS.unshift(openingTransaction);
    revalidatePath('/transactions');

    return {
      success: true,
      data: { id: openingTransaction.id },
    };
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
    const toExistingOpeningBalance = (
      transaction: TransactionStatementRow | undefined,
    ): ExistingOpeningBalance | null => {
      if (!transaction) {
        return null;
      }

      return {
        id: transaction.id,
        amount: transaction.amount,
        transactionDate: transaction.transactionDate.toISOString().slice(0, 10),
        remarks: transaction.remarks,
      };
    };

    const cashOpeningBalance = MOCK_TRANSACTIONS.find(
      (transaction) =>
        transaction.entryKind === 'opening_balance' && transaction.fundAccount === 'cash',
    );
    const bankOpeningBalance = MOCK_TRANSACTIONS.find(
      (transaction) =>
        transaction.entryKind === 'opening_balance' && transaction.fundAccount === 'bank',
    );

    return {
      success: true,
      data: {
        cash: toExistingOpeningBalance(cashOpeningBalance),
        bank: toExistingOpeningBalance(bankOpeningBalance),
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

  const searchQuery = (query?.q ?? '').trim().toLowerCase();
  const categoryIdFilter = (query?.categoryId ?? '').trim();
  const typeFilter = (query?.type ?? '').trim().toLowerCase();
  const fundAccountFilter = (query?.fundAccount ?? '').trim().toLowerCase();
  const startDateFilter = parseStartDate(query?.startDate);
  const endDateFilter = parseEndDate(query?.endDate);

  const compareByLedgerOrderAsc = (
    left: TransactionStatementRow,
    right: TransactionStatementRow,
  ) => {
    const byDate = left.transactionDate.getTime() - right.transactionDate.getTime();
    if (byDate !== 0) {
      return byDate;
    }

    const byCreatedAt = left.createdAt.getTime() - right.createdAt.getTime();
    if (byCreatedAt !== 0) {
      return byCreatedAt;
    }

    return left.transactionCode - right.transactionCode;
  };

  const compareByDisplayOrderDesc = (
    left: TransactionStatementRow,
    right: TransactionStatementRow,
  ) => {
    return -compareByLedgerOrderAsc(left, right);
  };

  const sortedForDisplay = [...MOCK_TRANSACTIONS].sort(compareByDisplayOrderDesc);

  const searchedRows = sortedForDisplay.filter((transaction) => {
    if (searchQuery.length !== 0) {
      const matchesSearch =
        transaction.transactionCode.toString().includes(searchQuery) ||
        transaction.remarks.toLowerCase().includes(searchQuery);

      if (!matchesSearch) {
        return false;
      }
    }

    const matchesCategory =
      categoryIdFilter.length === 0 || transaction.categoryId === categoryIdFilter;
    const matchesType = typeFilter.length === 0 || transaction.type === typeFilter;
    const matchesFundAccount =
      fundAccountFilter.length === 0 || transaction.fundAccount === fundAccountFilter;

    const transactionTime = transaction.transactionDate.getTime();
    const matchesStartDate =
      startDateFilter === null || transactionTime >= startDateFilter.getTime();
    const matchesEndDate = endDateFilter === null || transactionTime <= endDateFilter.getTime();

    return (
      matchesCategory && matchesType && matchesFundAccount && matchesStartDate && matchesEndDate
    );
  });

  const visibleRows = searchedRows.filter(isRegularTransactionRow);

  // Balances are computed in true ledger order (oldest -> newest), tracked independently
  // per fund account. Every row gets both fund balances for detailed transaction view.
  const balanceMap = new Map<string, { cashBalance: string; bankBalance: string }>();
  let cashFundBalance = 0;
  let bankFundBalance = 0;

  [...MOCK_TRANSACTIONS].sort(compareByLedgerOrderAsc).forEach((transaction) => {
    let delta = Number(transaction.amount);
    if (transaction.entryKind === 'regular' && transaction.type === 'expense') {
      delta = -delta;
    }

    if (transaction.fundAccount === 'cash') {
      cashFundBalance += delta;
    } else {
      bankFundBalance += delta;
    }

    balanceMap.set(transaction.id, {
      cashBalance: cashFundBalance.toFixed(3),
      bankBalance: bankFundBalance.toFixed(3),
    });
  });

  const rowsWithBalance: RegularTransactionRow[] = [];
  for (const row of visibleRows) {
    const balances = balanceMap.get(row.id);

    if (balances === undefined) {
      console.error('Missing running balance for transaction row', {
        rowId: row.id,
        transactionCode: row.transactionCode,
      });

      return {
        success: false,
        error: 'Unable to compute running balance for transactions. Please try again.',
      };
    }

    rowsWithBalance.push({
      ...row,
      cashBalance: balances.cashBalance,
      bankBalance: balances.bankBalance,
    });
  }

  const start = (page - 1) * pageSize;
  const paginatedItems = rowsWithBalance.slice(start, start + pageSize);

  return {
    success: true,
    data: {
      items: paginatedItems,
      totalCount: visibleRows.length,
    },
  };
}

export async function deleteTransaction(id: string): Promise<ActionResult<null>> {
  try {
    const index = MOCK_TRANSACTIONS.findIndex((t) => t.id === id);
    if (index === -1) {
      return { success: false, error: 'Transaction not found.' };
    }
    MOCK_TRANSACTIONS.splice(index, 1);
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

const updateTransactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z
    .string()
    .refine((val) => !Number.isNaN(Number(val)) && Number(val) > 0, {
      message: 'Amount must be a positive number.',
    }),
  transactionDate: z.string().min(1, 'Date is required.'),
  categoryId: z.string().min(1, 'Category is required.'),
  paymentMode: z.enum(['cash', 'bank', 'online_transaction', 'cheque']),
  fundAccount: z.enum(['cash', 'bank']),
  payeeMerchant: z.string().optional().default(''),
  paidReceiptBy: z.string().optional().default(''),
  remarks: z.string().max(500).optional().default(''),
});

export async function updateTransaction(
  id: string,
  input: {
    type: string;
    amount: string;
    transactionDate: string;
    categoryId: string;
    paymentMode: string;
    fundAccount: string;
    payeeMerchant: string;
    paidReceiptBy: string;
    remarks: string;
  },
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

    const index = MOCK_TRANSACTIONS.findIndex((t) => t.id === id);
    if (index === -1) {
      return { success: false, error: 'Transaction not found.' };
    }

    const category = MOCK_TRANSACTION_CATEGORIES.find(
      (cat) => cat.id === validationResult.data.categoryId,
    );

    const existing = MOCK_TRANSACTIONS[index];
    if (existing) {
      existing.type = validationResult.data.type;
      existing.amount = Number(validationResult.data.amount).toFixed(3);
      existing.transactionDate = new Date(validationResult.data.transactionDate);
      existing.categoryId = validationResult.data.categoryId;
      existing.categoryName = category?.name ?? existing.categoryName;
      existing.paymentMode = validationResult.data.paymentMode;
      existing.fundAccount = validationResult.data.fundAccount;
      existing.payeeMerchant = validationResult.data.payeeMerchant;
      existing.paidReceiptBy = validationResult.data.paidReceiptBy;
      existing.remarks = validationResult.data.remarks ?? '';
      existing.updatedAt = new Date();
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
