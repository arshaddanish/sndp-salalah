'use client';

import { TrendingDown, TrendingUp, Users } from 'lucide-react';

import { Card } from '@/components/ui/card';
import type { MemberActivityMetrics } from '@/types/dashboard';

export function DashboardMemberActivity({ data }: Readonly<{ data: MemberActivityMetrics }>) {
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-text-primary text-base font-semibold">Member Activity</h3>
        <span className="text-text-secondary text-xs font-medium">{data.period}</span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="text-success h-4 w-4" />
            <span className="text-text-secondary text-sm">New Members</span>
          </div>
          <div className="text-success font-semibold">+{data.newThisMonth}</div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-accent h-4 w-4" />
            <span className="text-text-secondary text-sm">Renewed</span>
          </div>
          <div className="text-accent font-semibold">+{data.renewedThisMonth}</div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingDown className="text-danger h-4 w-4" />
            <span className="text-text-secondary text-sm">Expired</span>
          </div>
          <div className="text-danger font-semibold">-{data.expiredThisMonth}</div>
        </div>
      </div>
    </Card>
  );
}
