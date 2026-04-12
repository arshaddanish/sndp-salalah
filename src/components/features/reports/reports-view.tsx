'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useTransition } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Card } from '@/components/ui/card';
import { DateRangeFilter } from '@/components/ui/date-range-filter';
import { formatCurrency } from '@/lib/utils';
import type { CategoryBreakdownItem, ReportData } from '@/types/reports';

type ReportsViewProps = {
  reportData: ReportData;
  startDate: string;
  endDate: string;
};

function formatPercentage(value: number) {
  return `${value.toFixed(1)}%`;
}

function SummaryCard({
  totalIncome,
  totalExpense,
  periodNet,
  transactionCount,
  incomeTransactionCount,
  expenseTransactionCount,
}: Readonly<{
  totalIncome: number;
  totalExpense: number;
  periodNet: number;
  transactionCount: number;
  incomeTransactionCount: number;
  expenseTransactionCount: number;
}>) {
  return (
    <Card className="space-y-4">
      <div>
        <h3 className="text-text-primary text-base font-semibold">Total</h3>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <div className="text-text-secondary text-xs uppercase">Income</div>
          <div className="text-success mt-1 text-lg font-semibold tabular-nums">
            {formatCurrency(totalIncome)}
          </div>
          <div className="text-text-muted text-xs">{incomeTransactionCount} txns</div>
        </div>
        <div>
          <div className="text-text-secondary text-xs uppercase">Expense</div>
          <div className="text-danger mt-1 text-lg font-semibold tabular-nums">
            {formatCurrency(totalExpense)}
          </div>
          <div className="text-text-muted text-xs">{expenseTransactionCount} txns</div>
        </div>
        <div>
          <div className="text-text-secondary text-xs uppercase">Net</div>
          <div
            className={`mt-1 text-lg font-semibold tabular-nums ${periodNet >= 0 ? 'text-success' : 'text-danger'}`}
          >
            {formatCurrency(periodNet)}
          </div>
          <div className="text-text-muted text-xs">Income minus expense</div>
        </div>
        <div>
          <div className="text-text-secondary text-xs uppercase">Transactions</div>
          <div className="text-text-primary mt-1 text-lg font-semibold tabular-nums">
            {transactionCount}
          </div>
          <div className="text-text-muted text-xs">Total entries</div>
        </div>
      </div>
    </Card>
  );
}

function FundAccountCard({
  title,
  income,
  expense,
  net,
  incomeShare,
  expenseShare,
}: Readonly<{
  title: string;
  income: number;
  expense: number;
  net: number;
  incomeShare: number;
  expenseShare: number;
}>) {
  return (
    <Card className="space-y-4">
      <div>
        <h3 className="text-text-primary text-base font-semibold">{title}</h3>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <div className="text-text-secondary text-xs uppercase">Income</div>
          <div className="text-success mt-1 text-lg font-semibold tabular-nums">
            {formatCurrency(income)}
          </div>
          <div className="text-text-muted text-xs">{formatPercentage(incomeShare)} of income</div>
        </div>
        <div>
          <div className="text-text-secondary text-xs uppercase">Expense</div>
          <div className="text-danger mt-1 text-lg font-semibold tabular-nums">
            {formatCurrency(expense)}
          </div>
          <div className="text-text-muted text-xs">{formatPercentage(expenseShare)} of expense</div>
        </div>
        <div>
          <div className="text-text-secondary text-xs uppercase">Net</div>
          <div
            className={`mt-1 text-lg font-semibold tabular-nums ${net >= 0 ? 'text-success' : 'text-danger'}`}
          >
            {formatCurrency(net)}
          </div>
          <div className="text-text-muted text-xs">Income minus expense</div>
        </div>
      </div>
    </Card>
  );
}

