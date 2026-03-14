'use client';

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import type { FinancialTrendData } from '@/types/dashboard';

export function DashboardFinancialChart({ data }: Readonly<{ data: FinancialTrendData }>) {
  return (
    <Card>
      <div className="mb-4">
        <h3 className="text-text-primary text-base font-semibold">Financial Trend (Monthly)</h3>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data.monthlyData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis
            dataKey="month"
            stroke="var(--color-text-secondary)"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="var(--color-text-secondary)"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => `OMR ${value / 1000}k`}
          />
          <Tooltip
            formatter={(value) => formatCurrency(Number(value))}
            labelFormatter={(label) => `Month: ${label}`}
            contentStyle={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
            }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <Line
            type="monotone"
            dataKey="income"
            stroke="var(--color-success)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5 }}
            name="Income"
          />
          <Line
            type="monotone"
            dataKey="expense"
            stroke="var(--color-danger)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5 }}
            name="Expense"
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="border-border mt-4 grid grid-cols-3 gap-3 border-t pt-4">
        <div>
          <div className="text-text-secondary mb-1 text-xs font-medium">Avg Monthly Income</div>
          <div className="text-success text-sm font-semibold">
            {formatCurrency(data.averageMonthlyIncome)}
          </div>
        </div>
        <div>
          <div className="text-text-secondary mb-1 text-xs font-medium">Avg Monthly Expense</div>
          <div className="text-danger text-sm font-semibold">
            {formatCurrency(data.averageMonthlyExpense)}
          </div>
        </div>
        <div>
          <div className="text-text-secondary mb-1 text-xs font-medium">Savings Rate</div>
          <div className="text-accent text-sm font-semibold">{data.savingsRate}%</div>
        </div>
      </div>
    </Card>
  );
}
