'use client';

import { TrendingDown, TrendingUp, Wallet } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import type { FinancialActivityMetrics } from '@/types/dashboard';

export function DashboardFinancialActivity({ data }: Readonly<{ data: FinancialActivityMetrics }>) {
  const isPositive = data.closingBalance >= 0;

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-text-primary text-base font-semibold">Financial Activity</h3>
        <span className="text-text-secondary text-xs font-medium">{data.period}</span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="text-text-secondary h-4 w-4" />
            <span className="text-text-secondary text-sm">Opening Balance</span>
          </div>
          <div className="text-text-primary font-semibold">
            {formatCurrency(data.openingBalance)}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-success h-4 w-4" />
            <span className="text-text-secondary text-sm">Income</span>
          </div>
          <div className="text-success font-semibold">+{formatCurrency(data.incomeThisMonth)}</div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingDown className="text-danger h-4 w-4" />
            <span className="text-text-secondary text-sm">Expense</span>
          </div>
          <div className="text-danger font-semibold">-{formatCurrency(data.expensesThisMonth)}</div>
        </div>

        <div className="border-border border-t pt-3">
          <div className="flex items-center justify-between">
            <span className="text-text-secondary text-sm font-medium">Closing Balance</span>
            <div className={`${isPositive ? 'text-success' : 'text-danger'} font-bold`}>
              {formatCurrency(data.closingBalance)}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
