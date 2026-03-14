'use client';

import { Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import { Card } from '@/components/ui/card';
import type { MemberStatusData } from '@/types/dashboard';

const COLORS = {
  active: 'var(--color-success)',
  nearExpiry: 'var(--color-warning)',
  expired: 'var(--color-danger)',
  lifetime: 'var(--color-lifetime)',
};

interface PieLabelProps {
  name?: string;
  percent?: number;
}

export function DashboardMemberChart({ data }: Readonly<{ data: MemberStatusData }>) {
  const chartData = [
    {
      name: 'Active',
      value: data.active,
      fill: COLORS.active,
    },
    {
      name: 'Near Expiry',
      value: data.nearExpiry,
      fill: COLORS.nearExpiry,
    },
    {
      name: 'Expired',
      value: data.expired,
      fill: COLORS.expired,
    },
    {
      name: 'Lifetime',
      value: data.lifetime,
      fill: COLORS.lifetime,
    },
  ];

  return (
    <Card>
      <div className="mb-4">
        <h3 className="text-text-primary text-base font-semibold">Member Status</h3>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(props: PieLabelProps) =>
              `${props.name ?? ''} ${Math.round((props.percent ?? 0) * 100)}%`
            }
            outerRadius={80}
            dataKey="value"
          />
          <Tooltip
            formatter={(value) => [`${value} members`, 'Count']}
            contentStyle={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="sr-only" aria-live="polite">
        <h4>Member Status Distribution</h4>
        <ul>
          {chartData.map((item) => {
            const total = data.active + data.nearExpiry + data.expired + data.lifetime;
            const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
            return (
              <li key={item.name}>
                {item.name}: {item.value.toLocaleString()} members ({percentage}%)
              </li>
            );
          })}
        </ul>
      </div>

      <div className="border-border mt-4 grid grid-cols-4 gap-2 border-t pt-4">
        <div>
          <div className="text-text-secondary mb-1 text-[10px] font-medium tracking-wider uppercase">
            Active
          </div>
          <div className="text-success text-sm font-semibold">{data.active.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-text-secondary mb-1 text-[10px] font-medium tracking-wider uppercase">
            Near Expiry
          </div>
          <div className="text-warning text-sm font-semibold">
            {data.nearExpiry.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-text-secondary mb-1 text-[10px] font-medium tracking-wider uppercase">
            Expired
          </div>
          <div className="text-danger text-sm font-semibold">{data.expired.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-text-secondary mb-1 text-[10px] font-medium tracking-wider uppercase">
            Lifetime
          </div>
          <div className="text-lifetime text-sm font-semibold">
            {data.lifetime.toLocaleString()}
          </div>
        </div>
      </div>
    </Card>
  );
}
