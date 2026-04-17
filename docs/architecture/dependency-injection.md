# ServerRuntime

## Context

Resolver functions, commands, queries, and guards all need access to shared infrastructure: the database, pub-sub publishing, and pub-sub
subscribing. Passing these as individual parameters would create unwieldy function signatures.

## Decision

A `ServerRuntime` interface that bundles all shared infrastructure into a single dependency injection container, created once via
`serverRuntimeCreate()`.

### Interface

Defined in `src/server/domain/ServerRuntime.ts`:

```typescript
interface ServerRuntime {
  db: Database;
  subscribe: {
    to: (key: string) => AsyncIterableIterator<any>;
  };
  publish: {
    userUpdates: (args: { userId: string }) => Promise<void>;
    generationChunkUpdates: (args: { generationId: string; chunk: string }) => Promise<void>;
  };
}
```

- **`db`**: Drizzle ORM database instance for all database operations
- **`subscribe.to(key)`**: returns an async iterator for a pub-sub channel (used by subscription resolvers)
- **`publish.*`**: typed methods for publishing to specific channels (used by commands and agents)

### Factory

`serverRuntimeCreate()` in `src/server/domain/serverRuntimeCreate.ts` creates the runtime:

1. Initializes `PubSubPostgres` with the database connection
2. Wraps the pub-sub into typed `subscribe` and `publish` interfaces
3. Returns the assembled `ServerRuntime`

### Usage Pattern

`resolversCreate()` creates a single `ServerRuntime` instance and passes it to all resolver functions:

```typescript
const serverRuntime = serverRuntimeCreate();
return {
  Query: {
    session: (_, __, ctx) => sessionFindOne(serverRuntime, ctx),
  },
  Mutation: {
    doSomething: (_, args, ctx) => someCommand(serverRuntime, args, ctx),
  },
};
```

Commands and queries receive `serverRuntime` as their first argument.

### Key Files

- `src/server/domain/ServerRuntime.ts` — interface definition
- `src/server/domain/serverRuntimeCreate.ts` — factory function
- `src/server/graphql/resolversCreate.ts` — where the runtime is created and distributed

## Alternatives Considered

- **Global singletons**: Simpler but harder to test and makes dependencies invisible
- **GraphQL context**: Apollo context is per-request; ServerRuntime is per-process (pub-sub connections and the database pool should not be
  recreated per request)
- **Dependency injection framework**: Overkill for the current scope; a plain factory function is sufficient

## Consequences

- All shared infrastructure is discoverable through one interface
- Adding a new shared dependency means extending the `ServerRuntime` interface and updating `serverRuntimeCreate()`
- The runtime is created once at server startup (inside `resolversCreate()`), so state like pub-sub connections is shared across all
  requests
