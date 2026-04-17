import type { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import * as z from 'zod';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
    ID: { input: string; output: string };
    String: { input: string; output: string };
    Boolean: { input: boolean; output: boolean };
    Int: { input: number; output: number };
    Float: { input: number; output: number };
    DateTime: { input: Date; output: Date };
};

export interface GqlSMutation {
    __typename?: 'Mutation';
    user: GqlSUserMutation;
    userCreate: GqlSMutationResult;
}

export type GqlSMutationUserCreateArgs = {
    user: GqlSUserCreate;
};

export interface GqlSMutationResult {
    __typename?: 'MutationResult';
    referenceId?: Maybe<Scalars['ID']['output']>;
    success: Scalars['Boolean']['output'];
}

export interface GqlSQuery {
    __typename?: 'Query';
    currentSession: GqlSSession;
}

export interface GqlSSession {
    __typename?: 'Session';
    sessionId: Scalars['ID']['output'];
    user?: Maybe<GqlSUser>;
}

export interface GqlSSubscription {
    __typename?: 'Subscription';
    generationChunkUpdates: Scalars['String']['output'];
    userUpdates: GqlSUser;
}

export type GqlSSubscriptionGenerationChunkUpdatesArgs = {
    generationId: Scalars['String']['input'];
};

export interface GqlSUser {
    __typename?: 'User';
    name: Scalars['String']['output'];
    userId: Scalars['ID']['output'];
}

export type GqlSUserCreate = {
    name: Scalars['String']['input'];
};

export interface GqlSUserMutation {
    __typename?: 'UserMutation';
    terminateSessions: GqlSMutationResult;
}

export type GqlSUserMutationTerminateSessionsArgs = {
    sessionIds: Array<Scalars['ID']['input']>;
};

export type WithIndex<TObject> = TObject & Record<string, any>;
export type ResolversObject<TObject> = WithIndex<TObject>;

export type ResolverTypeWrapper<T> = Promise<T> | T;

export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
    resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<
    TResult,
    TParent = Record<PropertyKey, never>,
    TContext = Record<PropertyKey, never>,
    TArgs = Record<PropertyKey, never>,
> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
    parent: TParent,
    args: TArgs,
    context: TContext,
    info: GraphQLResolveInfo,
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
    parent: TParent,
    args: TArgs,
    context: TContext,
    info: GraphQLResolveInfo,
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
    parent: TParent,
    args: TArgs,
    context: TContext,
    info: GraphQLResolveInfo,
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
    subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
    resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
    subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
    resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
    | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
    | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<
    TResult,
    TKey extends string,
    TParent = Record<PropertyKey, never>,
    TContext = Record<PropertyKey, never>,
    TArgs = Record<PropertyKey, never>,
