import { drizzle } from 'drizzle-orm/node-postgres';

import * as schema from './schema.ts';

export const db = drizzle(process.env.DATABASE_URL!, { schema });

export type Database = typeof db;

export type DatabaseTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
