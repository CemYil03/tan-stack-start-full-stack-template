import { config } from 'dotenv';

import { drizzle } from 'drizzle-orm/node-postgres';

import * as schema from '../db/schema';
import { loggerCreate } from '../utils/loggerCreate';

config({ path: ['.env.test', '.env.local', '.env'], quiet: true });

export const testDb = drizzle(process.env.DATABASE_URL!, { schema });
export const testLog = loggerCreate(testDb);

export async function cleanSessions() {
    await testDb.delete(schema.sessions);
}

export async function cleanLogs() {
    await testDb.delete(schema.logs);
}
