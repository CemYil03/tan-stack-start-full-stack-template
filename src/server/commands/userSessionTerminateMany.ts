import { and, eq, inArray } from 'drizzle-orm';

import type { ServerRuntime } from '../domain/ServerRuntime';
import type { GqlSMutationResult, GqlSSession, GqlSUserMutationTerminateSessionsArgs } from '../graphql/generated';
import { sessions } from '../db/schema';

export async function userSessionTerminateMany(
    userId: string,
    { sessionIds }: GqlSUserMutationTerminateSessionsArgs,
    requestingSession: GqlSSession,
    serverRuntime: ServerRuntime,
): Promise<GqlSMutationResult> {
    try {
        await serverRuntime.db
            .update(sessions)
            .set({
                wasTerminatedAt: new Date(),
            })
            .where(and(eq(sessions.userId, userId), inArray(sessions.sessionId, sessionIds)));

        await serverRuntime.publish.userUpdates({ userId });

        return {
            success: true,
        };
    } catch (error) {
        serverRuntime.log.error(error, requestingSession);
        throw error;
    }
}
