'use client';

import { type ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table';

import { Card } from '@/components/ui/card';
import { DataTableBase } from '@/components/ui/data-table-base';
import type { MemberTransaction } from '@/types/members';

const PAYMENT_MODE_LABELS: Record<string, string> = {
  cash: 'Cash',
  bank: 'Bank',
  online_transaction: 'Online',
  cheque: 'Cheque',
};

const FUND_LABELS: Record<string, string> = {
  cash: 'Cash',
  bank: 'Bank',
};

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

const memberPaymentHistoryColumns: ColumnDef<MemberTransaction>[] = [
  {
    accessorKey: 'transactionCode',
    header: 'Transaction ID',
    cell: ({ row }) => (
      <span className="text-text-primary font-medium">{row.original.transactionCode}</span>
    ),
    size: 80,
  },
  {
    accessorKey: 'transactionDate',
    header: 'Date',
    cell: ({ row }) => (
      <span className="text-text-primary font-medium">
        {formatDate(row.original.transactionDate)}
      </span>
    ),
  },
  {
    accessorKey: 'amount',
    header: 'Amount (OMR)',
    cell: ({ row }) => {
      const numericAmount = Number.parseFloat(row.original.amount);
      return <span className="text-success font-medium">+{numericAmount.toFixed(3)}</span>;
    },
  },
  {
    accessorKey: 'paymentMode',
    header: 'Payment Method',
    cell: ({ row }) => (
      <span className="text-text-primary font-medium">
        {PAYMENT_MODE_LABELS[row.original.paymentMode] ?? row.original.paymentMode}
      </span>
    ),
  },
  {
    accessorKey: 'fundAccount',
    header: 'Fund Account',
    cell: ({ row }) => (
      <span className="text-text-primary font-medium">
        {FUND_LABELS[row.original.fundAccount] ?? row.original.fundAccount}
      </span>
    ),
  },
  {
    accessorKey: 'remarks',
    header: 'Remarks',
    cell: ({ row }) => {
      const remarks = row.original.remarks;
      const hasRemarks = Boolean(remarks && remarks.trim().length > 0);
      return (
        <span
          className={`${hasRemarks ? 'text-text-primary font-medium' : 'text-text-muted'} max-w-[200px] truncate`}
          title={remarks}
        >
          {hasRemarks ? remarks : '—'}
        </span>
      );
    },
  },
];

type MemberPaymentHistoryProps = {
  transactions: MemberTransaction[];
  errorMessage: string | null;
};

export function MemberPaymentHistory({
  transactions,
  errorMessage,
}: Readonly<MemberPaymentHistoryProps>) {
  const table = useReactTable({
    columns: memberPaymentHistoryColumns,
    data: transactions,
    getCoreRowModel: getCoreRowModel(),
  });

  const skeletonRowCount = Math.max(1, Math.min(transactions.length || 10, 50));

  let content: React.ReactNode;

  if (errorMessage) {
    content = (
      <div className="border-danger/20 bg-danger-bg rounded-lg border px-4 py-3">
        <p className="text-danger text-sm font-medium">Payment history could not be loaded.</p>
        <p className="text-danger/80 mt-1 text-sm">{errorMessage}</p>
      </div>
    );
  } else if (transactions.length === 0) {
    content = <p className="text-text-muted text-sm">No payments recorded.</p>;
  } else {
    content = (
      <DataTableBase
        table={table}
        columns={memberPaymentHistoryColumns}
        skeletonRowCount={skeletonRowCount}
      />
    );
  }

  return (
    <Card>
      <div className="mb-4">
        <h2 className="text-text-primary text-lg font-semibold">Payment History</h2>
      </div>
      {content}
    </Card>
  );
}
