import {
  AlertTriangle,
  Landmark,
  type LucideIcon,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';

import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import type { KpiData } from '@/types/dashboard';

interface KpiCardConfig {
  id: string;
  icon: LucideIcon;
  label: string;
  valueKey: keyof KpiData;
  textColor: string;
  isCurrency: boolean;
}

const KPI_CARDS: KpiCardConfig[] = [
  {
    id: 'total-members',
    icon: Users,
    label: 'TOTAL MEMBERS',
    valueKey: 'totalMembers',
    textColor: 'text-text-primary',
    isCurrency: false,
  },
  {
    id: 'near-expiry',
    icon: AlertTriangle,
    label: 'EXPIRING SOON (< 30 DAYS)',
    valueKey: 'nearExpiry',
    textColor: 'text-warning',
    isCurrency: false,
  },
  {
    id: 'cash-in-hand',
    icon: Wallet,
    label: 'CASH IN HAND',
    valueKey: 'cashInHand',
    textColor: 'text-text-primary',
    isCurrency: true,
  },
  {
    id: 'cash-in-bank',
    icon: Landmark,
    label: 'CASH IN BANK',
    valueKey: 'cashInBank',
    textColor: 'text-text-primary',
    isCurrency: true,
  },
  {
    id: 'ytd-income',
    icon: TrendingUp,
    label: 'YTD INCOME',
    valueKey: 'ytdIncome',
    textColor: 'text-text-primary',
    isCurrency: true,
  },
  {
    id: 'ytd-expense',
    icon: TrendingDown,
    label: 'YTD EXPENSE',
    valueKey: 'ytdExpense',
    textColor: 'text-text-primary',
    isCurrency: true,
  },
];

export function DashboardKpis({ data }: Readonly<{ data: KpiData }>) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {KPI_CARDS.map(({ id, icon: Icon, label, valueKey, textColor, isCurrency }) => (
        <Card key={id}>
          <div className="text-text-secondary mb-3 flex items-center gap-2 text-xs font-medium">
            <Icon className="h-4 w-4" />
            {label}
          </div>
          <div className={`${textColor} mb-1 text-3xl font-bold`}>
            {isCurrency ? formatCurrency(data[valueKey]) : data[valueKey]}
          </div>
        </Card>
      ))}
    </div>
  );
}