> =
    | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
    | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>> = (
    parent: TParent,
    context: TContext,
    info: GraphQLResolveInfo,
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>> = (
    obj: T,
    context: TContext,
    info: GraphQLResolveInfo,
) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<
    TResult = Record<PropertyKey, never>,
    TParent = Record<PropertyKey, never>,
    TContext = Record<PropertyKey, never>,
    TArgs = Record<PropertyKey, never>,
> = (
    next: NextResolverFn<TResult>,
    parent: TParent,
    args: TArgs,
    context: TContext,
    info: GraphQLResolveInfo,
) => TResult | Promise<TResult>;

/** Mapping between all available schema types and the resolvers types */
export type GqlSResolversTypes = ResolversObject<{
    Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
    DateTime: ResolverTypeWrapper<Scalars['DateTime']['output']>;
    ID: ResolverTypeWrapper<Scalars['ID']['output']>;
    Mutation: ResolverTypeWrapper<Record<PropertyKey, never>>;
    MutationResult: ResolverTypeWrapper<GqlSMutationResult>;
    Query: ResolverTypeWrapper<Record<PropertyKey, never>>;
    Session: ResolverTypeWrapper<GqlSSession>;
    String: ResolverTypeWrapper<Scalars['String']['output']>;
    Subscription: ResolverTypeWrapper<Record<PropertyKey, never>>;
    User: ResolverTypeWrapper<GqlSUser>;
    UserCreate: GqlSUserCreate;
    UserMutation: ResolverTypeWrapper<GqlSUserMutation>;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type GqlSResolversParentTypes = ResolversObject<{
    Boolean: Scalars['Boolean']['output'];
    DateTime: Scalars['DateTime']['output'];
    ID: Scalars['ID']['output'];
    Mutation: Record<PropertyKey, never>;
    MutationResult: GqlSMutationResult;
    Query: Record<PropertyKey, never>;
    Session: GqlSSession;
    String: Scalars['String']['output'];
    Subscription: Record<PropertyKey, never>;
    User: GqlSUser;
    UserCreate: GqlSUserCreate;
    UserMutation: GqlSUserMutation;
}>;

export interface GqlSDateTimeScalarConfig extends GraphQLScalarTypeConfig<GqlSResolversTypes['DateTime'], any> {
    name: 'DateTime';
}

export type GqlSMutationResolvers<
    ContextType = any,
    ParentType extends GqlSResolversParentTypes['Mutation'] = GqlSResolversParentTypes['Mutation'],
> = ResolversObject<{
    user?: Resolver<GqlSResolversTypes['UserMutation'], ParentType, ContextType>;
    userCreate?: Resolver<GqlSResolversTypes['MutationResult'], ParentType, ContextType, RequireFields<GqlSMutationUserCreateArgs, 'user'>>;
}>;

export type GqlSMutationResultResolvers<
    ContextType = any,
    ParentType extends GqlSResolversParentTypes['MutationResult'] = GqlSResolversParentTypes['MutationResult'],
> = ResolversObject<{
    referenceId?: Resolver<Maybe<GqlSResolversTypes['ID']>, ParentType, ContextType>;
    success?: Resolver<GqlSResolversTypes['Boolean'], ParentType, ContextType>;
}>;

export type GqlSQueryResolvers<
    ContextType = any,
    ParentType extends GqlSResolversParentTypes['Query'] = GqlSResolversParentTypes['Query'],
> = ResolversObject<{
    currentSession?: Resolver<GqlSResolversTypes['Session'], ParentType, ContextType>;
}>;

export type GqlSSessionResolvers<
    ContextType = any,
    ParentType extends GqlSResolversParentTypes['Session'] = GqlSResolversParentTypes['Session'],
> = ResolversObject<{
    sessionId?: Resolver<GqlSResolversTypes['ID'], ParentType, ContextType>;
    user?: Resolver<Maybe<GqlSResolversTypes['User']>, ParentType, ContextType>;
}>;

export type GqlSSubscriptionResolvers<
    ContextType = any,
    ParentType extends GqlSResolversParentTypes['Subscription'] = GqlSResolversParentTypes['Subscription'],
> = ResolversObject<{
    generationChunkUpdates?: SubscriptionResolver<
        GqlSResolversTypes['String'],
        'generationChunkUpdates',
        ParentType,
        ContextType,
        RequireFields<GqlSSubscriptionGenerationChunkUpdatesArgs, 'generationId'>
    >;
    userUpdates?: SubscriptionResolver<GqlSResolversTypes['User'], 'userUpdates', ParentType, ContextType>;
}>;

export type GqlSUserResolvers<
    ContextType = any,
    ParentType extends GqlSResolversParentTypes['User'] = GqlSResolversParentTypes['User'],
> = ResolversObject<{
    name?: Resolver<GqlSResolversTypes['String'], ParentType, ContextType>;
    userId?: Resolver<GqlSResolversTypes['ID'], ParentType, ContextType>;
}>;

export type GqlSUserMutationResolvers<
    ContextType = any,
    ParentType extends GqlSResolversParentTypes['UserMutation'] = GqlSResolversParentTypes['UserMutation'],
> = ResolversObject<{
    terminateSessions?: Resolver<
        GqlSResolversTypes['MutationResult'],
        ParentType,
        ContextType,
        RequireFields<GqlSUserMutationTerminateSessionsArgs, 'sessionIds'>
    >;
}>;

export type GqlSResolvers<ContextType = any> = ResolversObject<{
    DateTime?: GraphQLScalarType;
    Mutation?: GqlSMutationResolvers<ContextType>;
    MutationResult?: GqlSMutationResultResolvers<ContextType>;
    Query?: GqlSQueryResolvers<ContextType>;
    Session?: GqlSSessionResolvers<ContextType>;
    Subscription?: GqlSSubscriptionResolvers<ContextType>;
    User?: GqlSUserResolvers<ContextType>;
    UserMutation?: GqlSUserMutationResolvers<ContextType>;
}>;

type Properties<T> = {
    [K in keyof T]: z.ZodType<T[K], T[K] | undefined>;
};

type definedNonNullAny = {};

export const isDefinedNonNullAny = (v: any): v is definedNonNullAny => v !== undefined && v !== null;

export const definedNonNullAnySchema = z.any().refine((v) => isDefinedNonNullAny(v));

export function GqlSUserCreateSchema(): z.ZodObject<Properties<GqlSUserCreate>> {
    return z.object({
        name: z.string(),
    });
}
