import Link from 'next/link';

import { TransactionsTable } from '@/components/features/transactions/transactions-table';
import { fetchTransactions } from '@/lib/actions/transactions';
import { calculatePaginationState } from '@/lib/pagination-utils';
import { normalizePagination } from '@/lib/query-pagination';
import type { ListTransactionsRequest, TransactionsQuery } from '@/types/filters/transactions';

export const metadata = {
  title: 'Transactions | SNDP Salalah',
  description: 'View paginated transaction statements for income and expense records',
};

export const dynamic = 'force-dynamic';

export default async function TransactionsPage({
  searchParams,
}: Readonly<{
  searchParams?: ListTransactionsRequest | Promise<ListTransactionsRequest>;
}>) {
  const queryParams = (await searchParams) ?? {};
  const { page, pageSize } = normalizePagination(queryParams);
  const searchQuery = (queryParams.q ?? '').trim();
  // TODO: Filter params deferred to next PR - do not review these commented lines
  // const categoryId = (queryParams.categoryId ?? '').trim();
  // const type = (queryParams.type ?? '').trim().toLowerCase();
  // const paymentMode = (queryParams.paymentMode ?? '').trim().toLowerCase();
  // const startDate = (queryParams.startDate ?? '').trim();
  // const endDate = (queryParams.endDate ?? '').trim();

  // TODO: Category options extraction deferred to next PR - do not review this commented block
  // const categoryOptions = [
  //   { label: 'All', value: 'all' },
  //   ...Array.from(
  //     new Map(
  //       MOCK_TRANSACTIONS.map((transaction) => [
  //         transaction.categoryId,
  //         { label: transaction.categoryName, value: transaction.categoryId },
  //       ]),
  //     ).values(),
  //   ).sort((left, right) => left.label.localeCompare(right.label)),
  // ];

  const transactionQuery: TransactionsQuery = {
    q: searchQuery,
  };

  // TODO: Filter application logic deferred to next PR - do not review these commented lines
  // if (categoryId.length > 0 && categoryId !== 'all') {
  //   transactionQuery.categoryId = categoryId;
  // }
  // if (type === 'income' || type === 'expense') {
  //   transactionQuery.type = type;
  // }
  // if (paymentMode === 'cash' || paymentMode === 'bank') {
  //   transactionQuery.paymentMode = paymentMode;
  // }
  // if (startDate.length > 0) {
  //   transactionQuery.startDate = startDate;
  // }
  // if (endDate.length > 0) {
  //   transactionQuery.endDate = endDate;
  // }

  const transactionsResult = await fetchTransactions(page, pageSize, transactionQuery);
  const paginatedRows = transactionsResult.success ? (transactionsResult.data?.items ?? []) : [];
  const totalCount = transactionsResult.success ? (transactionsResult.data?.totalCount ?? 0) : 0;

  if (!transactionsResult.success && transactionsResult.error) {
    console.error('Failed to fetch transactions for transactions page', {
      error: transactionsResult.error,
      page,
      pageSize,
      query: transactionQuery,
    });
  }

  const { totalRows, pageCount, pageIndex } = calculatePaginationState(page, pageSize, totalCount);
  const errorMessage = transactionsResult.success
    ? null
    : (transactionsResult.error ?? 'Unable to load transactions. Please try again.');

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-text-primary text-2xl font-bold">Transactions</h1>
        </div>

        <Link
          href="/transactions/categories"
          className="text-text-primary border-border hover:bg-surface-hover inline-flex h-9 items-center rounded-md border bg-white px-3 text-sm font-medium transition-colors"
        >
          Categories
        </Link>
      </div>

      {errorMessage ? <p className="text-danger text-sm">{errorMessage}</p> : null}

      <TransactionsTable
        rows={paginatedRows}
        totalRows={totalRows}
        searchQuery={searchQuery}
        pageIndex={pageIndex}
        pageCount={pageCount}
        pageSize={pageSize}
      />
    </div>
  );
}
