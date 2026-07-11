'use client';

import type { ComponentProps } from 'react';
import type { MemberTransaction } from '@/types/members';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { markTransactionAsPaid } from '@/lib/actions/transactions';
import { markTransactionAsPaidSchema } from '@/lib/validations/transactions';
import type { RegularTransactionRow } from '@/types/transactions';

type MarkAsPaydDialogProps = {
  transaction: RegularTransactionRow | MemberTransaction | null;
  open: boolean;
  onOpenChange: ComponentProps<typeof Dialog>['onOpenChange'];
  onSuccess?: () => void;
};

const PAYMENT_MODE_OPTIONS = [
  { label: 'Cash', value: 'cash' },
  { label: 'Bank', value: 'bank' },
  { label: 'Online Transaction', value: 'online_transaction' },
  { label: 'Cheque', value: 'cheque' },
  { label: 'Card', value: 'card' },
] as const;

const FUND_ACCOUNT_OPTIONS = [
  { label: 'Cash', value: 'cash' },
  { label: 'Bank', value: 'bank' },
] as const;

function getFormValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

function getAutoSuggestedFundAccount(paymentMode: string): string {
  if (paymentMode === 'cash') return 'cash';
  return 'bank'; // bank, online_transaction, cheque, card
}

export function MarkAsPaidDialog({
  transaction,
  open,
  onOpenChange,
  onSuccess,
}: Readonly<MarkAsPaydDialogProps>) {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<string>('');
  const [selectedFundAccount, setSelectedFundAccount] = useState<string>('');

  const isFormFilled = selectedPaymentMode !== '' && selectedFundAccount !== '';

  const handleOpenChange = (next: boolean) => {
    if (isPending) return;
    if (!next) {
      setErrorMessage(null);
      setFieldErrors({});
      setSelectedPaymentMode('');
      setSelectedFundAccount('');
    }
    onOpenChange?.(next);
  };

  const handlePaymentModeChange = (mode: string) => {
    setSelectedPaymentMode(mode);
    setErrorMessage(null);
    // Auto-suggest fund account
    const suggestedAccount = getAutoSuggestedFundAccount(mode);
    setSelectedFundAccount(suggestedAccount);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    if (!transaction) return;

    const formData = new FormData(event.currentTarget);
    const payload = {
      transactionId: transaction.id,
      paymentMode: getFormValue(formData, 'paymentMode'),
      fundAccount: getFormValue(formData, 'fundAccount'),
    };

    const cvr = markTransactionAsPaidSchema.safeParse(payload);
    if (!cvr.success) {
      // Map field errors
      const errors: Record<string, string> = {};
      cvr.error.issues.forEach((issue) => {
        const path = issue.path[0];
        if (typeof path === 'string') {
          errors[path] = issue.message;
        }
      });
      setFieldErrors(errors);
      return;
    }

    startTransition(async () => {
      try {
        const result = await markTransactionAsPaid(cvr.data);
        if (!result.success) {
          setErrorMessage(result.error ?? 'Unable to mark transaction as paid.');
          return;
        }
        onSuccess?.();
        handleOpenChange(false);
      } catch (error) {
        console.error('Error marking transaction as paid:', error);
        setErrorMessage('An unexpected error occurred. Please try again.');
      }
    });
  };

  if (!transaction) return null;

  const numericAmount = Number.parseFloat(transaction.amount);
  const formattedAmount = Number.isNaN(numericAmount)
    ? transaction.amount
    : numericAmount.toFixed(3);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => {
          if (isPending) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (isPending) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Mark as Paid</DialogTitle>
          <DialogDescription>
            Record payment for transaction #{transaction.transactionCode} ({formattedAmount} OMR).
          </DialogDescription>
        </DialogHeader>

        <form id="mark-as-paid-form" onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-text-secondary text-sm font-medium" htmlFor="mark-pay-method">
              Payment Method *
            </label>
            <select
              id="mark-pay-method"
              name="paymentMode"
              value={selectedPaymentMode}
              required
              onChange={(e) => handlePaymentModeChange(e.target.value)}
              disabled={isPending}
              className="border-border text-text-primary focus:border-accent focus:ring-accent/20 h-10 w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2"
              aria-invalid={!!fieldErrors['paymentMode']}
              aria-describedby={fieldErrors['paymentMode'] ? 'mark-pay-method-error' : undefined}
            >
              <option value="">Select payment method</option>
              {PAYMENT_MODE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {fieldErrors['paymentMode'] ? (
              <p id="mark-pay-method-error" className="text-danger text-xs">
                {fieldErrors['paymentMode']}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label className="text-text-secondary text-sm font-medium" htmlFor="mark-fund-account">
              Fund Account *
            </label>
            <select
              id="mark-fund-account"
              name="fundAccount"
              value={selectedFundAccount}
              required
              onChange={(e) => setSelectedFundAccount(e.target.value)}
              disabled={isPending}
              className="border-border text-text-primary focus:border-accent focus:ring-accent/20 h-10 w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2"
              aria-invalid={!!fieldErrors['fundAccount']}
              aria-describedby={fieldErrors['fundAccount'] ? 'mark-fund-account-error' : undefined}
            >
              <option value="">Select account</option>
              {FUND_ACCOUNT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {fieldErrors['fundAccount'] ? (
              <p id="mark-fund-account-error" className="text-danger text-xs">
                {fieldErrors['fundAccount']}
              </p>
            ) : null}
          </div>

          {errorMessage ? (
            <p className="text-danger text-sm" role="alert">
              {errorMessage}
            </p>
          ) : null}
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" form="mark-as-paid-form" disabled={isPending || !isFormFilled}>
            {isPending ? 'Saving...' : 'Mark as Paid'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
