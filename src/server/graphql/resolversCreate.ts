import { DateTimeResolver } from 'graphql-scalars';
import { guardUserMutation } from '../agents/guardUserMutation';
import { guardUserSubscription } from '../agents/guardUserSubscription';
import { userSessionTerminateMany } from '../commands/userSessionTerminateMany';
import type { ServerRuntime } from '../domain/ServerRuntime';
import { sessionUserFindOne } from '../queries/sessionUserFindOne';
import type {
    GqlSResolvers,
    GqlSSession,
    GqlSSubscriptionGenerationChunkUpdatesArgs,
    GqlSUser,
    GqlSUserMutation,
    GqlSUserMutationTerminateSessionsArgs,
} from './generated';

export function resolversCreate(serverRuntime: ServerRuntime): GqlSResolvers {
    return {
        DateTime: DateTimeResolver,
        Session: {
            user(_requestingSession: GqlSSession, __: any, requestingSession: GqlSSession) {
                return sessionUserFindOne(requestingSession, serverRuntime);
            },
        },
        UserMutation: {
            terminateSessions({ userId }: GqlSUserMutation, args: GqlSUserMutationTerminateSessionsArgs, requestingSession: GqlSSession) {
                return userSessionTerminateMany(userId, args, requestingSession, serverRuntime);
            },
        },
        Query: {
            currentSession(_: any, __: any, requestingSession: GqlSSession) {
                return requestingSession;
            },
        },
        Mutation: {
            userCreate(_parent: unknown, __: any, _requestingSession: GqlSSession) {
                return { success: false, referenceId: null }; // todo
            },
            user(_parent: unknown, __: any, requestingSession: GqlSSession) {
                return guardUserMutation(requestingSession);
            },
        },
        Subscription: {
            userUpdates: {
                subscribe(_: any, __: any, requestingSession: GqlSSession) {
                    return guardUserSubscription(requestingSession, serverRuntime);
                },
                resolve(_: any, __: any, requestingSession: GqlSSession) {
                    return sessionUserFindOne(requestingSession, serverRuntime) as Promise<GqlSUser>; // todo
                },
            },
            generationChunkUpdates: {
                subscribe(_: any, { generationId }: GqlSSubscriptionGenerationChunkUpdatesArgs) {
                    return serverRuntime.subscribe.to(generationId);
                },
                resolve(payload: string) {
                    return payload;
                },
            },
        },
    };
}
