import { and, eq, sql } from 'drizzle-orm';

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
        and(
          eq(members.is_archived, false),
          sql`${members.expiry} >= CURRENT_DATE`,
          sql`${members.expiry} < CURRENT_DATE + INTERVAL '30 days'`,
        ),
      ),
  ]);

  return {
    totalMembers: Number(totalMembersResult[0]?.count ?? 0),
    nearExpiry: Number(nearExpiryResult[0]?.count ?? 0),
  };
}

export async function getDashboardMemberStatus(): Promise<MemberStatusData> {
  const { nearExpiry } = await getDashboardMemberKpis();

  const [statusResult] = await db
    .select({
      active: sql<number>`count(*) filter (where expiry >= CURRENT_DATE and is_archived = false and is_lifetime = false)`,
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
    nearExpiry,
  };
}

export async function getDashboardMemberActivity(): Promise<MemberActivityMetrics> {
  const now = new Date();
  const periodLabel = now.toLocaleString('default', { month: 'long', year: 'numeric' });

  const [newThisMonthResult, expiredThisMonthResult] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(members)
      .where(
        and(
          eq(members.is_archived, false),
          sql`${members.active_from} >= DATE_TRUNC('month', CURRENT_DATE)`,
        ),
      ),
    db
      .select({ count: sql<number>`count(*)` })
      .from(members)
      .where(
        and(
          eq(members.is_archived, false),
          sql`${members.expiry} >= DATE_TRUNC('month', CURRENT_DATE)`,
          sql`${members.expiry} < CURRENT_DATE`,
        ),
      ),
  ]);

  return {
    period: periodLabel,
    newThisMonth: Number(newThisMonthResult[0]?.count ?? 0),
    // TODO: renewedThisMonth requires a first_joined_at column to distinguish new vs renewal
    renewedThisMonth: 0,
    expiredThisMonth: Number(expiredThisMonthResult[0]?.count ?? 0),
  };
}
