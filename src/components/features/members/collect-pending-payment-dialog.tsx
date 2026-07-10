'use client';

import type { ComponentProps } from 'react';
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
import { Input } from '@/components/ui/input';
import { markMembershipPaymentPaid } from '@/lib/actions/members';
import { markMembershipPaymentPaidSchema } from '@/lib/validations/members';

type CollectPendingPaymentDialogProps = {
  transactionId: string;
  amount: string;
  open: boolean;
  onOpenChange: ComponentProps<typeof Dialog>['onOpenChange'];
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

export function CollectPendingPaymentDialog({
  transactionId,
  amount,
  open,
  onOpenChange,
}: Readonly<CollectPendingPaymentDialogProps>) {
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

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);
    const payload = {
      transactionId,
      paymentMode: getFormValue(formData, 'paymentMode'),
      fundAccount: getFormValue(formData, 'fundAccount'),
    };

    const cvr = markMembershipPaymentPaidSchema.safeParse(payload);
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
        const result = await markMembershipPaymentPaid(cvr.data);
        if (!result.success) {
          setErrorMessage(result.error ?? 'Unable to record payment.');
          return;
        }
        handleOpenChange(false);
      } catch (error) {
        console.error('Error collecting pending payment:', error);
        setErrorMessage('An unexpected error occurred. Please try again.');
      }
    });
  };

  const numericAmount = Number.parseFloat(amount);
  const formattedAmount = Number.isNaN(numericAmount) ? amount : numericAmount.toFixed(3);

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
          <DialogTitle>Collect Pending Payment</DialogTitle>
          <DialogDescription>
            Collect the outstanding membership fee payment of {formattedAmount} OMR.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-text-secondary text-sm font-medium" htmlFor="collect-amount">
              Amount (OMR)
            </label>
            <Input
              id="collect-amount"
              type="text"
              value={`${formattedAmount} OMR`}
              disabled
              className="bg-muted/50 cursor-not-allowed"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                className="text-text-secondary text-sm font-medium"
                htmlFor="collect-paymentMode"
              >
                Payment Mode *
              </label>
              <select
                id="collect-paymentMode"
                name="paymentMode"
                required
                disabled={isPending}
                value={selectedPaymentMode}
                onChange={(e) => setSelectedPaymentMode(e.target.value)}
                className="border-border bg-surface text-text-primary focus:border-accent focus:ring-accent-border h-10 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
              >
                <option value="" disabled>
                  Select mode
                </option>
                {PAYMENT_MODE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {fieldErrors['paymentMode'] && (
                <p className="text-danger text-xs">{fieldErrors['paymentMode']}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                className="text-text-secondary text-sm font-medium"
                htmlFor="collect-fundAccount"
              >
                Fund Account *
              </label>
              <select
                id="collect-fundAccount"
                name="fundAccount"
                required
                disabled={isPending}
                value={selectedFundAccount}
                onChange={(e) => setSelectedFundAccount(e.target.value)}
                className="border-border bg-surface text-text-primary focus:border-accent focus:ring-accent-border h-10 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
              >
                <option value="" disabled>
                  Select fund
                </option>
                {FUND_ACCOUNT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {fieldErrors['fundAccount'] && (
                <p className="text-danger text-xs">{fieldErrors['fundAccount']}</p>
              )}
            </div>
          </div>

          {errorMessage && <p className="text-danger text-sm">{errorMessage}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !isFormFilled}>
              {isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
