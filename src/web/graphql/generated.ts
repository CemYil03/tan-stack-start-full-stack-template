/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
    ID: { input: string; output: string };
    String: { input: string; output: string };
    Boolean: { input: boolean; output: boolean };
    Int: { input: number; output: number };
    Float: { input: number; output: number };
    DateTime: { input: string; output: string };
};

export interface GqlCMutation {
    __typename?: 'Mutation';
    user: GqlCUserMutation;
    userCreate: GqlCMutationResult;
}

export type GqlCMutationUserCreateArgs = {
    user: GqlCUserCreate;
};

export interface GqlCMutationResult {
    __typename?: 'MutationResult';
    referenceId?: Maybe<Scalars['ID']['output']>;
    success: Scalars['Boolean']['output'];
}

export interface GqlCQuery {
    __typename?: 'Query';
    currentSession: GqlCSession;
}

export interface GqlCSession {
    __typename?: 'Session';
    sessionId: Scalars['ID']['output'];
    user?: Maybe<GqlCUser>;
}

export interface GqlCSubscription {
    __typename?: 'Subscription';
    generationChunkUpdates: Scalars['String']['output'];
    userUpdates: GqlCUser;
}

export type GqlCSubscriptionGenerationChunkUpdatesArgs = {
    generationId: Scalars['String']['input'];
};

export interface GqlCUser {
    __typename?: 'User';
    name: Scalars['String']['output'];
    userId: Scalars['ID']['output'];
}

export type GqlCUserCreate = {
    name: Scalars['String']['input'];
};

export interface GqlCUserMutation {
    __typename?: 'UserMutation';
    terminateSessions: GqlCMutationResult;
}

export type GqlCUserMutationTerminateSessionsArgs = {
    sessionIds: Array<Scalars['ID']['input']>;
};

export type GqlCHomePageQueryVariables = Exact<{ [key: string]: never }>;

export type GqlCHomePageQuery = { currentSession: { user: { name: string } | null } };

export const HomePageDocument = {
    kind: 'Document',
    definitions: [
        {
            kind: 'OperationDefinition',
            operation: 'query',
            name: { kind: 'Name', value: 'HomePage' },
            selectionSet: {
                kind: 'SelectionSet',
                selections: [
                    {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'currentSession' },
                        selectionSet: {
                            kind: 'SelectionSet',
                            selections: [
                                {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'user' },
                                    selectionSet: {
                                        kind: 'SelectionSet',
                                        selections: [{ kind: 'Field', name: { kind: 'Name', value: 'name' } }],
                                    },
                                },
                            ],
                        },
                    },
                ],
            },
        },
    ],
} as unknown as DocumentNode<GqlCHomePageQuery, GqlCHomePageQueryVariables>;
