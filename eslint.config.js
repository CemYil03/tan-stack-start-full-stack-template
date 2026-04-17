//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier/recommended';

export default [
    ...tanstackConfig,
    {
        rules: {
            'import/no-cycle': 'off',
            'import/order': 'off',
            'sort-imports': 'off',
            '@typescript-eslint/array-type': 'off',
            '@typescript-eslint/require-await': 'off',
            'pnpm/json-enforce-catalog': 'off',
            'no-restricted-imports': [
                'error',
                {
                    patterns: [
                        {
                            group: ['lucide-react'],
                            importNamePattern: '^(?!.*Icon$)(?!type )',
                            message: 'Use the Icon-suffixed variant from lucide-react (e.g., CheckIcon instead of Check).',
                        },
                    ],
                },
            ],
        },
    },
    prettierConfig,
    prettierPlugin,
    {
        ignores: [
            'eslint.config.js',
            'prettier.config.ts',
            'src/server/graphql/generated.ts',
            'src/web/graphql/generated.ts',
            'storybook-static',
        ],
    },
];
