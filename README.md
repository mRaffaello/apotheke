<p align="left">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/header/graph.svg?title=apotheke&subtitle=Deterministic%20import%20organization%20for%20JavaScript%20and%20TypeScript&logo=https://raw.githubusercontent.com/mRaffaello/apotheke/main/apps/docs/public/mark-dark.png&align=left&font=geist&mode=dark" />
    <img alt="apotheke — deterministic import organization for JavaScript and TypeScript" src="https://shieldcn.dev/header/graph.svg?title=apotheke&subtitle=Deterministic%20import%20organization%20for%20JavaScript%20and%20TypeScript&logo=https://raw.githubusercontent.com/mRaffaello/apotheke/main/apps/docs/public/mark.png&align=left&font=geist&mode=light" />
  </picture>
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

Note where `../api/tsr` and `@tanstack/react-query` landed: grouping is by
**role in your app**, not by whether a module is local or comes from
`node_modules`.

## Getting started

```sh
pnpm add -D apotheke
```

📖 **[Read the documentation →](https://marcoraffaello.com/apotheke)**

The [quick start](https://marcoraffaello.com/apotheke/docs/quick-start) goes
from an empty config to organised imports in about two minutes.

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
