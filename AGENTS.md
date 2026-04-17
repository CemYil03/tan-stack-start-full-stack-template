# Agents

## Prime Directive

**Follow the docs. Update the docs.**

Before writing any code, read the relevant documentation in `docs/`. After implementing a feature or refactoring, update the docs to reflect
the change. Drift between docs and code is a bug.

## Before You Start

1. Read `docs/conventions.md` — follow every convention without exception
2. Read `docs/documentation.md` — understand where docs live and what goes where
3. Read the relevant `docs/architecture/*.md` files for the area you are working in
4. Read `docs/infrastructure.md` if your change affects deployment, CI, or environment variables

## Conventions (Summary)

These are non-negotiable. The full details are in `docs/conventions.md`.

- **Package manager**: npm only. Never use yarn or pnpm.
- **Naming**: entity-action (`sessionUpsert`, `userFindOne`, `toGqlSession`, `guardUserSubscription`)
- **Generated files — do not edit**: `src/routeTree.gen.ts`, `src/server/graphql/generated.ts`, `src/web/graphql/generated.ts`, `drizzle/`
- **Icons**: Lucide React only (`lucide-react`)
- **UI components**: base primitives in `src/web/components/base/`, app components in `src/web/components/`
- **Class merging**: use `cn()` from `src/web/utils/cn.ts`
- **GraphQL schema**: SDL-first in `src/server/graphql/schema.graphqls`. Run `npm run graphql:generate` after any schema change.
- **Resolver wiring**: all in `src/server/graphql/resolversCreate.ts` — the only file that imports from commands/, queries/, and guards/
- **Quality checks**: run `npm run check` before considering any task complete

## Architecture at a Glance

| Concern               | Pattern                                                     | Key Files                                  |
| --------------------- | ----------------------------------------------------------- | ------------------------------------------ |
| Server-side structure | CQRS — commands/, queries/, mappers/                        | `docs/architecture/server-architecture.md` |
| Dependency injection  | ServerRuntime container                                     | `src/server/domain/ServerRuntime.ts`       |
| Authentication        | Cookie-based automatic sessions                             | `src/server/commands/sessionUpsert.ts`     |
| Authorization         | Guard functions (`guard{Entity}{Ctx}`)                      | `src/server/guards/`                       |
| GraphQL               | SDL-first, Apollo Server v5, URQL client                    | `src/server/graphql/schema.graphqls`       |
| Real-time             | Subscriptions over SSE, PostgreSQL NOTIFY/LISTEN            | `src/server/graphql/PubSubPostgres.ts`     |
| Background jobs       | pg-boss via `serverRuntime.jobs.enqueue()`                  | `docs/architecture/jobs.md`                |
| Code generation       | `npm run graphql:generate` — server `GqlS*`, client `GqlC*` | `codegen.ts`                               |

## How to Add Things

### New Database Table

1. Define in `src/server/db/schema.ts` with `pgTable()`
2. Export inferred types: `type Foo = typeof foo.$inferSelect`, `type FooCreate = typeof foo.$inferInsert`
3. Generate migration: `npm run db:generate`
4. Apply migration: `npm run db:migrate` (or `npm run db:push` for quick dev iteration)

### New GraphQL Operation

1. Add types/fields to `src/server/graphql/schema.graphqls`
2. Run `npm run graphql:generate`
3. Implement the command (mutation) or query in `src/server/commands/` or `src/server/queries/`
4. Add a mapper in `src/server/mappers/` if transforming DB types to GraphQL types
5. Wire the resolver in `src/server/graphql/resolversCreate.ts`
6. For protected operations, add a guard in `src/server/guards/` and call it in the resolver
7. Add the client-side `.graphql` operation file alongside the route or component

### New Feature

1. Implement following the patterns above
2. Create a feature doc in `docs/features/{feature-name}.md` covering: user behavior, options considered, option chosen, implementation
   details

### New Architectural Decision

1. Create a doc in `docs/architecture/{decision-name}.md` covering: context, decision, alternatives considered, consequences

## Documentation Update Rules

You MUST update documentation when any of the following occur:

| What Changed                          | What to Update                               |
| ------------------------------------- | -------------------------------------------- |
| New feature implemented               | Add `docs/features/{feature}.md`             |
| New convention established            | Update `docs/conventions.md`                 |
| New architectural pattern introduced  | Add `docs/architecture/{pattern}.md`         |
| Existing architecture changed         | Update the relevant `docs/architecture/*.md` |
| Deployment or CI changed              | Update `docs/infrastructure.md`              |
| File renamed, moved, or deleted       | Update any doc that references it            |
| Environment variable added or changed | Update `docs/infrastructure.md`              |

If you are unsure whether a doc needs updating, it does.

## Project Structure

```txt
src/
├── routes/                     TanStack Router route definitions
│   ├── __root.tsx              Root layout
│   ├── index.tsx               Home page
│   └── api/
│       ├── graphql.ts          POST /api/graphql (queries, mutations)
│       └── stream.ts           POST /api/stream (subscriptions via SSE)
├── server/
│   ├── agents/                 AI agents
│   ├── commands/               Write operations (mutations)
│   ├── queries/                Read operations
│   ├── mappers/                DB-to-GraphQL transformations
│   ├── guards/                 Authorization guard functions
│   ├── db/
│   │   └── schema.ts           Drizzle table definitions
│   ├── domain/
│   │   ├── ServerRuntime.ts    DI container interface
│   │   └── serverRuntimeCreate.ts
│   ├── graphql/
│   │   ├── schema.graphqls     SDL schema (source of truth)
│   │   ├── resolversCreate.ts  Resolver wiring (single entry point)
│   │   ├── extensions.ts       Union/interface __resolveType
│   │   ├── server.ts           Apollo Server setup
│   │   ├── PubSubPostgres.ts   PostgreSQL pub-sub
│   │   └── generated.ts        Generated types (DO NOT EDIT)
│   ├── jobs/
│   │   ├── boss.ts             pg-boss singleton + jobEnqueue
│   │   ├── index.ts            Worker registration, handler re-exports
│   │   ├── types.ts            Job type definitions
│   │   ├── jobDefinitions.ts   Central job registry
│   │   └── handlers/           Job handler implementations
│   └── utils/
├── web/
│   ├── components/
│   │   ├── base/               Radix/shadcn primitives
│   ├── graphql/
│   │   ├── client.ts           URQL client config
│   │   └── generated.ts        Generated types (DO NOT EDIT)
│   ├── hooks/                  Shared React hooks
│   └── utils/
│       └── cn.ts               Class name merging
├── router.tsx
├── routeTree.gen.ts            Generated (DO NOT EDIT)
└── styles.css
```

## Tech Stack

- **Runtime**: Node.js, TypeScript 6
- **Frontend**: React 19, TanStack Router + Start, URQL, Tailwind CSS 4, shadcn/Radix UI
- **Backend**: Apollo Server 5, Drizzle ORM, PostgreSQL
- **Real-time**: graphql-sse (SSE), PostgreSQL NOTIFY/LISTEN
- **Validation**: Zod 4
- **AI**: Vercel AI SDK
- **Testing**: Vitest, Playwright
- **Build**: Vite 8
- **CI**: GitHub Actions
- **Deployment**: Docker via Coolify
