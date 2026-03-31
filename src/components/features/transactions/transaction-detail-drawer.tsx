'use client';

import { format } from 'date-fns';
import type { Dispatch, SetStateAction } from 'react';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { RegularTransactionRow } from '@/types/transactions';

type TransactionDetailDrawerProps = {
  transaction: RegularTransactionRow | null;
  isOpen: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
};

const paymentModeLabel: Record<RegularTransactionRow['paymentMode'], string> = {
  cash: 'Cash',
  bank: 'Bank',
  online_transaction: 'Online Transaction',
  cheque: 'Cheque',
};

const fundAccountLabel: Record<RegularTransactionRow['fundAccount'], string> = {
  cash: 'Cash',
  bank: 'Bank',
};

function DetailField({ label, children }: Readonly<{ label: string; children: React.ReactNode }>) {
  return (
    <div className="space-y-1">
      <dt className="text-text-muted text-xs font-medium tracking-wider uppercase">{label}</dt>
      <dd className="text-text-primary text-sm">{children}</dd>
    </div>
  );
}

export function TransactionDetailDrawer({
  transaction,
  isOpen,
  onOpenChange,
}: Readonly<TransactionDetailDrawerProps>) {
  if (!transaction) {
    return null;
  }

  const isIncome = transaction.type === 'income';
  const amount = Number(transaction.amount).toFixed(3);
  const cashBalance = Number(transaction.cashBalance).toFixed(3);
  const bankBalance = Number(transaction.bankBalance).toFixed(3);
  const totalBalance = (Number(transaction.cashBalance) + Number(transaction.bankBalance)).toFixed(
    3,
  );
  const signedAmount = `${isIncome ? '+' : '-'} ${amount} OMR`;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Transaction #{transaction.transactionCode}</SheetTitle>
          <SheetDescription>
            <span
              className={
                isIncome
                  ? 'bg-success-bg text-success rounded px-2 py-0.5 text-xs font-medium uppercase'
                  : 'bg-danger-bg text-danger rounded px-2 py-0.5 text-xs font-medium uppercase'
              }
            >
              {transaction.type}
            </span>
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-5">
            <DetailField label="Date">
              {format(transaction.transactionDate, 'dd MMM yyyy')}
            </DetailField>

            <DetailField label="Category">{transaction.categoryName}</DetailField>

            <DetailField label="Payment Method">
              {paymentModeLabel[transaction.paymentMode]}
            </DetailField>

            <DetailField label="Fund">{fundAccountLabel[transaction.fundAccount]}</DetailField>

            <DetailField label="Amount">
              <span
                className={`font-semibold tabular-nums ${isIncome ? 'text-success' : 'text-danger'}`}
              >
                {signedAmount}
              </span>
            </DetailField>

            <DetailField label="Payee / Merchant">
              {transaction.payeeMerchant || '\u2014'}
            </DetailField>

            <DetailField label="Paid / Receipt By">
              {transaction.paidReceiptBy || '\u2014'}
            </DetailField>

            <DetailField label="Cash Balance">
              <span
                className={`font-semibold tabular-nums ${
                  transaction.fundAccount === 'cash' ? 'text-warning' : ''
                }`}
              >
                {cashBalance} OMR
              </span>
            </DetailField>

            <DetailField label="Bank Balance">
              <span
                className={`font-semibold tabular-nums ${
                  transaction.fundAccount === 'bank' ? 'text-accent' : ''
                }`}
              >
                {bankBalance} OMR
              </span>
            </DetailField>

            <DetailField label="Total Balance">
              <span className="font-semibold tabular-nums">{totalBalance} OMR</span>
            </DetailField>

            {transaction.attachmentKey ? (
              <div className="col-span-2">
                <DetailField label="Attachment">
                  <span className="text-accent text-sm break-all">{transaction.attachmentKey}</span>
                </DetailField>
              </div>
            ) : null}

            <div className="col-span-2">
              <DetailField label="Remarks">
                <p className="leading-relaxed break-words whitespace-pre-wrap">
                  {transaction.remarks || '\u2014'}
                </p>
              </DetailField>
            </div>

            <DetailField label="Created">
              {format(transaction.createdAt, 'dd MMM yyyy, HH:mm')}
            </DetailField>

            <DetailField label="Updated">
              {format(transaction.updatedAt, 'dd MMM yyyy, HH:mm')}
            </DetailField>
          </dl>
        </div>
      </SheetContent>
    </Sheet>
  );
}
