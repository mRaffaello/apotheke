# apotheke

Import organizer for JavaScript and TypeScript projects. Groups, sorts, and deduplicates imports based on a simple config file.

```ts
// Before
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { createRoute } from '@tanstack/react-router';
import { tsr } from '../api/tsr';
import useLoggedUser from '../hooks/use-logged-user';

// After
// React
import { useMemo } from 'react';

// Hooks
import useLoggedUser from '../hooks/use-logged-user';

// Api
import { tsr } from '../api/tsr';
import { useQuery } from '@tanstack/react-query';

// Navigation
import { createRoute } from '@tanstack/react-router';
```

## Requirements

- Node.js ≥ 18

## Installation

```sh
npm install -D apotheke
# or
pnpm add -D apotheke
```

## Usage

```sh
apotheke --write src/**/*.{ts,tsx}     # format in place
apotheke --check src/**/*.{ts,tsx}     # CI — exit 1 if anything would change
apotheke --diff  src/**/*.{ts,tsx}     # print diff without writing
apotheke --stdin-filepath src/app.tsx  # read from stdin, write to stdout
```

## Config

Create `apotheke.config.mjs` at your project root:

```js
// apotheke.config.mjs
export default {
    groups: [
        { name: 'React', match: ['react', 'react-dom', 'react-*'] },
        { name: 'Hooks', match: ['**/hooks/**'] },
        { name: 'Api', match: ['**/api/**', '@tanstack/react-query'] },
        { name: 'Navigation', match: ['@tanstack/react-router'] },
        { name: 'Assets', match: ['lucide-react'] }
    ],
    aliases: {
        '@': './src' // mirrors tsconfig paths — auto-read if omitted
    },
    groupSeparator: true, // blank line between groups
    groupComments: true   // // GroupName header above each group
};
```

Apotheke also reads `tsconfig.json` (or `jsconfig.json`) automatically to pick up `paths` aliases and `baseUrl`, so you often don't need to set `aliases` manually.

Unmatched imports collect in an **Others** group at the end. Side-effect imports (`import './styles.css'`) always go first.

### Monorepo

Place a root config and extend it per-package:

```js
// apps/web/apotheke.config.mjs
export default {
    extends: '../../apotheke.config.mjs',
    groups: [{ name: 'Shared', match: ['@acme/*'] }]
};
```

---

## Prettier plugin

Apotheke ships as a prettier plugin. When loaded, it runs as a `preprocess` step — apotheke organises imports first, then prettier formats the result. One pass, correct order, no conflicts.

**Requirements:** Prettier v3 or later (v3 supports async `preprocess`; v2 does not).

### Permanent setup

**1. Install apotheke**

```sh
pnpm add -D apotheke
```

**2. Add the plugin to your prettier config**

```js
// .prettierrc.js
module.exports = {
    plugins: ['apotheke'],
};
```

That's it — `prettier --write` will now organise imports automatically.

### Quick test (without installing)

```sh
cd /path/to/your-project
npx prettier@3 \
  --plugin /path/to/apotheke/dist/index.js \
  --write 'src/App.tsx'
```

### VS Code on-save

Install the [Prettier - Code formatter](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) extension. Because `prettier.format()` calls our plugin's `preprocess` hook directly, no extra config is needed:

```json
{
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true
}
```

### Pre-commit with Husky + lint-staged

```json
{
    "lint-staged": {
        "*.{ts,tsx,js,jsx}": ["prettier --write"]
    }
}
```

### Prettier v2 fallback

If you can't upgrade to prettier v3, use the CLI sequentially via lint-staged:

```json
{
    "lint-staged": {
        "*.{ts,tsx,js,jsx}": [
            "apotheke --write",
            "prettier --write"
        ]
    }
}
```

---

## Testing locally without publishing

### Option 1 — Direct invocation (no setup)

```sh
node /path/to/apotheke/dist/cli.js --write 'src/**/*.{ts,tsx}'
```

Build first if needed: `cd /path/to/apotheke && pnpm build`

### Option 2 — `pnpm link` (recommended)

**In the apotheke repo:**

```sh
pnpm build
pnpm link --global
```

**In your target repo:**

```sh
pnpm link --global apotheke
```

Now `apotheke --write src/**/*.tsx` works as if it were installed normally. You'll need to re-run `pnpm build` in the apotheke repo after making source changes.

**To unlink when done:**

```sh
# In your target repo
pnpm unlink --global apotheke

# In the apotheke repo
pnpm unlink --global
```

### Option 3 — Path dependency in `package.json`

```sh
pnpm add /path/to/apotheke
```

---

## Development

```sh
pnpm install

# Build (required before running locally or testing the plugin)
pnpm build

# Run all tests (unit + e2e)
pnpm test

# Unit tests only
pnpm test:unit

# E2E tests against real repos (cloned automatically on first run)
pnpm test:e2e

# Type check
pnpm typecheck
```

### Project structure

```
src/
  parser.ts        OXC-based import extractor
  grouper.ts       Glob-based group assignment
  sorter.ts        Alphabetical sort, type imports float to top
  deduplicator.ts  Merge named/default imports from same specifier
  printer.ts       Reconstruct import block with group headers
  config.ts        Load apotheke.config.mjs, merge tsconfig aliases
  format.ts        Top-level formatImports(source, config)
  types.ts         Shared types
cli.ts             CLI source (Node.js)
index.ts           Prettier plugin + programmatic API
dist/
  cli.js           Compiled CLI — run with node or via the apotheke bin
  index.js         Compiled prettier plugin
  index.d.ts       Types for programmatic use
tests/
  unit/            76 unit tests
  e2e/             20 e2e tests against sonner and tremor
```
