import { createAuthClient } from 'better-auth/react';
import { usernameClient } from 'better-auth/client/plugins';

import { env } from '@/lib/env';

export const authClient = createAuthClient({
  baseURL: env.BETTER_AUTH_URL,
  plugins: [usernameClient()],
});
