import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from '@/lib/db/schema';
import { env } from '@/lib/env';

const pool = new Pool({ connectionString: env.DATABASE_URL });

export const db = drizzle({ client: pool, schema });
