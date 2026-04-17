# API Layer

## Context

The application needs a type-safe API layer serving both queries/mutations and real-time subscriptions, with shared types between server and
client. Route loaders must also access the API during SSR with full session/cookie continuity.

## Decision

SDL-first GraphQL schema with Apollo Server (server), URQL (client), and GraphQL Code Generator for type safety.

### Schema

The schema is defined in `src/server/graphql/schema.graphqls` as a single SDL file. This is the single source of truth — all generated types
derive from it.

### Server (Apollo Server v5)

Apollo Server is set up in `src/server/graphql/server.ts` with two execution paths:

- `executeGraphQLQuery()` — for queries and mutations (via Apollo's `executeOperation`)
- `executeGraphQLSubscription()` — for subscriptions (via GraphQL's `subscribe()` directly, bypassing Apollo since Apollo Server does not
  handle subscriptions natively)

The schema is built with `@graphql-tools/schema` (`makeExecutableSchema`) combining the SDL and resolvers from `resolversCreate()`.

### Client (URQL)

URQL is configured in `src/web/graphql/client.ts` with:

- **POST-only fetch**: all operations use POST (custom fetch converts any GET-style requests)
- **SSE subscription exchange**: subscriptions connect to `/api/stream` via `graphql-sse`
- **`cache-first` request policy**: reduces redundant network requests

### Code Generation

`npm run graphql:generate` runs `@graphql-codegen/cli` with the config in `codegen.ts`:

| Output                            | Prefix  | Plugins                                                                    |
| --------------------------------- | ------- | -------------------------------------------------------------------------- |
| `src/server/graphql/generated.ts` | `GqlS*` | `typescript`, `typescript-resolvers`, `typescript-validation-schema` (Zod) |
| `src/web/graphql/generated.ts`    | `GqlC*` | `typescript`, `typescript-operations`, `typed-document-node`               |

Server types include resolver type definitions and Zod validation schemas. Client types include operation types and `TypedDocumentNode` for
type-safe URQL hooks.

### Union and Interface Resolution

`src/server/graphql/extensions.ts` uses TypeScript module augmentation to add `__resolveType` functions to generated types:

```typescript
import './generated';

declare module './generated' {
  // Add __resolveType to union/interface types here
}
```

This keeps resolution logic separate from the main resolver file.

### API Routes

- `POST /api/graphql` — handles queries and mutations (`src/routes/api/graphql.ts`)
- `POST /api/stream` — handles subscriptions via SSE (`src/routes/api/stream.ts`)

Both routes upsert the session and pass it as Apollo context.

## SSR Data Loading

TanStack Start route loaders run on both server (SSR) and client (navigation). The GraphQL layer needs to be accessible from loaders with
full session continuity — cookies must flow from the incoming request to the GraphQL endpoint, and any `Set-Cookie` responses must propagate
back to the browser.

### Usage

```ts
import { routeLoaderGraphqlClient } from '../web/graphql/routeLoaderGraphqlClient';
import { HomePageDocument } from '../web/graphql/generated';

export const Route = createFileRoute('/')({
  loader: routeLoaderGraphqlClient(HomePageDocument),
  component() {
    const loaderData = Route.useLoaderData();
    // loaderData is fully typed as GqlCHomePageQuery
  },
});
```

For queries with variables:

```ts
loader: ({ params }) => routeLoaderGraphqlClient(SomeDocument)(params),
```

### Isomorphic Execution

| Environment | Execution path                                 | Why                                                                |
| ----------- | ---------------------------------------------- | ------------------------------------------------------------------ |
| Server      | `fetch('/api/graphql')` with forwarded headers | Session middleware runs, Set-Cookie propagates to the SSR response |
| Client      | `urqlClientSimple.query()`                     | Browser has cookies, avoids unnecessary RPC hop                    |

Uses `createIsomorphicFn()` from TanStack Start to split execution by environment.

### Session & Cookie Handover

During SSR, the original client request's cookies are forwarded to the internal GraphQL fetch. Any `Set-Cookie` headers returned by the
GraphQL endpoint (e.g., new session creation) are propagated back to the SSR response using `response.headers.getSetCookie()` (iterates each
cookie individually to avoid corruption from comma-joining).

### Header Forwarding

The server path forwards an explicit allowlist of client headers to the internal GraphQL request:

- `cookie` — session authentication
- `user-agent` — analytics, bot detection
- `accept-language` — i18n
- `x-forwarded-for`, `x-real-ip` — rate limiting, geo
- `origin`, `referer` — CSRF, analytics

Headers like `host`, `content-length`, and `connection` are intentionally excluded to avoid breaking the internal fetch.

### Print Caching

`print(document)` serializes the AST to a query string. Since route documents are static module-level constants, a
`WeakMap<DocumentNode, string>` cache ensures `print()` runs once per document for the lifetime of the process.

### Type Safety Chain

```
.graphql file
  → npm run graphql:generate
    → TypedDocumentNode<GqlCFooQuery, GqlCFooQueryVariables>
      → routeLoaderGraphqlClient(FooDocument) returns () => Promise<GqlCFooQuery>
        → Route.useLoaderData() infers GqlCFooQuery
```

### Error Handling

1. Non-2xx HTTP status — throws before JSON parsing
2. GraphQL `errors` array — throws with first error message
3. Missing `data` field — throws explicit error

## Alternatives Considered

- **Code-first schema (e.g., Pothos, Nexus)**: Better colocation with resolvers but adds a build step and hides the schema shape
- **tRPC**: No schema file at all but loses the GraphQL ecosystem (subscriptions, tooling, introspection)
- **Relay client**: More opinionated pagination and caching but heavier setup; URQL is lighter and sufficient
- **Direct resolver calls in loaders** (SSR): Avoids the HTTP round-trip but couples the SSR layer to resolver internals, requires
  replicating session/auth logic, and prevents splitting the GraphQL server into its own service later
- **`createServerFn` (server-only)** (SSR): Simpler but forces client-side navigation through TanStack's RPC layer instead of fetching
  GraphQL directly, adding an unnecessary hop

## Consequences

- Schema changes require running `npm run graphql:generate` before types are updated
- Two separate generated files (server/client) with distinct prefixes prevent accidental cross-imports
- Apollo Server does not natively support subscriptions, so the subscription path uses `graphql`'s `subscribe()` directly
- Every SSR page load makes an internal HTTP request to itself — negligible latency (localhost) but worth knowing for debugging
- The header forwarding allowlist must be maintained if new headers become relevant to resolvers
- `urqlClientSimple` has no cache exchange — each client-side navigation re-fetches. This is intentional (fresh data) but means two routes
  sharing a query will double-fetch

## Key Files

- `src/server/graphql/schema.graphqls` — SDL schema (source of truth)
- `src/server/graphql/resolversCreate.ts` — resolver wiring
- `src/server/graphql/extensions.ts` — union/interface `__resolveType`
- `src/server/graphql/server.ts` — Apollo Server setup and execution helpers
- `src/server/graphql/generated.ts` — generated server types (do not edit)
- `src/web/graphql/generated.ts` — generated client types (do not edit)
- `src/web/graphql/client.ts` — URQL client configuration
- `src/web/graphql/routeLoaderGraphqlClient.ts` — isomorphic SSR/client GraphQL loader
- `codegen.ts` — code generation configuration
