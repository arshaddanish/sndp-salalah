'use server';

import { revalidatePath } from 'next/cache';

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
      balance: '0.000',
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
      balance: '0.000',
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
  const paymentModeFilter = (query?.paymentMode ?? '').trim().toLowerCase();
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
    const matchesPaymentMode =
      paymentModeFilter.length === 0 || transaction.paymentMode === paymentModeFilter;

    const transactionTime = transaction.transactionDate.getTime();
    const matchesStartDate =
      startDateFilter === null || transactionTime >= startDateFilter.getTime();
    const matchesEndDate = endDateFilter === null || transactionTime <= endDateFilter.getTime();

    return (
      matchesCategory && matchesType && matchesPaymentMode && matchesStartDate && matchesEndDate
    );
  });

  const visibleRows = searchedRows.filter(isRegularTransactionRow);

  // Running balance is always global and computed in true ledger order (oldest -> newest),
  // tracked independently per fund account (cash fund and bank fund).
  const balanceMap = new Map<string, string>();
  let cashFundBalance = 0;
  let bankFundBalance = 0;

  [...MOCK_TRANSACTIONS].sort(compareByLedgerOrderAsc).forEach((transaction) => {
    let delta = Number(transaction.amount);
    if (transaction.entryKind === 'regular' && transaction.type === 'expense') {
      delta = -delta;
    }

    if (transaction.fundAccount === 'cash') {
      cashFundBalance += delta;
      balanceMap.set(transaction.id, cashFundBalance.toFixed(3));
    } else {
      bankFundBalance += delta;
      balanceMap.set(transaction.id, bankFundBalance.toFixed(3));
    }
  });

  const rowsWithBalance: RegularTransactionRow[] = [];
  for (const row of visibleRows) {
    const balance = balanceMap.get(row.id);

    if (balance === undefined) {
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
      balance,
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
