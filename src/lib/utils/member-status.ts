import type { MemberStatus } from '@/types/members';

/**
 * Derive member status dynamically based on lifetime flag and expiry date.
 * No stored status column — this is computed at query time to guarantee accuracy.
 *
 * Status logic:
 * - If is_lifetime = true → 'lifetime'
 * - If expiry IS NULL → 'pending' (not yet registered)
 * - If expiry < TODAY → 'expired'
 * - If TODAY <= expiry <= TODAY+30days → 'near-expiry'
 * - Otherwise → 'active'
 */
export const getMemberStatus = (expiry: Date | null, isLifetime: boolean): MemberStatus => {
  if (isLifetime) return 'lifetime';
  if (!expiry) return 'pending';

  // Normalize today to start-of-day for day-granularity comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Clone and normalize expiry to start-of-day to avoid mutating caller-provided Date
  const normalizedExpiry = new Date(expiry);
  normalizedExpiry.setHours(0, 0, 0, 0);

  if (normalizedExpiry < today) return 'expired';

  // Calculate if expiring within 30 days
  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(today.getDate() + 30);

  if (normalizedExpiry <= thirtyDaysFromNow) return 'near-expiry';

  return 'active';
};
