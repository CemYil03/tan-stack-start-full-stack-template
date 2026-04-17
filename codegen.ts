import type { CodegenConfig } from '@graphql-codegen/cli';

// Shared config to keep server and client types in sync (reduces drift where base types are duplicated)
const sharedConfig = {
    useTypeImports: true,
    scalars: {
        ID: { input: 'string', output: 'string' },
        Date: { input: 'string', output: 'string' },
        DateTime: { input: 'string', output: 'string' },
    },
};

const config: CodegenConfig = {
    overwrite: true,
    schema: 'src/server/graphql/schema.graphqls',
    ignoreNoDocuments: true,
    hooks: { afterAllFileWrite: ['prettier --write'] },
    generates: {
        // Server: base schema types + resolver types (Resolvers, *Resolvers, ResolversTypes, etc.)
        'src/server/graphql/generated.ts': {
            documents: ['src/graphql/schema.graphqls'],
            plugins: ['typescript', 'typescript-resolvers', 'typescript-validation-schema'],
            config: {
                useTypeImports: true,
                declarationKind: { type: 'interface' },
                useIndexSignature: true,
                typesPrefix: 'GqlS',
                enumsAsTypes: true,
                scalars: {
                    ID: { input: 'string', output: 'string' },
                    Date: { input: 'string', output: 'string' },
                    DateTime: { input: 'Date', output: 'Date' },
                },
                schema: 'zodv4',
                withDescriptions: true,
            },
        },
        // Client: base schema types + operation types + TypedDocumentNode
        'src/web/graphql/generated.ts': {
            documents: ['src/routes/**/*.graphql', 'src/web/components/**/*.graphql'],
            plugins: ['typescript', 'typescript-operations', 'typed-document-node'],
            config: {
                ...sharedConfig,
                inlineFragmentTypes: 'inline',
                typesPrefix: 'GqlC',
                declarationKind: { type: 'interface' },
                enumsAsTypes: true,
            },
        },
    },
};

export default config;
