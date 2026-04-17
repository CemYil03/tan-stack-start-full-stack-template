import { readFileSync } from 'node:fs';
import { ApolloServer } from '@apollo/server';
import { parse, subscribe } from 'graphql';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { resolversCreate } from './resolversCreate';
import { ensureJobsStarted } from '../jobs';
import type { GqlSSession } from './generated';
import { serverRuntimeCreate } from '../domain/serverRuntimeCreate';

const serverRuntime = serverRuntimeCreate();

export const graphqlSchema = makeExecutableSchema({
    typeDefs: readFileSync('src/server/graphql/schema.graphqls', { encoding: 'utf-8' }),
    resolvers: resolversCreate(serverRuntime),
});

const graphqlServer = new ApolloServer({ schema: graphqlSchema });

let serverStarted = false;

async function ensureServerStarted() {
    if (!serverStarted) {
        await graphqlServer.start();
        await ensureJobsStarted(serverRuntime);
        serverStarted = true;
    }
}

export async function executeGraphQLQuery(
    query: string,
    variables: Record<string, any>,
    session: GqlSSession,
): Promise<{ data?: any; errors?: any }> {
    await ensureServerStarted();

    const result = await graphqlServer.executeOperation({ query, variables }, { contextValue: session });

    // Format response for URQL (URQL expects { data, errors } format)
    // Apollo Server v5 returns result.body which can be a single result or incremental
    let responseBody: { data?: any; errors?: any } = {};

    if (result.body.kind === 'single') {
        responseBody = {
            data: result.body.singleResult.data,
            errors: result.body.singleResult.errors,
        };
    } else {
        // For incremental results, we'll just send the first chunk
        // This shouldn't happen for regular queries/mutations
        responseBody = {
            data: null,
            errors: [{ message: 'Unexpected incremental response format' }],
        };
    }

    return responseBody;
}

export async function executeGraphQLSubscription(
    query: string,
    variables: Record<string, any>,
    session: GqlSSession,
): Promise<AsyncIterableIterator<any>> {
    // Parse the GraphQL query string into a DocumentNode
    const document = parse(query);

    // Execute subscription using GraphQL's subscribe function
    // This will use the Subscription resolvers from the schema
    const result = await subscribe({
        schema: graphqlSchema,
        document,
        variableValues: variables,
        contextValue: session,
    });

    // Handle different result types
    if (result instanceof Error) {
        throw result;
    }

    // If it's an async iterable, return it
    if (Symbol.asyncIterator in result) {
        return result as AsyncIterableIterator<any>;
    }

    // If it's a single result (shouldn't happen for subscriptions, but handle it)
    throw new Error('Subscription did not return an async iterable');
}
