import { Tags } from 'lucide-react';
import Link from 'next/link';

import { CreateTransactionButton } from '@/components/features/transactions/create-transaction-button';
import { SetOpeningBalanceButton } from '@/components/features/transactions/set-opening-balance-button';
import { TransactionsTable } from '@/components/features/transactions/transactions-table';
import { fetchTransactionCategoryOptions } from '@/lib/actions/transaction-categories';
import { fetchOpeningBalances, fetchTransactions } from '@/lib/actions/transactions';
import { calculatePaginationState } from '@/lib/pagination-utils';
import { normalizePagination } from '@/lib/query-pagination';
import type { ListTransactionsRequest, TransactionsQuery } from '@/types/filters/transactions';
import type { TransactionFundAccount, TransactionType } from '@/types/transactions';

type TransactionsFilterState = {
  searchQuery: string;
  categoryId: string;
  type: string;
  fundAccount: string;
  startDate: string;
  endDate: string;
};

export const metadata = {
  title: 'Transactions | SNDP Salalah',
  description: 'View paginated transaction statements for income and expense records',
};

export const dynamic = 'force-dynamic';

function isTransactionType(value: string): value is TransactionType {
  return value === 'income' || value === 'expense';
}

function isTransactionFundAccount(value: string): value is TransactionFundAccount {
  return value === 'cash' || value === 'bank';
}

function getTransactionsFilterState(queryParams: ListTransactionsRequest): TransactionsFilterState {
  return {
    searchQuery: (queryParams.q ?? '').trim(),
    categoryId: (queryParams.categoryId ?? '').trim(),
    type: (queryParams.type ?? '').trim().toLowerCase(),
    fundAccount: (queryParams.fundAccount ?? '').trim().toLowerCase(),
    startDate: (queryParams.startDate ?? '').trim(),
    endDate: (queryParams.endDate ?? '').trim(),
  };
}

function buildTransactionsQuery(filters: TransactionsFilterState): TransactionsQuery {
  const query: TransactionsQuery = {
    q: filters.searchQuery,
  };

  if (filters.categoryId.length > 0 && filters.categoryId !== 'all') {
    query.categoryId = filters.categoryId;
  }
  if (isTransactionType(filters.type)) {
    query.type = filters.type;
  }
  if (isTransactionFundAccount(filters.fundAccount)) {
    query.fundAccount = filters.fundAccount;
  }
  if (filters.startDate.length > 0) {
    query.startDate = filters.startDate;
  }
  if (filters.endDate.length > 0) {
    query.endDate = filters.endDate;
  }

  return query;
}

export default async function TransactionsPage({
  searchParams,
}: Readonly<{
  searchParams?: Promise<ListTransactionsRequest>;
}>) {
  const queryParams = (await searchParams) ?? {};
  const { page, pageSize } = normalizePagination(queryParams);
  const filters = getTransactionsFilterState(queryParams);
  const transactionQuery = buildTransactionsQuery(filters);

  const [transactionsResult, openingBalancesResult, transactionCategoryOptionsResult] =
    await Promise.all([
      fetchTransactions(page, pageSize, transactionQuery),
      fetchOpeningBalances(),
      fetchTransactionCategoryOptions(),
    ]);
  const paginatedRows = transactionsResult.success ? (transactionsResult.data?.items ?? []) : [];
  const totalCount = transactionsResult.success ? (transactionsResult.data?.totalCount ?? 0) : 0;
  const categories = transactionCategoryOptionsResult.success
    ? (transactionCategoryOptionsResult.data ?? [])
    : [];
  const categoryOptions = [
    { label: 'All', value: 'all' },
    ...categories.map((category) => ({
      label: category.name,
      value: category.id,
    })),
  ];
  const existingCashOpeningBalance = openingBalancesResult.success
    ? (openingBalancesResult.data?.cash ?? null)
    : null;
  const existingBankOpeningBalance = openingBalancesResult.success
    ? (openingBalancesResult.data?.bank ?? null)
    : null;

  if (!transactionsResult.success && transactionsResult.error) {
    console.error('Failed to fetch transactions for transactions page', {
      error: transactionsResult.error,
      page,
      pageSize,
      query: transactionQuery,
    });
  }

  if (!transactionCategoryOptionsResult.success && transactionCategoryOptionsResult.error) {
    console.error('Failed to fetch transaction category options for transactions page', {
      error: transactionCategoryOptionsResult.error,
    });
  }

  const { totalRows, pageCount, pageIndex } = calculatePaginationState(page, pageSize, totalCount);
  const errorMessage = transactionsResult.success
    ? null
    : (transactionsResult.error ?? 'Unable to load transactions. Please try again.');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-text-primary text-2xl font-bold">Transactions</h1>
        </div>

        <div className="grid w-full gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-start lg:w-auto lg:justify-end">
          <div className="order-3 lg:order-1">
            <Link
              href="/transactions/categories"
              className="text-text-secondary border-border hover:bg-surface-hover hover:text-text-primary inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border bg-white px-3 text-sm font-medium whitespace-nowrap transition-colors sm:w-auto"
            >
              <Tags className="h-4 w-4" />
              Categories
            </Link>
          </div>
          <div className="order-2">
            <SetOpeningBalanceButton
              existingCash={existingCashOpeningBalance}
              existingBank={existingBankOpeningBalance}
            />
          </div>
          <div className="order-1 lg:order-3">
            <CreateTransactionButton categories={categories} />
          </div>
        </div>
      </div>

      {errorMessage ? <p className="text-danger text-sm">{errorMessage}</p> : null}

      <TransactionsTable
        rows={paginatedRows}
        totalRows={totalRows}
        searchQuery={filters.searchQuery}
        categoryFilter={filters.categoryId || 'all'}
        typeFilter={isTransactionType(filters.type) ? filters.type : 'all'}
        fundAccountFilter={
          isTransactionFundAccount(filters.fundAccount) ? filters.fundAccount : 'all'
        }
        startDate={filters.startDate}
        endDate={filters.endDate}
        categoryOptions={categoryOptions}
        pageIndex={pageIndex}
        pageCount={pageCount}
        pageSize={pageSize}
      />
    </div>
  );
}
