'use client';

import {
  type ChangeEvent,
  type ComponentProps,
  type Dispatch,
  type RefObject,
  type SetStateAction,
  useMemo,
  useRef,
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
import { createTransaction, requestTransactionAttachmentUpload } from '@/lib/actions/transactions';
import {
  createTransactionSchema,
  TRANSACTION_ATTACHMENT_DEFAULT_MAX_BYTES,
  TRANSACTION_REMARKS_MAX_LENGTH,
} from '@/lib/validations/transactions';
import { mapZodIssues } from '@/lib/zod-issues';
import type { TransactionCategoryOption } from '@/types/transaction-categories';
import type { TransactionType } from '@/types/transactions';

interface CreateTransactionDialogProps {
  isOpen: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
  categories: TransactionCategoryOption[];
}

type SaveAction = 'save' | 'saveAndAdd';

interface CreateTransactionPayloadInput {
  type: TransactionType;
  formData: FormData;
  attachmentFileName: string | null;
}

interface TransactionTypeToggleProps {
  type: TransactionType;
  isPending: boolean;
  onTypeChange: Dispatch<TransactionType>;
}

interface CreateTransactionFormFieldsProps {
  formRef: RefObject<HTMLFormElement | null>;
  onSubmit: NonNullable<ComponentProps<'form'>['onSubmit']>;
  type: TransactionType;
  filteredCategories: TransactionCategoryOption[];
  isPending: boolean;
  fieldErrors: Record<string, string>;
  errorMessage: string | null;
  onTypeChange: Dispatch<TransactionType>;
  onAttachmentChange: Dispatch<AttachmentInputChangeEvent>;
}

interface CreateTransactionFooterProps {
  isPending: boolean;
  pendingAction: SaveAction | null;
  onCancel: () => void;
  onSaveActionChange: Dispatch<SaveAction>;
}

function getFormValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

type FormSubmitEvent = Parameters<NonNullable<ComponentProps<'form'>['onSubmit']>>[0];
type AttachmentInputChangeEvent = ChangeEvent<HTMLInputElement>;

const todayDateString = new Date().toISOString().slice(0, 10);
const createTransactionFormId = 'create-transaction-form';

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

function buildCreateTransactionPayload({
  type,
  formData,
  attachmentFileName,
}: Readonly<CreateTransactionPayloadInput>) {
  return {
    type,
    amount: getFormValue(formData, 'amount'),
    transactionDate: getFormValue(formData, 'transactionDate'),
    categoryId: getFormValue(formData, 'categoryId'),
    paymentMode: getFormValue(formData, 'paymentMode'),
    fundAccount: getFormValue(formData, 'fundAccount'),
    payeeMerchant: getFormValue(formData, 'payeeMerchant'),
    paidReceiptBy: getFormValue(formData, 'paidReceiptBy'),
    remarks: getFormValue(formData, 'remarks'),
    attachmentKey: attachmentFileName ?? undefined,
  };
}

function clearTypeRelatedErrors(current: Record<string, string>): Record<string, string> {
  const next = { ...current };
  delete next['type'];
  delete next['categoryId'];
  return next;
}

function getTypeButtonClass(selected: boolean, variant: TransactionType): string {
  if (selected && variant === 'income') {
    return 'min-w-[7.5rem] rounded-lg border border-success/20 bg-white text-success shadow-sm hover:bg-white';
  }

  if (selected && variant === 'expense') {
    return 'min-w-[7.5rem] rounded-lg border border-danger/20 bg-white text-danger shadow-sm hover:bg-white';
  }

  return 'min-w-[7.5rem] rounded-lg border border-transparent text-text-secondary hover:border-border hover:bg-white hover:text-text-primary';
}

function getPendingLabel(
  pendingAction: SaveAction | null,
  action: SaveAction,
  idleLabel: string,
): string {
  return pendingAction === action ? 'Saving...' : idleLabel;
}

function TransactionTypeToggle({
  type,
  isPending,
  onTypeChange,
}: Readonly<TransactionTypeToggleProps>) {
  return (
    <div className="border-border bg-surface-hover inline-flex w-full rounded-xl border p-1 sm:w-auto">
      <Button
        type="button"
        variant="ghost"
        aria-pressed={type === 'income'}
        className={getTypeButtonClass(type === 'income', 'income')}
        onClick={() => onTypeChange('income')}
        disabled={isPending}
      >
        Income
      </Button>
      <Button
        type="button"
        variant="ghost"
        aria-pressed={type === 'expense'}
        className={getTypeButtonClass(type === 'expense', 'expense')}
        onClick={() => onTypeChange('expense')}
        disabled={isPending}
      >
        Expense
      </Button>
    </div>
  );
}

function CreateTransactionFormFields({
  formRef,
  onSubmit,
  type,
  filteredCategories,
  isPending,
  fieldErrors,
  errorMessage,
  onTypeChange,
  onAttachmentChange,
}: Readonly<CreateTransactionFormFieldsProps>) {
  return (
    <form ref={formRef} id={createTransactionFormId} onSubmit={onSubmit} className="space-y-3">
      <TransactionTypeToggle type={type} isPending={isPending} onTypeChange={onTypeChange} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-text-secondary text-sm font-medium" htmlFor="ct-amount">
            Amount *
          </label>
          <div className="border-border focus-within:border-accent focus-within:ring-accent/20 flex h-10 items-center rounded-lg border bg-white transition-all focus-within:ring-2">
            <span className="bg-surface-hover text-text-secondary flex h-full items-center rounded-l-lg px-3 text-sm font-medium">
              OMR
            </span>
            <input
              id="ct-amount"
              name="amount"
              placeholder="0.000"
              inputMode="decimal"
              required
              {...getFieldAriaProps(fieldErrors, 'amount', 'ct-amount-error')}
              disabled={isPending}
              className="text-text-primary placeholder:text-text-muted h-full flex-1 rounded-r-lg bg-white px-3 py-2 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <FormFieldError fieldErrors={fieldErrors} fieldKey="amount" errorId="ct-amount-error" />
        </div>

        <div className="space-y-1.5">
          <label className="text-text-secondary text-sm font-medium" htmlFor="ct-date">
            Date *
          </label>
          <Input
            id="ct-date"
            name="transactionDate"
            type="date"
            defaultValue={todayDateString}
            required
            {...getFieldAriaProps(fieldErrors, 'transactionDate', 'ct-date-error')}
            disabled={isPending}
          />
          <FormFieldError
            fieldErrors={fieldErrors}
            fieldKey="transactionDate"
            errorId="ct-date-error"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-text-secondary text-sm font-medium" htmlFor="ct-category">
            Category *
          </label>
          <select
            id="ct-category"
            name="categoryId"
            key={type}
            defaultValue=""
            required
            {...getFieldAriaProps(fieldErrors, 'categoryId', 'ct-category-error')}
            disabled={isPending}
            className="border-border text-text-primary focus:border-accent focus:ring-accent/20 h-10 w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2"
          >
            <option value="">Select category</option>
            {filteredCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <FormFieldError
            fieldErrors={fieldErrors}
            fieldKey="categoryId"
            errorId="ct-category-error"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-text-secondary text-sm font-medium" htmlFor="ct-payment-mode">
            Payment Method *
          </label>
          <select
            id="ct-payment-mode"
            name="paymentMode"
            defaultValue=""
            required
            {...getFieldAriaProps(fieldErrors, 'paymentMode', 'ct-payment-mode-error')}
            disabled={isPending}
            className="border-border text-text-primary focus:border-accent focus:ring-accent/20 h-10 w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2"
          >
            <option value="">Select method</option>
            <option value="cash">Cash</option>
            <option value="bank">Bank</option>
            <option value="online_transaction">Online Transaction</option>
            <option value="cheque">Cheque</option>
          </select>
          <FormFieldError
            fieldErrors={fieldErrors}
            fieldKey="paymentMode"
            errorId="ct-payment-mode-error"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-text-secondary text-sm font-medium" htmlFor="ct-fund-account">
            Fund Account *
          </label>
          <select
            id="ct-fund-account"
            name="fundAccount"
            defaultValue=""
            required
            {...getFieldAriaProps(fieldErrors, 'fundAccount', 'ct-fund-account-error')}
            disabled={isPending}
            className="border-border text-text-primary focus:border-accent focus:ring-accent/20 h-10 w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2"
          >
            <option value="">Select account</option>
            <option value="cash">Cash</option>
            <option value="bank">Bank</option>
          </select>
          <FormFieldError
            fieldErrors={fieldErrors}
            fieldKey="fundAccount"
            errorId="ct-fund-account-error"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-text-secondary text-sm font-medium" htmlFor="ct-payee-merchant">
            Payee / Merchant
          </label>
          <Input
            id="ct-payee-merchant"
            name="payeeMerchant"
            {...getFieldAriaProps(fieldErrors, 'payeeMerchant', 'ct-payee-merchant-error')}
            disabled={isPending}
          />
          <FormFieldError
            fieldErrors={fieldErrors}
            fieldKey="payeeMerchant"
            errorId="ct-payee-merchant-error"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-text-secondary text-sm font-medium" htmlFor="ct-paid-receipt-by">
            Paid / Receipt By
          </label>
          <Input
            id="ct-paid-receipt-by"
            name="paidReceiptBy"
            {...getFieldAriaProps(fieldErrors, 'paidReceiptBy', 'ct-paid-receipt-by-error')}
            disabled={isPending}
          />
          <FormFieldError
            fieldErrors={fieldErrors}
            fieldKey="paidReceiptBy"
            errorId="ct-paid-receipt-by-error"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-text-secondary text-sm font-medium" htmlFor="ct-attachment">
            Reference File
          </label>
          <input
            id="ct-attachment"
            type="file"
            accept="image/*,.pdf"
            disabled={isPending}
            onChange={onAttachmentChange}
            className="border-border text-text-primary focus:border-accent focus:ring-accent/20 w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none file:mr-3 file:rounded file:border-0 file:bg-transparent file:text-sm file:font-medium focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-text-secondary text-sm font-medium" htmlFor="ct-remarks">
          Remarks
        </label>
        <textarea
          id="ct-remarks"
          name="remarks"
          rows={2}
          maxLength={TRANSACTION_REMARKS_MAX_LENGTH}
          {...getFieldAriaProps(fieldErrors, 'remarks', 'ct-remarks-error')}
          disabled={isPending}
          className="border-border text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-accent/20 w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Add transaction notes"
        />
        <FormFieldError fieldErrors={fieldErrors} fieldKey="remarks" errorId="ct-remarks-error" />
      </div>

      {errorMessage ? (
        <p className="text-danger text-sm" role="alert" aria-live="polite">
          {errorMessage}
        </p>
      ) : null}
    </form>
  );
}

function CreateTransactionFooter({
  isPending,
  pendingAction,
  onCancel,
  onSaveActionChange,
}: Readonly<CreateTransactionFooterProps>) {
  return (
    <DialogFooter>
      <Button type="button" variant="secondary" onClick={onCancel} disabled={isPending}>
        Cancel
      </Button>
      <Button
        type="submit"
        form={createTransactionFormId}
        variant="secondary"
        className="border-accent-border text-accent bg-accent-light"
        onClick={() => {
          onSaveActionChange('saveAndAdd');
        }}
        disabled={isPending}
      >
        {getPendingLabel(pendingAction, 'saveAndAdd', 'Save and Add Another')}
      </Button>
      <Button
        type="submit"
        form={createTransactionFormId}
        onClick={() => {
          onSaveActionChange('save');
        }}
        disabled={isPending}
      >
        {getPendingLabel(pendingAction, 'save', 'Save Transaction')}
      </Button>
    </DialogFooter>
  );
}

export function CreateTransactionDialog({
  isOpen,
  onOpenChange,
  categories,
}: Readonly<CreateTransactionDialogProps>) {
  const [type, setType] = useState<TransactionType>('income');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [pendingAction, setPendingAction] = useState<SaveAction | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const saveActionRef = useRef<SaveAction>('save');

  const isPending = pendingAction !== null;
  const filteredCategories = useMemo(
    () => categories.filter((category) => category.type === type),
    [categories, type],
  );

  const handleDialogOpenChange = (nextOpen: boolean) => {
    handlePendingAwareDialogOpenChange(nextOpen, isPending, onOpenChange);
  };

  const handleTypeChange = (nextType: TransactionType) => {
    if (nextType === type) return;
    setType(nextType);
    setFieldErrors(clearTypeRelatedErrors);
  };

  const handleAttachmentChange = (event: AttachmentInputChangeEvent) => {
    const file = event.target.files?.[0] ?? null;

    if (file) {
      if (file.size > TRANSACTION_ATTACHMENT_DEFAULT_MAX_BYTES) {
        const maxSizeMB = (TRANSACTION_ATTACHMENT_DEFAULT_MAX_BYTES / (1024 * 1024))
          .toFixed(1)
          .replace(/\.0$/, '');
        const maxSizeLabel =
          TRANSACTION_ATTACHMENT_DEFAULT_MAX_BYTES < 1024 * 1024
            ? `${Math.round(TRANSACTION_ATTACHMENT_DEFAULT_MAX_BYTES / 1024)}KB`
            : `${maxSizeMB}MB`;

        setErrorMessage(`Attachment must be ${maxSizeLabel} or smaller.`);
        event.target.value = '';
        setAttachmentFile(null);
        return;
      }
    }

    setErrorMessage(null);
    setAttachmentFile(file);
  };

  const resetForAdditionalEntry = () => {
    formRef.current?.reset();
    setType('income');
    setFieldErrors({});
    setErrorMessage(null);
    setAttachmentFile(null);
  };

  const submitValidatedTransaction = async (
    currentAction: SaveAction,
    payload: Parameters<typeof createTransaction>[0],
  ) => {
    setPendingAction(currentAction);

    try {
      let finalPayload = { ...payload };

      // Handle S3 Upload if a file is selected
      if (attachmentFile) {
        const uploadConfig = await requestTransactionAttachmentUpload({
          fileName: attachmentFile.name,
          fileType: attachmentFile.type,
          fileSize: attachmentFile.size,
        });

        if (!uploadConfig.success || !uploadConfig.data) {
          setErrorMessage(uploadConfig.error ?? 'Unable to prepare attachment upload.');
          return;
        }

        const uploadResponse = await fetch(uploadConfig.data.uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': attachmentFile.type,
          },
          body: attachmentFile,
        });

        if (!uploadResponse.ok) {
          setErrorMessage('Unable to upload attachment. Please try again.');
          return;
        }

        finalPayload = {
          ...finalPayload,
          attachmentKey: uploadConfig.data.attachmentKey,
        };
      }

      const result = await createTransaction(finalPayload);
      if (!result.success) {
        setErrorMessage(result.error ?? 'Unable to create transaction. Please try again.');
        return;
      }

      if (currentAction === 'save') {
        onOpenChange(false);
        return;
      }

      resetForAdditionalEntry();
    } catch (err) {
      console.error('Error creating transaction:', err);
      setErrorMessage('Unable to create transaction. Please try again.');
    } finally {
      setPendingAction(null);
    }
  };

  const handleSubmit = (event: FormSubmitEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    const currentAction = saveActionRef.current;
    const formData = new FormData(event.currentTarget);

    const payload = buildCreateTransactionPayload({
      type,
      formData,
      attachmentFileName: attachmentFile?.name ?? null,
    });

    const validationResult = createTransactionSchema.safeParse(payload);
    if (!validationResult.success) {
      setFieldErrors(mapZodIssues(validationResult.error.issues));
      return;
    }

    void submitValidatedTransaction(currentAction, validationResult.data);
  };

  const handleSaveActionChange = (action: SaveAction) => {
    saveActionRef.current = action;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-h-[90vh] w-[calc(100%-1.5rem)] gap-3 overflow-x-hidden overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>New Transaction</DialogTitle>
        </DialogHeader>

        <CreateTransactionFormFields
          formRef={formRef}
          onSubmit={handleSubmit}
          type={type}
          filteredCategories={filteredCategories}
          isPending={isPending}
          fieldErrors={fieldErrors}
          errorMessage={errorMessage}
          onTypeChange={handleTypeChange}
          onAttachmentChange={handleAttachmentChange}
        />

        <CreateTransactionFooter
          isPending={isPending}
          pendingAction={pendingAction}
          onCancel={() => handleDialogOpenChange(false)}
          onSaveActionChange={handleSaveActionChange}
        />
      </DialogContent>
    </Dialog>
  );
}
