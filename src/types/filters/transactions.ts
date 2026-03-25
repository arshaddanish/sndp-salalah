/**
 * Transactions Resource - Filter and Search Parameters
 */

import type { ListRequest } from '../api/filters';
import type { TransactionPaymentMode, TransactionType } from '../transactions';

export type TransactionsFilter = {
  categoryId?: string;
  type?: TransactionType;
  paymentMode?: TransactionPaymentMode;
  startDate?: string;
  endDate?: string;
};

export type TransactionsSearch = {
  q?: string;
};

export type TransactionsQuery = TransactionsSearch & TransactionsFilter;

export type ListTransactionsRequest = ListRequest<TransactionsFilter, TransactionsSearch>;
