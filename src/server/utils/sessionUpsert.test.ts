import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { eq } from 'drizzle-orm';

import { sessionUpsert } from './sessionUpsert';
import { testDb, testLog, cleanSessions } from '../test/dbTestUtils';
import { sessions } from '../db/schema';

describe('sessionUpsert', () => {
    beforeEach(async () => {
        await cleanSessions();
    });

    afterAll(async () => {
        await cleanSessions();
    });

    it('creates a new session when no existing session ID is provided', async () => {
        // Arrange — nothing

        // Act
        const result = await sessionUpsert(testDb, testLog, null, 'TestAgent');

        // Assert
        expect(result.sessionId).toBeDefined();
        expect(typeof result.sessionId).toBe('string');

        const [row] = await testDb.select().from(sessions).where(eq(sessions.sessionId, result.sessionId));
        expect(row).toBeDefined();
        expect(row!.userAgent).toBe('TestAgent');
    });

    it('creates a new session when session ID does not exist in DB', async () => {
        // Arrange
        const unknownId = crypto.randomUUID();

        // Act
        const result = await sessionUpsert(testDb, testLog, unknownId, 'TestAgent');

        // Assert
        expect(result.sessionId).not.toBe(unknownId);

        const allSessions = await testDb.select().from(sessions);
        expect(allSessions).toHaveLength(1);
    });

    it('creates a new session when the existing session was terminated', async () => {
        // Arrange
        const [terminated] = await testDb
            .insert(sessions)
            .values({
                sessionId: crypto.randomUUID(),
                userAgent: 'OldAgent',
                wasTerminatedAt: new Date(),
            })
            .returning();

        // Act
        const result = await sessionUpsert(testDb, testLog, terminated!.sessionId, 'TestAgent');

        // Assert
        expect(result.sessionId).not.toBe(terminated!.sessionId);

        const allSessions = await testDb.select().from(sessions);
        expect(allSessions).toHaveLength(2);
    });

    it('updates an existing non-terminated session', async () => {
        // Arrange
        const past = new Date('2020-01-01');
        const [existing] = await testDb
            .insert(sessions)
            .values({
                sessionId: crypto.randomUUID(),
                userAgent: 'OldAgent',
                lastInteractionAt: past,
            })
            .returning();

        // Act
        const result = await sessionUpsert(testDb, testLog, existing!.sessionId, 'NewAgent');

        // Assert
        expect(result.sessionId).toBe(existing!.sessionId);

        const [row] = await testDb.select().from(sessions).where(eq(sessions.sessionId, existing!.sessionId));
        expect(row!.userAgent).toBe('NewAgent');
        expect(row!.lastInteractionAt.getTime()).toBeGreaterThan(past.getTime());
    });

    it('handles null userAgent', async () => {
        // Arrange — nothing

        // Act
        const result = await sessionUpsert(testDb, testLog, null, null);

        // Assert
        expect(result.sessionId).toBeDefined();

        const [row] = await testDb.select().from(sessions).where(eq(sessions.sessionId, result.sessionId));
        expect(row!.userAgent).toBeNull();
    });
});
