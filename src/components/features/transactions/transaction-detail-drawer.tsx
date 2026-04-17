'use client';

import { format } from 'date-fns';
import { Edit2, ExternalLink, FileText, Loader2, Trash2 } from 'lucide-react';
import { type Dispatch, type SetStateAction, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { getTransactionAttachmentDownload } from '@/lib/actions/transactions';
import type { RegularTransactionRow } from '@/types/transactions';

import { DeleteTransactionDialog } from './delete-transaction-dialog';
import { EditTransactionDialog } from './edit-transaction-dialog';

type TransactionDetailDrawerProps = {
  transaction: RegularTransactionRow | null;
  isOpen: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
  categoryOptions: Array<{ label: string; value: string }>;
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
  categoryOptions,
}: Readonly<TransactionDetailDrawerProps>) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

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
  const fileName = transaction.attachmentKey
    ? transaction.attachmentKey.split('-').pop() || 'Attachment'
    : 'Attachment';

  const handleDownload = async () => {
    if (isDownloading) return;
    setDownloadError(null);
    setIsDownloading(true);

    try {
      const result = await getTransactionAttachmentDownload(transaction.id);
      if (result.success && result.data?.downloadUrl) {
        window.open(result.data.downloadUrl, '_blank');
      } else {
        setDownloadError(result.error ?? 'Unable to open attachment.');
      }
    } catch (error) {
      console.error('Error opening attachment:', error);
      setDownloadError('An unexpected error occurred. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!isDeleteOpen && !isEditOpen) onOpenChange(open);
      }}
    >
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
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={handleDownload}
                      disabled={isDownloading}
                      className="text-accent hover:text-accent-hover flex w-fit items-center gap-2 rounded-md py-1 text-sm font-medium transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isDownloading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                      <span className="max-w-[200px] truncate">View: {fileName}</span>
                      <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 opacity-70" />
                    </button>
                    {downloadError && <p className="text-danger text-xs">{downloadError}</p>}
                  </div>
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

        <div className="flex justify-end gap-2 px-6 py-4">
          <Button
            variant="danger"
            size="sm"
            // EXACT FIX: Added || isEditOpen to disabled condition
            disabled={isDeleteOpen || isEditOpen}
            onClick={() => setIsDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>

          <Button
            variant="primary"
            size="sm"
            // For symmetry, disabling edit while delete is open (already in your code, but kept here for clarity)
            disabled={isDeleteOpen || isEditOpen}
            onClick={() => setIsEditOpen(true)}
          >
            <Edit2 className="h-4 w-4" />
            Edit
          </Button>
        </div>

        {isEditOpen && (
          <EditTransactionDialog
            isOpen={isEditOpen}
            onOpenChange={setIsEditOpen}
            transaction={transaction}
            categoryOptions={categoryOptions}
            onSuccess={() => {
              setIsEditOpen(false);
              onOpenChange(false);
            }}
          />
        )}

        {isDeleteOpen && (
          <DeleteTransactionDialog
            isOpen={isDeleteOpen}
            onOpenChange={setIsDeleteOpen}
            transaction={transaction}
            onSuccess={() => {
              setIsDeleteOpen(false);
              onOpenChange(false);
            }}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
