'use client';

import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { updateTransaction } from '@/lib/actions/transactions';
import type { RegularTransactionRow } from '@/types/transactions';

interface EditTransactionDialogProps {
  isOpen: boolean;
  onOpenChange: (value: boolean) => void;
  transaction: RegularTransactionRow;
  categoryOptions: Array<{ label: string; value: string }>;
  onSuccess: () => void;
}

export function EditTransactionDialog({
  isOpen,
  onOpenChange,
  transaction,
  categoryOptions,
  onSuccess,
}: Readonly<EditTransactionDialogProps>) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDirty, setIsDirty] = useState(false);
  const [type, setType] = useState<'income' | 'expense'>(transaction.type);

  const filteredCategories = categoryOptions.filter((cat) => cat.value !== 'all');

  const checkDirty = (form: HTMLFormElement) => {
    const formData = new FormData(form);
    const currentAmount = formData.get('amount') as string;
    const currentRemarks = formData.get('remarks') as string;
    const currentDate = formData.get('transactionDate') as string;
    const currentCategory = formData.get('categoryId') as string;
    const currentPaymentMode = formData.get('paymentMode') as string;
    const currentFundAccount = formData.get('fundAccount') as string;
    const currentPayee = formData.get('payeeMerchant') as string;
    const currentPaidBy = formData.get('paidReceiptBy') as string;

    const originalDate = new Date(transaction.transactionDate).toISOString().slice(0, 10);

    setIsDirty(
      currentAmount !== transaction.amount ||
        currentRemarks !== transaction.remarks ||
        currentDate !== originalDate ||
        currentCategory !== transaction.categoryId ||
        currentPaymentMode !== transaction.paymentMode ||
        currentFundAccount !== transaction.fundAccount ||
        currentPayee !== (transaction.payeeMerchant ?? '') ||
        currentPaidBy !== (transaction.paidReceiptBy ?? '') ||
        type !== transaction.type,
    );
  };

  const handleChange = () => {
    const form = document.getElementById('edit-transaction-form') as HTMLFormElement | null;
    if (!form) return;
    checkDirty(form);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await updateTransaction(transaction.id, {
        type,
        amount: formData.get('amount') as string,
        transactionDate: formData.get('transactionDate') as string,
        categoryId: formData.get('categoryId') as string,
        paymentMode: formData.get('paymentMode') as string,
        fundAccount: formData.get('fundAccount') as string,
        payeeMerchant: formData.get('payeeMerchant') as string,
        paidReceiptBy: formData.get('paidReceiptBy') as string,
        remarks: formData.get('remarks') as string,
      });
      if (!result.success) {
        setErrorMessage(result.error ?? 'Unable to update transaction.');
        return;
      }
      onSuccess();
    });
  };

  const originalDate = new Date(transaction.transactionDate).toISOString().slice(0, 10);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(value) => {
        if (!isPending) onOpenChange(value);
      }}
    >
      <DialogContent className="max-h-[90vh] w-[calc(100%-1.5rem)] gap-3 overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Transaction #{transaction.transactionCode}</DialogTitle>
        </DialogHeader>

        <form id="edit-transaction-form" onSubmit={handleSubmit} className="space-y-3">
          {/* Type Toggle */}
          <div className="border-border bg-surface-hover inline-flex w-full rounded-xl border p-1 sm:w-auto">
            <Button
              type="button"
              variant="ghost"
              aria-pressed={type === 'income'}
              className={
                type === 'income'
                  ? 'border-success/20 text-success min-w-[7.5rem] rounded-lg border bg-white shadow-sm hover:bg-white'
                  : 'text-text-secondary hover:border-border hover:text-text-primary min-w-[7.5rem] rounded-lg border border-transparent hover:bg-white'
              }
              onClick={() => {
                setType('income');
                setIsDirty(true);
              }}
              disabled={isPending}
            >
              Income
            </Button>
            <Button
              type="button"
              variant="ghost"
              aria-pressed={type === 'expense'}
              className={
                type === 'expense'
                  ? 'border-danger/20 text-danger min-w-[7.5rem] rounded-lg border bg-white shadow-sm hover:bg-white'
                  : 'text-text-secondary hover:border-border hover:text-text-primary min-w-[7.5rem] rounded-lg border border-transparent hover:bg-white'
              }
              onClick={() => {
                setType('expense');
                setIsDirty(true);
              }}
              disabled={isPending}
            >
              Expense
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Amount */}
            <div className="space-y-1.5">
              <label className="text-text-secondary text-sm font-medium" htmlFor="edit-amount">
                Amount *
              </label>
              <div className="border-border focus-within:border-accent focus-within:ring-accent/20 flex h-10 items-center rounded-lg border bg-white transition-all focus-within:ring-2">
                <span className="bg-surface-hover text-text-secondary flex h-full items-center rounded-l-lg px-3 text-sm font-medium">
                  OMR
                </span>
                <input
                  id="edit-amount"
                  name="amount"
                  inputMode="decimal"
                  required
                  defaultValue={transaction.amount}
                  disabled={isPending}
                  onChange={handleChange}
                  className="text-text-primary h-full flex-1 rounded-r-lg bg-white px-3 py-2 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>

            {/* Date */}
            <div className="space-y-1.5">
              <label className="text-text-secondary text-sm font-medium" htmlFor="edit-date">
                Date *
              </label>
              <input
                id="edit-date"
                name="transactionDate"
                type="date"
                required
                defaultValue={originalDate}
                disabled={isPending}
                onChange={handleChange}
                className="border-border text-text-primary focus:border-accent focus:ring-accent/20 h-10 w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-text-secondary text-sm font-medium" htmlFor="edit-category">
                Category *
              </label>
              <select
                id="edit-category"
                name="categoryId"
                required
                defaultValue={transaction.categoryId ?? ''}
                disabled={isPending}
                onChange={handleChange}
                className="border-border text-text-primary focus:border-accent focus:ring-accent/20 h-10 w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select category</option>
                {filteredCategories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Method */}
            <div className="space-y-1.5">
              <label
                className="text-text-secondary text-sm font-medium"
                htmlFor="edit-payment-mode"
              >
                Payment Method *
              </label>
              <select
                id="edit-payment-mode"
                name="paymentMode"
                required
                defaultValue={transaction.paymentMode}
                disabled={isPending}
                onChange={handleChange}
                className="border-border text-text-primary focus:border-accent focus:ring-accent/20 h-10 w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select method</option>
                <option value="cash">Cash</option>
                <option value="bank">Bank</option>
                <option value="online_transaction">Online Transaction</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Fund Account */}
            <div className="space-y-1.5">
              <label
                className="text-text-secondary text-sm font-medium"
                htmlFor="edit-fund-account"
              >
                Fund Account *
              </label>
              <select
                id="edit-fund-account"
                name="fundAccount"
                required
                defaultValue={transaction.fundAccount}
                disabled={isPending}
                onChange={handleChange}
                className="border-border text-text-primary focus:border-accent focus:ring-accent/20 h-10 w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select account</option>
                <option value="cash">Cash</option>
                <option value="bank">Bank</option>
              </select>
            </div>

            {/* Payee/Merchant */}
            <div className="space-y-1.5">
              <label className="text-text-secondary text-sm font-medium" htmlFor="edit-payee">
                Payee / Merchant
              </label>
              <input
                id="edit-payee"
                name="payeeMerchant"
                defaultValue={transaction.payeeMerchant ?? ''}
                disabled={isPending}
                onChange={handleChange}
                className="border-border text-text-primary focus:border-accent focus:ring-accent/20 h-10 w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Paid/Receipt By */}
            <div className="space-y-1.5">
              <label className="text-text-secondary text-sm font-medium" htmlFor="edit-paid-by">
                Paid / Receipt By
              </label>
              <input
                id="edit-paid-by"
                name="paidReceiptBy"
                defaultValue={transaction.paidReceiptBy ?? ''}
                disabled={isPending}
                onChange={handleChange}
                className="border-border text-text-primary focus:border-accent focus:ring-accent/20 h-10 w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          {/* Remarks */}
          <div className="space-y-1.5">
            <label className="text-text-secondary text-sm font-medium" htmlFor="edit-remarks">
              Remarks
            </label>
            <textarea
              id="edit-remarks"
              name="remarks"
              rows={2}
              defaultValue={transaction.remarks}
              disabled={isPending}
              onChange={handleChange}
              className="border-border text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-accent/20 w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Add transaction notes"
            />
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
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" form="edit-transaction-form" disabled={isPending || !isDirty}>
            {isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
