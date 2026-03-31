'use client';

import {
  type ChangeEvent,
  type ComponentProps,
  type Dispatch,
  type SetStateAction,
  useState,
} from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FormFieldError, getFieldAriaProps } from '@/components/ui/form-field-error';
import { Input } from '@/components/ui/input';
import { createOpeningBalance } from '@/lib/actions/transactions';
import { createOpeningBalanceSchema } from '@/lib/validations/transactions';
import { mapZodIssues } from '@/lib/zod-issues';
import type { ExistingOpeningBalance, TransactionFundAccount } from '@/types/transactions';

interface SetOpeningBalanceDialogProps {
  isOpen: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
  existingCash: ExistingOpeningBalance | null;
  existingBank: ExistingOpeningBalance | null;
}

type FormSubmitEvent = Parameters<NonNullable<ComponentProps<'form'>['onSubmit']>>[0];

const todayDateString = new Date().toISOString().slice(0, 10);

function isTransactionFundAccount(value: string): value is TransactionFundAccount {
  return value === 'cash' || value === 'bank';
}

function getInitialFundAccount(
  existingCash: ExistingOpeningBalance | null,
  existingBank: ExistingOpeningBalance | null,
): TransactionFundAccount {
  if (existingCash) {
    return 'cash';
  }
  return existingBank ? 'bank' : 'cash';
}

function getExistingOpeningValues(
  fundAccount: TransactionFundAccount,
  existingCash: ExistingOpeningBalance | null,
  existingBank: ExistingOpeningBalance | null,
): ExistingOpeningBalance | null {
  if (fundAccount === 'cash') {
    return existingCash;
  }
  return existingBank;
}

function handlePendingAwareDialogOpenChange(
  nextOpen: boolean,
  isPending: boolean,
  onOpenChange: Dispatch<SetStateAction<boolean>>,
): void {
  if (isPending && !nextOpen) {
    return;
  }
  onOpenChange(nextOpen);
}

function getNextFundAccount(value: string): TransactionFundAccount | null {
  if (!isTransactionFundAccount(value)) {
    console.error('Invalid fund account selected in opening balance dialog', {
      value,
    });
    return null;
  }
  return value;
}

