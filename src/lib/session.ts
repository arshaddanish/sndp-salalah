import { headers } from 'next/headers';
import { cache } from 'react';

import { auth } from './auth';

/**
 * Returns the current session, memoized for the duration of a single request.
 * This ensures that multiple components can check the session without triggering
 * redundant database queries.
 */
export const getSession = cache(async () => {
  return auth.api.getSession({
    headers: await headers(),
  });
});
