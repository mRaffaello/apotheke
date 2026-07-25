# apotheke

**Prettier for imports.** Deterministic, configurable import organization for
JavaScript and TypeScript — as a Prettier plugin or a standalone CLI.

📖 **[Documentation](https://marcoraffaello.com/apotheke)**

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

apotheke is not a replacement for Prettier — it runs _inside_ Prettier as a
`preprocess` plugin, so one `prettier --write` organises imports and formats
code in a single pass.

## Installation

```sh
pnpm add -D apotheke
```

Requires Node.js ≥ 18, and Prettier ≥ 3 if you use the plugin.

## Usage

Describe the groups you want in `apotheke.config.mjs`:

```js
export default {
    groups: [
        { name: 'React', match: ['react', 'react-dom'] },
        { name: 'Hooks', match: ['**/hooks/**'] },
        { name: 'Api', match: ['**/api/**', '@tanstack/react-query'] },
        { name: 'Navigation', match: ['@tanstack/react-router'] }
    ]
};
```

Then either add the Prettier plugin — apotheke must be **last** in the array:

```json
{ "plugins": ["apotheke"] }
```

or use the CLI:

```sh
apotheke --write 'src/**/*.{ts,tsx}'   # rewrite in place
apotheke --check 'src/**/*.{ts,tsx}'   # CI — exit 1 if anything would change
apotheke --diff  'src/**/*.{ts,tsx}'   # preview without writing
```

Groups are matched in order and the first match wins. Unmatched imports collect
in a trailing `Others` group; side-effect imports always come first. Imports are
sorted and deduplicated within each group, and `tsconfig.json` path aliases are
read automatically.

## Documentation

Full guides and reference at
**[marcoraffaello.com/apotheke](https://marcoraffaello.com/apotheke)**:

- [Configuring groups](https://marcoraffaello.com/apotheke/docs/guides/groups)
- [Aliases and tsconfig paths](https://marcoraffaello.com/apotheke/docs/guides/aliases)
- [Monorepos](https://marcoraffaello.com/apotheke/docs/guides/monorepos)
- [Prettier plugin](https://marcoraffaello.com/apotheke/docs/guides/prettier-plugin)
- [Config reference](https://marcoraffaello.com/apotheke/docs/reference/config)

## Agent skill

This package ships a `SKILL.md` that teaches a coding agent to scan your
codebase, propose a group config and wire everything up:

```sh
mkdir -p .claude/skills/setup-apotheke
cp node_modules/apotheke/SKILL.md .claude/skills/setup-apotheke/SKILL.md
```

## Development

This repository is a pnpm workspace. The published package lives in
`packages/apotheke`, the documentation site in `apps/docs`.

```sh
pnpm install
pnpm build            # build the package (required before format and dogfooding)
pnpm test             # unit + e2e
pnpm docs:dev         # run the documentation site locally
```

## License

MIT © Marco Raffaello
