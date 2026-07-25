import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import globals from 'globals';

const nodeFiles = ['packages/apotheke/**/*.{js,ts}', '**/*.config.{js,cjs,mjs,ts}'];
const reactFiles = ['apps/docs/**/*.{jsx,tsx}'];

export default tseslint.config(
    {
        ignores: [
            '**/node_modules/**',
            '**/dist/**',
            '**/.next/**',
            '**/out/**',
            '**/.source/**',
            '**/.turbo/**',
            'packages/apotheke/tests/e2e/repos/**'
        ]
    },
    ...tseslint.configs.recommended,
    {
        files: nodeFiles,
        languageOptions: {
            globals: globals.node
        }
    },
    {
        files: ['**/*.config.{js,cjs,mjs}'],
        rules: {
            '@typescript-eslint/no-require-imports': 'off'
        }
    },
    {
        files: reactFiles,
        plugins: {
            react: reactPlugin,
            'react-hooks': reactHooksPlugin
        },
        languageOptions: {
            globals: { ...globals.browser, ...globals['shared-node-browser'] }
        },
        rules: {
            '@typescript-eslint/no-unused-vars': [
                'error',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
            ],
            'react/display-name': 'warn',
            'react/jsx-key': 'error',
            'react/no-unknown-property': 'error',
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off',
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn'
        },
        settings: {
            react: { version: 'detect' }
        }
    }
);
