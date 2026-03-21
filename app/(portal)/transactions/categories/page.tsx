import { CategoriesTable } from '@/components/features/transaction-categories/categories-table';
import { CreateCategoryButton } from '@/components/features/transaction-categories/create-category-button';
import { fetchTransactionCategories } from '@/lib/actions/transaction-categories';
import { calculatePaginationState } from '@/lib/pagination-utils';
import { normalizePagination } from '@/lib/query-pagination';
import type { ListTransactionCategoriesRequest } from '@/types/filters/transaction-categories';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Transaction Categories | SNDP Salalah',
  description: 'Manage transaction categories for income and expense records',
};

export default async function TransactionCategoriesPage({
  searchParams,
}: Readonly<{
  searchParams?: ListTransactionCategoriesRequest | Promise<ListTransactionCategoriesRequest>;
}>) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const { page, pageSize } = normalizePagination(resolvedSearchParams);

  const categoriesResult = await fetchTransactionCategories(page, pageSize);
  const paginatedRows = categoriesResult.success ? (categoriesResult.data?.items ?? []) : [];
  const totalCount = categoriesResult.success ? (categoriesResult.data?.totalCount ?? 0) : 0;

  const { totalRows, pageCount, pageIndex } = calculatePaginationState(page, pageSize, totalCount);
  const errorMessage = categoriesResult.success
    ? null
    : (categoriesResult.error ?? 'Unable to load transaction categories. Please try again.');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-text-primary text-2xl font-bold">Transaction Categories</h1>
        <CreateCategoryButton />
      </div>

      {errorMessage ? <p className="text-danger text-sm">{errorMessage}</p> : null}

      <CategoriesTable
        rows={paginatedRows}
        totalRows={totalRows}
        pageIndex={pageIndex}
        pageCount={pageCount}
        pageSize={pageSize}
      />
    </div>
  );
}
