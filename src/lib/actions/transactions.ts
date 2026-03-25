'use server';

import { MOCK_TRANSACTIONS } from '@/lib/mock-data/transactions';
import { transactionRemarksSchema } from '@/lib/validations/transactions';
import type { ActionResult } from '@/types/actions';
import type { TransactionsQuery } from '@/types/filters/transactions';
import type { PaginationResponse } from '@/types/pagination';
import type { TransactionStatementRow } from '@/types/transactions';

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

export async function fetchTransactions(
  page: number,
  pageSize: number,
  query?: TransactionsQuery,
): Promise<ActionResult<PaginationResponse<TransactionStatementRow>>> {
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
    return compareByLedgerOrderAsc(right, left);
  };

  const sortedForDisplay = [...MOCK_TRANSACTIONS].sort(compareByDisplayOrderDesc);

  const searchedRows = sortedForDisplay.filter((transaction) => {
    const remarksValidation = transactionRemarksSchema.safeParse(transaction.remarks);
    if (!remarksValidation.success) {
      return false;
    }

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

  // Running balance is always global and computed in true ledger order (oldest -> newest).
  const balanceMap = new Map<string, string>();
  let cumulativeBalance = 0;

  [...MOCK_TRANSACTIONS].sort(compareByLedgerOrderAsc).forEach((transaction) => {
    const delta =
      transaction.type === 'income' ? Number(transaction.amount) : -Number(transaction.amount);
    cumulativeBalance += delta;
    balanceMap.set(transaction.id, cumulativeBalance.toFixed(3));
  });

  const rowsWithBalance: TransactionStatementRow[] = [];
  for (const row of searchedRows) {
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
      totalCount: searchedRows.length,
    },
  };
}