function BreakdownTable({
  title,
  rows,
  amountClassName,
}: Readonly<{ title: string; rows: CategoryBreakdownItem[]; amountClassName: string }>) {
  return (
    <Card className="p-0">
      <div className="border-border border-b px-4 py-3">
        <h3 className="text-text-primary text-base font-semibold">{title}</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-muted/40 text-text-secondary border-border border-b text-left text-xs tracking-wide uppercase">
              <th className="px-4 py-2.5 font-medium">Category</th>
              <th className="px-4 py-2.5 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="text-text-muted px-4 py-4" colSpan={2}>
                  No data for selected date range.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.categoryName} className="border-border border-b last:border-b-0">
                  <td className="text-text-primary px-4 py-2.5 font-medium">{row.categoryName}</td>
                  <td
                    className={`px-4 py-2.5 text-right font-semibold tabular-nums ${amountClassName}`}
                  >
                    {formatCurrency(row.total)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export function ReportsView({ reportData, startDate, endDate }: Readonly<ReportsViewProps>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const currentStartDate = searchParams.get('startDate') ?? startDate;
  const currentEndDate = searchParams.get('endDate') ?? endDate;

  const chartData = useMemo(() => reportData.monthlyTrend, [reportData.monthlyTrend]);

  const updateUrl = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '') {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [pathname, router, searchParams, startTransition],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-text-primary text-2xl font-bold">Reports</h1>
        </div>

        <DateRangeFilter
          startDate={currentStartDate}
          endDate={currentEndDate}
          onStartChange={(value) => updateUrl({ startDate: value })}
          onEndChange={(value) => updateUrl({ endDate: value })}
          onClear={() => updateUrl({ startDate: null, endDate: null })}
          startLabel="From"
          endLabel="To"
          inactiveLabel="Date Range"
          activeLabel="Date Range Active"
          clearLabel="Clear Date Range"
        />
      </div>

      <SummaryCard
        totalIncome={reportData.summary.totalIncome}
        totalExpense={reportData.summary.totalExpense}
        periodNet={reportData.summary.periodNet}
        transactionCount={reportData.summary.transactionCount}
        incomeTransactionCount={reportData.summary.incomeTransactionCount}
        expenseTransactionCount={reportData.summary.expenseTransactionCount}
      />

      <div className="space-y-4">
        <div>
          <h2 className="text-text-primary text-base font-semibold">Fund Account Breakdown</h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <FundAccountCard
            title="Cash Fund"
            income={reportData.fundAccountBreakdown.cash.income}
            expense={reportData.fundAccountBreakdown.cash.expense}
            net={reportData.fundAccountBreakdown.cash.net}
            incomeShare={reportData.fundAccountBreakdown.cash.incomeShare}
            expenseShare={reportData.fundAccountBreakdown.cash.expenseShare}
          />
          <FundAccountCard
            title="Bank Fund"
            income={reportData.fundAccountBreakdown.bank.income}
            expense={reportData.fundAccountBreakdown.bank.expense}
            net={reportData.fundAccountBreakdown.bank.net}
            incomeShare={reportData.fundAccountBreakdown.bank.incomeShare}
            expenseShare={reportData.fundAccountBreakdown.bank.expenseShare}
          />
        </div>
      </div>

      <Card>
        <div className="mb-4">
          <h2 className="text-text-primary text-base font-semibold">Income vs Expense (Monthly)</h2>
        </div>

        <div className="overflow-x-auto pb-2">
          <div style={{ minWidth: `${Math.max(600, chartData.length * 60)}px` }}>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  stroke="var(--color-text-secondary)"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke="var(--color-text-secondary)"
                  style={{ fontSize: '12px' }}
                  width={48}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  contentStyle={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: '16px' }} />
                <Bar
                  dataKey="income"
                  fill="var(--color-success)"
                  radius={[6, 6, 0, 0]}
                  name="Income"
                />
                <Bar
                  dataKey="expense"
                  fill="var(--color-danger)"
                  radius={[6, 6, 0, 0]}
                  name="Expense"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <BreakdownTable
          title="Income Breakdown"
          rows={reportData.incomeBreakdown}
          amountClassName="text-success"
        />
        <BreakdownTable
          title="Expense Breakdown"
          rows={reportData.expenseBreakdown}
          amountClassName="text-danger"
        />
      </div>
    </div>
  );
}
