import { eq, sql } from 'drizzle-orm';

import { db } from '@/lib/db';
import { members } from '@/lib/db/schema';
import type { MemberActivityMetrics, MemberStatusData } from '@/types/dashboard';

export async function getDashboardMemberKpis(): Promise<{
  totalMembers: number;
  nearExpiry: number;
}> {
  const [totalMembersResult, nearExpiryResult] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(members)
      .where(eq(members.is_archived, false)),
    db
      .select({ count: sql<number>`count(*)` })
      .from(members)
      .where(
        sql`${members.is_archived} = false AND ${members.expiry} >= CURRENT_DATE AND ${members.expiry} <= CURRENT_DATE + INTERVAL '30 days'`,
      ),
  ]);

  return {
    totalMembers: Number(totalMembersResult[0]?.count ?? 0),
    nearExpiry: Number(nearExpiryResult[0]?.count ?? 0),
  };
}

export async function getDashboardMemberStatus(): Promise<MemberStatusData> {
  const [statusResult] = await db
    .select({
      active: sql<number>`count(*) filter (where expiry > CURRENT_DATE + INTERVAL '30 days' and is_archived = false and is_lifetime = false)`,
      nearExpiry: sql<number>`count(*) filter (where expiry >= CURRENT_DATE and expiry <= CURRENT_DATE + INTERVAL '30 days' and is_archived = false)`,
      expired: sql<number>`count(*) filter (where expiry < CURRENT_DATE and is_archived = false)`,
      lifetime: sql<number>`count(*) filter (where is_lifetime = true and is_archived = false)`,
      pending: sql<number>`count(*) filter (where expiry is null and is_lifetime = false and is_archived = false)`,
    })
    .from(members);

  return {
    pending: Number(statusResult?.pending ?? 0),
    active: Number(statusResult?.active ?? 0),
    expired: Number(statusResult?.expired ?? 0),
    lifetime: Number(statusResult?.lifetime ?? 0),
    nearExpiry: Number(statusResult?.nearExpiry ?? 0),
  };
}

export async function getDashboardMemberActivity(): Promise<MemberActivityMetrics> {
  const [periodResult] = await db
    .select({
      periodLabel: sql<string>`to_char(DATE_TRUNC('month', CURRENT_DATE), 'FMMonth YYYY')`,
    })
    .from(members)
    .limit(1);

  const periodLabel = periodResult?.periodLabel ?? '';

  const [newThisMonthResult, expiredThisMonthResult] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(members)
      .where(
        sql`${members.is_archived} = false AND ${members.active_from} >= DATE_TRUNC('month', CURRENT_DATE) AND ${members.active_from} < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'`,
      ),
    db
      .select({ count: sql<number>`count(*)` })
      .from(members)
      .where(
        sql`${members.is_archived} = false AND ${members.expiry} >= DATE_TRUNC('month', CURRENT_DATE) AND ${members.expiry} < CURRENT_DATE`,
      ),
  ]);

  return {
    period: periodLabel,
    // activationsThisMonth: members whose active_from falls in current month
    // TODO: rename to activationsThisMonth once first_joined_at column is added to distinguish new vs renewal
    newThisMonth: Number(newThisMonthResult[0]?.count ?? 0),
    renewedThisMonth: 0,
    expiredThisMonth: Number(expiredThisMonthResult[0]?.count ?? 0),
  };
}
