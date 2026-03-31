export type TransactionType = 'income' | 'expense';

export type TransactionEntryKind = 'regular' | 'opening_balance';

export type TransactionPaymentMode = 'cash' | 'bank' | 'online_transaction' | 'cheque';

export type TransactionFundAccount = 'cash' | 'bank';

export type TransactionStatementRow = {
  id: string;
  transactionCode: number;
  transactionDate: Date;
  entryKind: TransactionEntryKind;
  categoryId: string | null;
  categoryName: string | null;
  type: TransactionType | null;
  paymentMode: TransactionPaymentMode | null;
  fundAccount: TransactionFundAccount;
  payeeMerchant?: string;
  paidReceiptBy?: string;
  amount: string;
  remarks: string;
  balance: string;
  attachmentKey?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type RegularTransactionRow = Omit<
  TransactionStatementRow,
  'entryKind' | 'categoryId' | 'categoryName' | 'type' | 'paymentMode'
> & {
  entryKind: 'regular';
  categoryId: string;
  categoryName: string;
  type: TransactionType;
  paymentMode: TransactionPaymentMode;
};

export type ExistingOpeningBalance = {
  id: string;
  amount: string;
  transactionDate: string;
  remarks: string;
};
