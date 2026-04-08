'use client';

import type { ComponentProps } from 'react';
import { useMemo, useState, useTransition } from 'react';

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
import { renewMembership } from '@/lib/actions/members';
import { renewMembershipSchema } from '@/lib/validations/members';

type RenewMembershipDialogProps = {
  memberId: string;
  currentExpiry: string | null;
  mode: 'register' | 'renew';
  open: boolean;
  onOpenChange: ComponentProps<typeof Dialog>['onOpenChange'];
};

const PAYMENT_MODE_OPTIONS = [
  { label: 'Cash', value: 'cash' },
  { label: 'Bank', value: 'bank' },
  { label: 'Online Transaction', value: 'online_transaction' },
  { label: 'Cheque', value: 'cheque' },
] as const;

const FUND_ACCOUNT_OPTIONS = [
  { label: 'Cash', value: 'cash' },
  { label: 'Bank', value: 'bank' },
] as const;

function getDefaultExpiry(currentExpiry: string | null): string {
  const parsedBase = currentExpiry ? new Date(currentExpiry) : new Date();
  const base = Number.isNaN(parsedBase.getTime()) ? new Date() : parsedBase;
  // If base is in the past, start from today
  if (base < new Date()) {
    const today = new Date();
    today.setFullYear(today.getFullYear() + 1);
    return today.toISOString().slice(0, 10);
  }
  base.setFullYear(base.getFullYear() + 1);
  return base.toISOString().slice(0, 10);
}

function getFormValue(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === 'string' ? value : '';
}

export function RenewMembershipDialog({
  memberId,
  currentExpiry,
  mode,
  open,
  onOpenChange,
}: Readonly<RenewMembershipDialogProps>) {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);

  const defaultExpiry = useMemo(() => getDefaultExpiry(currentExpiry), [currentExpiry]);
  const dialogTitle = mode === 'register' ? 'Register Membership' : 'Renew Membership';
  const dialogDescription =
    mode === 'register'
      ? 'Record the first membership fee payment and set the expiry date.'
      : 'Record a membership fee payment and set the new expiry date.';
  const submitErrorMessage =
    mode === 'register' ? 'Unable to register membership.' : 'Unable to process renewal.';

  const handleOpenChange = (next: boolean) => {
    if (isPending) return;
    if (!next) {
      setIsDirty(false);
      setErrorMessage(null);
      setFieldErrors({});
    }
    onOpenChange?.(next);
  };

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
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            setErrorMessage(null);
            setFieldErrors({});

            const formData = new FormData(event.currentTarget);
            const raw = {
              memberId,
              amount: Number.parseFloat(getFormValue(formData, 'amount') || '0'),
              paymentMode: getFormValue(formData, 'paymentMode'),
              fundAccount: getFormValue(formData, 'fundAccount'),
              newExpiry: getFormValue(formData, 'newExpiry'),
              remarks: getFormValue(formData, 'remarks'),
            };

            const validationResult = renewMembershipSchema.safeParse(raw);
            if (!validationResult.success) {
              const errors: Record<string, string> = {};
              for (const issue of validationResult.error.issues) {
                const key = issue.path.join('.');
                if (key && !errors[key]) errors[key] = issue.message;
              }
              setFieldErrors(errors);
              return;
            }

            startTransition(async () => {
              const result = await renewMembership(validationResult.data);
              if (!result.success) {
                setErrorMessage(result.error ?? submitErrorMessage);
                return;
              }
              setIsDirty(false);
              onOpenChange?.(false);
            });
          }}
          onChange={() => {
            if (!isDirty) {
              setIsDirty(true);
            }
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <label className="text-text-secondary text-sm font-medium" htmlFor="renew-amount">
              Amount (OMR) *
            </label>
            <Input
              id="renew-amount"
              name="amount"
              type="number"
              step="0.001"
              min="0.001"
              required
              disabled={isPending}
              placeholder="0.000"
            />
            {fieldErrors['amount'] ? (
              <p className="text-danger text-xs">{fieldErrors['amount']}</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                className="text-text-secondary text-sm font-medium"
                htmlFor="renew-paymentMode"
              >
                Payment Mode *
              </label>
              <select
                id="renew-paymentMode"
                name="paymentMode"
                required
                disabled={isPending}
                className="border-border bg-surface text-text-primary focus:border-accent focus:ring-accent-border h-10 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                defaultValue=""
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
              {fieldErrors['paymentMode'] ? (
                <p className="text-danger text-xs">{fieldErrors['paymentMode']}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <label
                className="text-text-secondary text-sm font-medium"
                htmlFor="renew-fundAccount"
              >
                Fund Account *
              </label>
              <select
                id="renew-fundAccount"
                name="fundAccount"
                required
                disabled={isPending}
                className="border-border bg-surface text-text-primary focus:border-accent focus:ring-accent-border h-10 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                defaultValue=""
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
              {fieldErrors['fundAccount'] ? (
                <p className="text-danger text-xs">{fieldErrors['fundAccount']}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-text-secondary text-sm font-medium" htmlFor="renew-newExpiry">
              New Expiry Date *
            </label>
            <Input
              id="renew-newExpiry"
              name="newExpiry"
              type="date"
              defaultValue={defaultExpiry}
              required
              disabled={isPending}
            />
            {fieldErrors['newExpiry'] ? (
              <p className="text-danger text-xs">{fieldErrors['newExpiry']}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label className="text-text-secondary text-sm font-medium" htmlFor="renew-remarks">
              Remarks
            </label>
            <textarea
              id="renew-remarks"
              name="remarks"
              rows={2}
              maxLength={500}
              disabled={isPending}
              className="border-border bg-surface text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-accent-border w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {errorMessage ? <p className="text-danger text-sm">{errorMessage}</p> : null}

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !isDirty}>
              {isPending ? 'Saving...' : 'Save Payment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
