export type TransactionType = 'income' | 'expense';

export type TransactionPaymentMode = 'cash' | 'bank';

export type TransactionStatementRow = {
  id: string;
  transactionCode: number;
  transactionDate: Date;
  categoryId: string;
  categoryName: string;
  type: TransactionType;
  paymentMode: TransactionPaymentMode;
  amount: string;
  remarks: string;
  createdAt: Date;
  updatedAt: Date;
};
