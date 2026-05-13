import { describe, it, expect, vi } from 'vitest';
import { and, eq } from 'drizzle-orm';

import { loggerCreate } from './loggerCreate';
import { testDb } from '../test/dbTestUtils';
import { logs, sessions } from '../db/schema';

const consoleMocks = {
    error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
    info: vi.spyOn(console, 'info').mockImplementation(() => {}),
    debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
};

describe('loggerCreate', () => {
    it.each(['error', 'warn', 'info', 'debug'] as const)('persists a %s-level row from a string message', async (level) => {
        // Arrange
        const log = loggerCreate(testDb);
        const message = `test ${level} ${crypto.randomUUID()}`;

        // Act
        log[level](message);
        await log.drain();

        // Assert — console called
        expect(consoleMocks[level]).toHaveBeenCalledWith(message, undefined);

        // Assert — row persisted
        const rows = await testDb
            .select()
            .from(logs)
            .where(and(eq(logs.level, level), eq(logs.message, message)));
        expect(rows).toHaveLength(1);
        expect(rows[0]!.context).toBeNull();
        expect(rows[0]!.sessionId).toBeNull();
        expect(rows[0]!.logId).toBeDefined();
        expect(rows[0]!.createdAt).toBeInstanceOf(Date);
    });

    it('persists an Error with name and stack as context', async () => {
        // Arrange
        const log = loggerCreate(testDb);
        const error = new Error(`something broke ${crypto.randomUUID()}`);

        // Act
        log.error(error);
        await log.drain();

        // Assert — console called with extracted message and context
        expect(consoleMocks.error).toHaveBeenCalledWith(error.message, { name: 'Error', stack: error.stack });

        // Assert — row persisted
        const rows = await testDb.select().from(logs).where(eq(logs.message, error.message));
        expect(rows).toHaveLength(1);
        expect(rows[0]!.context).toEqual({ name: 'Error', stack: error.stack });
    });

    it('persists sessionId when a session is provided', async () => {
        // Arrange
        const log = loggerCreate(testDb);
        const sessionId = crypto.randomUUID();
        await testDb.insert(sessions).values({ sessionId });
        const message = `with session ${crypto.randomUUID()}`;

        // Act
        log.warn(message, { sessionId });
        await log.drain();

        // Assert
        const rows = await testDb.select().from(logs).where(eq(logs.message, message));
        expect(rows).toHaveLength(1);
        expect(rows[0]!.sessionId).toBe(sessionId);
    });

    it('persists Error with sessionId together', async () => {
        // Arrange
        const log = loggerCreate(testDb);
        const error = new TypeError(`bad type ${crypto.randomUUID()}`);
        const sessionId = crypto.randomUUID();
        await testDb.insert(sessions).values({ sessionId });

        // Act
        log.error(error, { sessionId });
        await log.drain();

        // Assert
        const rows = await testDb.select().from(logs).where(eq(logs.message, error.message));
        expect(rows).toHaveLength(1);
        expect(rows[0]!.context).toEqual({ name: 'TypeError', stack: error.stack });
        expect(rows[0]!.sessionId).toBe(sessionId);
    });

    it('does not throw when the DB insert fails', async () => {
        // Arrange — a broken db that rejects on insert
        const brokenDb = {
            insert: () => ({
                values: () => Promise.reject(new Error('connection refused')),
            }),
        } as any;
        const log = loggerCreate(brokenDb);

        // Act — should not throw
        log.error('this should not throw');
        await log.drain();

        // Assert — the rejection was caught and forwarded to console.error
        expect(consoleMocks.error).toHaveBeenCalledWith('this should not throw', undefined);
        expect(consoleMocks.error).toHaveBeenCalledWith(expect.any(Error));
    });
});
