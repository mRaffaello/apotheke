<p align="left">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/mRaffaello/apotheke/main/apps/docs/public/wordmark-dark.png" />
    <img alt="apotheke" src="https://raw.githubusercontent.com/mRaffaello/apotheke/main/apps/docs/public/wordmark.png" width="320" />
  </picture>
</p>

<p align="left">
  <em>Deterministic import organization for JavaScript and TypeScript.</em>
</p>

<p align="left">
  <a href="https://www.npmjs.com/package/apotheke">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/group/npm/apotheke+npm/dm/apotheke+bundlephobia/minzip/apotheke+npm/types/apotheke+github/ci/mRaffaello/apotheke+github/license/mRaffaello/apotheke.svg?variant=secondary&mode=dark" />
      <img alt="npm version, monthly downloads, minzipped size, TypeScript types, CI status, MIT license" src="https://shieldcn.dev/group/npm/apotheke+npm/dm/apotheke+bundlephobia/minzip/apotheke+npm/types/apotheke+github/ci/mRaffaello/apotheke+github/license/mRaffaello/apotheke.svg?variant=secondary&mode=light" />
    </picture>
  </a>
</p>

**Prettier for imports.** You describe the groups your codebase actually has —
apotheke sorts every import into them, the same way, in every file. Run it as a
Prettier plugin or as a standalone CLI.

📖 **[Read the documentation →](https://marcoraffaello.com/apotheke)**

## The idea

Import blocks rot. apotheke rewrites them from your config, not from a fixed
opinion about what "correct" order means:

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

Note what that example does: `../api/tsr` and `@tanstack/react-query` land in
the same group. Grouping is by **role in your app**, not by whether a module is
local or comes from `node_modules`.

apotheke is not a replacement for Prettier — it runs _inside_ Prettier as a
`preprocess` plugin, so one `prettier --write` organises imports and formats
code in a single pass.

## Install

```sh
pnpm add -D apotheke
```

Requires Node.js ≥ 18, and Prettier ≥ 3 if you use the plugin.

## Configure

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

## Run it

**As a Prettier plugin** — apotheke must be **last** in the array:

```json
{ "plugins": ["apotheke"] }
```

Covers the `typescript`, `babel`, `babel-ts` and `babel-flow` parsers.

**As a CLI:**

```sh
apotheke --write 'src/**/*.{ts,tsx}'   # rewrite in place
apotheke --check 'src/**/*.{ts,tsx}'   # CI — exit 1 if anything would change
apotheke --diff  'src/**/*.{ts,tsx}'   # preview without writing
```

## How grouping works

- Groups are matched **in order**, and the first match wins.
- Side-effect imports (`import './styles.css'`) always come first.
- Anything unmatched collects in a trailing `Others` group.
- Within a group, imports are sorted alphabetically, `import type` first, and
  duplicate specifiers are merged.
- Named specifiers inside a statement are sorted too, types first.
- `tsconfig.json` `paths` and `baseUrl` are read automatically, so `@/hooks/…`
  matches a `**/hooks/**` pattern without extra configuration.

## Configuration reference

| Option           | Type                     | Description                                                                       |
| ---------------- | ------------------------ | --------------------------------------------------------------------------------- |
| `groups`         | `{ name, match[] }[]`    | Ordered group definitions. Required.                                              |
| `extends`        | `string`                 | Path to a base config to merge with — same-name groups override, new ones append. |
| `aliases`        | `Record<string, string>` | Extra path aliases, merged over the ones from `tsconfig.json`.                    |
| `baseUrl`        | `string`                 | Root for alias resolution. Defaults to the `tsconfig.json` value.                 |
| `groupSeparator` | `boolean`                | Blank line between groups.                                                        |
| `groupComments`  | `boolean`                | Emit the `// GroupName` comment above each group.                                 |

Full reference: **[marcoraffaello.com/apotheke/docs/reference/config](https://marcoraffaello.com/apotheke/docs/reference/config)**

## Documentation

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

Issues and pull requests are welcome at
[github.com/mRaffaello/apotheke](https://github.com/mRaffaello/apotheke).

## License

MIT © Marco Raffaello