export function SetOpeningBalanceDialog({
  isOpen,
  onOpenChange,
  existingCash,
  existingBank,
}: Readonly<SetOpeningBalanceDialogProps>) {
  const initialFundAccount = getInitialFundAccount(existingCash, existingBank);

  const getDefaultValues = (fundAccount: TransactionFundAccount) => {
    const existingValues = getExistingOpeningValues(fundAccount, existingCash, existingBank);
    return {
      amount: existingValues?.amount ?? '',
      transactionDate: existingValues?.transactionDate ?? todayDateString,
      remarks: existingValues?.remarks ?? '',
    };
  };

  const [fundAccount, setFundAccount] = useState<TransactionFundAccount>(initialFundAccount);
  const [amount, setAmount] = useState(getDefaultValues(fundAccount).amount);
  const [transactionDate, setTransactionDate] = useState(
    getDefaultValues(fundAccount).transactionDate,
  );
  const [remarks, setRemarks] = useState(getDefaultValues(fundAccount).remarks);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const initialValues = getDefaultValues(fundAccount);
  const isDirty =
    amount !== initialValues.amount ||
    transactionDate !== initialValues.transactionDate ||
    remarks !== initialValues.remarks;

  const handleDialogOpenChange = (nextOpen: boolean) => {
    handlePendingAwareDialogOpenChange(nextOpen, isPending, onOpenChange);
  };

  const handleFundAccountChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextFundAccount = getNextFundAccount(event.currentTarget.value);
    if (nextFundAccount === null) {
      return;
    }

    const defaults = getDefaultValues(nextFundAccount);
    setFundAccount(nextFundAccount);
    setAmount(defaults.amount);
    setTransactionDate(defaults.transactionDate);
    setRemarks(defaults.remarks);
    setFieldErrors({});
    setErrorMessage(null);
  };

  const handleSubmit = (event: FormSubmitEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    const payload = {
      fundAccount,
      amount,
      transactionDate,
      remarks,
    };

    const validationResult = createOpeningBalanceSchema.safeParse(payload);
    if (!validationResult.success) {
      setFieldErrors(mapZodIssues(validationResult.error.issues));
      return;
    }

    setIsPending(true);
    void (async () => {
      try {
        const result = await createOpeningBalance(validationResult.data);
        if (!result.success) {
          setErrorMessage(result.error ?? 'Unable to set opening balance. Please try again.');
          return;
        }

        onOpenChange(false);
      } catch (err) {
        console.error('Error setting opening balance:', err);
        setErrorMessage('Unable to set opening balance. Please try again.');
      } finally {
        setIsPending(false);
      }
    })();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-h-[90vh] w-[calc(100%-1.5rem)] gap-3 overflow-x-hidden overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Set Opening Balance</DialogTitle>
        </DialogHeader>

        <form id="set-opening-balance-form" onSubmit={handleSubmit} className="min-w-0 space-y-3">
          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            <div className="min-w-0 space-y-1.5">
              <label className="text-text-secondary text-sm font-medium" htmlFor="ob-fund-account">
                Fund Account *
              </label>
              <select
                id="ob-fund-account"
                name="fundAccount"
                value={fundAccount}
                required
                {...getFieldAriaProps(fieldErrors, 'fundAccount', 'ob-fund-account-error')}
                onChange={handleFundAccountChange}
                disabled={isPending}
                className="border-border text-text-primary focus:border-accent focus:ring-accent/20 h-10 w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2"
              >
                <option value="cash">Cash</option>
                <option value="bank">Bank</option>
              </select>
              <FormFieldError
                fieldErrors={fieldErrors}
                fieldKey="fundAccount"
                errorId="ob-fund-account-error"
              />
            </div>

            <div className="min-w-0 space-y-1.5">
              <label className="text-text-secondary text-sm font-medium" htmlFor="ob-amount">
                Opening Amount *
              </label>
              <div className="border-border focus-within:border-accent focus-within:ring-accent/20 flex h-10 min-w-0 items-center overflow-hidden rounded-lg border bg-white transition-all focus-within:ring-2">
                <span className="bg-surface-hover text-text-secondary flex h-full shrink-0 items-center rounded-l-lg px-3 text-sm font-medium">
                  OMR
                </span>
                <input
                  id="ob-amount"
                  name="amount"
                  value={amount}
                  required
                  {...getFieldAriaProps(fieldErrors, 'amount', 'ob-amount-error')}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="0.000"
                  inputMode="decimal"
                  disabled={isPending}
                  className="text-text-primary placeholder:text-text-muted h-full min-w-0 flex-1 rounded-r-lg bg-white px-3 py-2 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <FormFieldError
                fieldErrors={fieldErrors}
                fieldKey="amount"
                errorId="ob-amount-error"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-text-secondary text-sm font-medium" htmlFor="ob-date">
              Effective Date *
            </label>
            <Input
              id="ob-date"
              name="transactionDate"
              type="date"
              value={transactionDate}
              required
              {...getFieldAriaProps(fieldErrors, 'transactionDate', 'ob-date-error')}
              onChange={(event) => setTransactionDate(event.target.value)}
              disabled={isPending}
            />
            <FormFieldError
              fieldErrors={fieldErrors}
              fieldKey="transactionDate"
              errorId="ob-date-error"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-text-secondary text-sm font-medium" htmlFor="ob-remarks">
              Remarks
            </label>
            <textarea
              id="ob-remarks"
              name="remarks"
              rows={2}
              value={remarks}
              {...getFieldAriaProps(fieldErrors, 'remarks', 'ob-remarks-error')}
              onChange={(event) => setRemarks(event.target.value)}
              disabled={isPending}
              className="border-border text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-accent/20 w-full resize-none rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Optional setup note"
            />
            <FormFieldError
              fieldErrors={fieldErrors}
              fieldKey="remarks"
              errorId="ob-remarks-error"
            />
          </div>

          {errorMessage ? (
            <p className="text-danger text-sm" role="alert" aria-live="polite">
              {errorMessage}
            </p>
          ) : null}
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleDialogOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" form="set-opening-balance-form" disabled={isPending || !isDirty}>
            {isPending ? 'Saving...' : 'Save Opening Balance'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
