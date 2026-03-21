export type TransactionCategoryType = 'income' | 'expense';

export type TransactionCategory = {
  id: string;
  name: string;
  type: TransactionCategoryType;
  is_system: boolean;
  created_at: Date;
  updated_at: Date;
};

export type TransactionCategoryWithUsageCount = TransactionCategory & {
  transactionCount: number;
};
