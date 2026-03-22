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

  const sorted = [...MOCK_TRANSACTIONS].sort(
    (left, right) => right.transactionDate.getTime() - left.transactionDate.getTime(),
  );

  const searchedRows = sorted.filter((transaction) => {
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

  const start = (page - 1) * pageSize;
  const paginatedItems = searchedRows.slice(start, start + pageSize);

  return {
    success: true,
    data: {
      items: paginatedItems,
      totalCount: searchedRows.length,
    },
  };
}
