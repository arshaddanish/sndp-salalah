'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Users } from 'lucide-react';

import { Card } from '@/components/ui/card';
import type { MemberStatusData } from '@/types/dashboard';

const STATUS_CONFIG = [
  {
    key: 'pending' as const,
    name: 'Pending',
    color: '#a1a1aa', // zinc-400 — neutral gray for unactivated
    textClass: 'text-text-secondary',
  },
  {
    key: 'active' as const,
    name: 'Active',
    color: 'var(--color-success)',
    textClass: 'text-success',
  },
  {
    key: 'nearExpiry' as const,
    name: 'Near Expiry',
    color: 'var(--color-warning)',
    textClass: 'text-warning',
  },
  {
    key: 'expired' as const,
    name: 'Expired',
    color: 'var(--color-danger)',
    textClass: 'text-danger',
  },
  {
    key: 'lifetime' as const,
    name: 'Lifetime',
    color: 'var(--color-lifetime)',
    textClass: 'text-lifetime',
  },
] as const;

export function DashboardMemberChart({ data }: Readonly<{ data: MemberStatusData }>) {
  const total = data.pending + data.active + data.nearExpiry + data.expired + data.lifetime;

  // Only include slices with actual values to prevent label overlap at zero
  const chartData = STATUS_CONFIG.filter(({ key }) => data[key] > 0).map(
    ({ key, name, color }) => ({
      name,
      value: data[key],
      color,
    }),
  );

  const isEmpty = total === 0;

  return (
    <Card>
      <div className="mb-4">
        <h3 className="text-text-primary text-base font-semibold">Member Status</h3>
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
          <div className="bg-surface-hover flex h-16 w-16 items-center justify-center rounded-full">
            <Users className="text-text-muted h-8 w-8" />
          </div>
          <div>
            <p className="text-text-primary text-sm font-medium">No members yet</p>
            <p className="text-text-muted mt-0.5 text-xs">
              Member status will appear here once members are added.
            </p>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => {
                const n = Number(value);
                return [`${n} member${n !== 1 ? 's' : ''}`, 'Count'];
              }}
              contentStyle={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}

      {/* Accessible screen reader summary */}
      <div className="sr-only" aria-live="polite">
        <h4>Member Status Distribution</h4>
        <ul>
          {STATUS_CONFIG.map(({ key, name }) => {
            const value = data[key];
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return (
              <li key={key}>
                {name}: {value.toLocaleString()} members ({percentage}%)
              </li>
            );
          })}
        </ul>
      </div>

      {/* Stats row */}
      <div className="border-border mt-4 grid grid-cols-5 gap-2 border-t pt-4">
        {STATUS_CONFIG.map(({ key, name, color, textClass }) => (
          <div key={key}>
            <div className="mb-1 flex items-center gap-1">
              <span
                className="inline-block h-2 w-2 flex-shrink-0 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-text-secondary truncate text-[10px] font-medium tracking-wider uppercase">
                {name.replace(' ', '\u00A0')}
              </span>
            </div>
            <div className={`${textClass} text-sm font-semibold`}>{data[key].toLocaleString()}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}
