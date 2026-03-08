import { AlertTriangle, Landmark, TrendingDown, TrendingUp, Users, Wallet } from 'lucide-react';

import { Card } from '@/components/ui/card';

export interface KpiData {
  totalMembers: number;
  nearExpiry: number;
  cashInHand: string;
  cashInBank: string;
  ytdIncome: string;
  ytdExpense: string;
}

const KPI_CARDS = [
  {
    id: 'total-members',
    icon: Users,
    label: 'TOTAL MEMBERS',
    valueKey: 'totalMembers',
    textColor: 'text-text-primary',
  },
  {
    id: 'near-expiry',
    icon: AlertTriangle,
    label: 'NEAR EXPIRY (< 30 DAYS)',
    valueKey: 'nearExpiry',
    textColor: 'text-warning',
  },
  {
    id: 'cash-in-hand',
    icon: Wallet,
    label: 'CASH IN HAND',
    valueKey: 'cashInHand',
    textColor: 'text-text-primary',
  },
  {
    id: 'cash-in-bank',
    icon: Landmark,
    label: 'CASH IN BANK',
    valueKey: 'cashInBank',
    textColor: 'text-text-primary',
  },
  {
    id: 'ytd-income',
    icon: TrendingUp,
    label: 'YTD INCOME',
    valueKey: 'ytdIncome',
    textColor: 'text-text-primary',
  },
  {
    id: 'ytd-expense',
    icon: TrendingDown,
    label: 'YTD EXPENSE',
    valueKey: 'ytdExpense',
    textColor: 'text-text-primary',
  },
] as const;

export function DashboardKpis({ data }: Readonly<{ data: KpiData }>) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {KPI_CARDS.map(({ id, icon: Icon, label, valueKey, textColor }) => (
        <Card key={id}>
          <div className="text-text-secondary mb-3 flex items-center gap-2 text-xs font-medium">
            <Icon className="h-4 w-4" />
            {label}
          </div>
          <div className={`${textColor} mb-1 text-3xl font-bold`}>
            {data[valueKey as keyof KpiData]}
          </div>
        </Card>
      ))}
    </div>
  );
}
