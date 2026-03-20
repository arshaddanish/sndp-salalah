'use client';

import { type OnChangeFn, type PaginationState } from '@tanstack/react-table';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useTransition } from 'react';

import { normalizePagination, type PaginationDefaults } from '@/lib/query-pagination';

export function useQueryPagination(defaults?: PaginationDefaults) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const pageParam = searchParams.get('page');
  const pageSizeParam = searchParams.get('pageSize');

  const { page, pageSize } = normalizePagination(
    {
      ...(pageParam ? { page: pageParam } : {}),
      ...(pageSizeParam ? { pageSize: pageSizeParam } : {}),
    },
    defaults,
  );

  const onPaginationChange: OnChangeFn<PaginationState> = useCallback(
    (updater) => {
      const nextPagination: PaginationState =
        typeof updater === 'function' ? updater({ pageIndex: page - 1, pageSize }) : updater;

      const params = new URLSearchParams(searchParams.toString());
      params.set('page', (nextPagination.pageIndex + 1).toString());
      params.set('pageSize', nextPagination.pageSize.toString());

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [page, pageSize, pathname, router, searchParams, startTransition],
  );

  return {
    page,
    pageSize,
    onPaginationChange,
    isPending,
  };
}
