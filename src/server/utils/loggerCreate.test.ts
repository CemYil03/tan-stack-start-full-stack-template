import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { eq } from 'drizzle-orm';

import { loggerCreate } from './loggerCreate';
import { testDb, cleanLogs, cleanSessions } from '../test/dbTestUtils';
import { logs, sessions } from '../db/schema';

const consoleMocks = {
    error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
    info: vi.spyOn(console, 'info').mockImplementation(() => {}),
    debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
};

function flush() {
    return new Promise((resolve) => setTimeout(resolve, 10));
}

describe('loggerCreate', () => {
    beforeEach(async () => {
        await cleanLogs();
        await cleanSessions();
        Object.values(consoleMocks).forEach((mock) => mock.mockClear());
    });

    afterAll(async () => {
        await cleanLogs();
        await cleanSessions();
        Object.values(consoleMocks).forEach((mock) => mock.mockRestore());
    });

    it.each(['error', 'warn', 'info', 'debug'] as const)('persists a %s-level row from a string message', async (level) => {
        // Arrange
        const log = loggerCreate(testDb);

        // Act
        log[level](`test ${level} message`);
        await flush();

        // Assert — console called
        expect(consoleMocks[level]).toHaveBeenCalledWith(`test ${level} message`, undefined);

        // Assert — row persisted
        const rows = await testDb.select().from(logs).where(eq(logs.level, level));
        expect(rows).toHaveLength(1);
        expect(rows[0]!.message).toBe(`test ${level} message`);
        expect(rows[0]!.context).toBeNull();
        expect(rows[0]!.sessionId).toBeNull();
        expect(rows[0]!.logId).toBeDefined();
        expect(rows[0]!.createdAt).toBeInstanceOf(Date);
    });

    it('persists an Error with name and stack as context', async () => {
        // Arrange
        const log = loggerCreate(testDb);
        const error = new Error('something broke');

        // Act
        log.error(error);
        await flush();

        // Assert — console called with extracted message and context
        expect(consoleMocks.error).toHaveBeenCalledWith('something broke', { name: 'Error', stack: error.stack });

        // Assert — row persisted
        const rows = await testDb.select().from(logs).where(eq(logs.level, 'error'));
        expect(rows).toHaveLength(1);
        expect(rows[0]!.message).toBe('something broke');
        expect(rows[0]!.context).toEqual({ name: 'Error', stack: error.stack });
    });

    it('persists sessionId when a session is provided', async () => {
        // Arrange
        const log = loggerCreate(testDb);
        const sessionId = crypto.randomUUID();
        await testDb.insert(sessions).values({ sessionId });

        // Act
        log.warn('with session', { sessionId });
        await flush();

        // Assert
        const rows = await testDb.select().from(logs).where(eq(logs.level, 'warn'));
        expect(rows).toHaveLength(1);
        expect(rows[0]!.sessionId).toBe(sessionId);
    });

    it('persists Error with sessionId together', async () => {
        // Arrange
        const log = loggerCreate(testDb);
        const error = new TypeError('bad type');
        const sessionId = crypto.randomUUID();
        await testDb.insert(sessions).values({ sessionId });

        // Act
        log.error(error, { sessionId });
        await flush();

        // Assert
        const rows = await testDb.select().from(logs).where(eq(logs.level, 'error'));
        expect(rows).toHaveLength(1);
        expect(rows[0]!.message).toBe('bad type');
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
        await flush();

        // Assert — the rejection was caught and forwarded to console.error
        expect(consoleMocks.error).toHaveBeenCalledWith('this should not throw', undefined);
        expect(consoleMocks.error).toHaveBeenCalledWith(expect.any(Error));
    });
});
