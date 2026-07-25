---
name: setup-apotheke
description: Set up apotheke import organizer in any JS/TS project. Scans existing imports, proposes group config, writes apotheke.config.mjs, and wires up prettier plugin. Use when user wants to organize imports, set up apotheke, or add import formatting to a project.
---

# Setup Apotheke

Apotheke is **Prettier for imports** — deterministic, configurable import organization for JavaScript and TypeScript. It is not a replacement for prettier: it runs *inside* prettier as a `preprocess` plugin, so imports get organized and code gets formatted in a single `prettier --write` pass. It also ships a standalone CLI for projects that do not use prettier.

This skill installs and configures it by analyzing the project's actual imports, then wiring it up as a prettier plugin.

Full documentation: <https://mraffaello.github.io/apotheke>

## Step 1 — Detect project structure (monorepo vs single package)

Before doing anything else, determine whether this is a monorepo. Check for these signals at the working directory root:

| File / field                             | Tool                    |
| ---------------------------------------- | ----------------------- |
| `pnpm-workspace.yaml`                    | pnpm workspaces         |
| `turbo.json`                             | Turborepo               |
| `nx.json`                                | Nx                      |
| `lerna.json`                             | Lerna                   |
| `rush.json`                              | Rush                    |
| `package.json` with `"workspaces"` field | npm/yarn/bun workspaces |

If any of these are present, it's a **monorepo**. Follow the monorepo path below. Otherwise follow the single-package path.

### Single-package path

Proceed to Step 2 with the repo root as the single package root.

### Monorepo path

1. Identify all package roots by reading the workspaces glob (e.g. `packages/*`, `apps/*`) from whichever workspace config is present. List them to the user.
2. Ask: "Should I set up a shared root config that all packages inherit from, or configure each package independently?"
    - **Shared root** (recommended): write a root `apotheke.config.mjs` with groups common across all packages; each package gets its own config with `extends: "../../apotheke.config.mjs"` that overrides or adds package-specific groups.
    - **Independent**: each package gets its own self-contained config with no inheritance.
3. Scan each package separately (Step 2 runs once per package root). Combine the findings to build the shared group set before writing configs.
4. In Step 6, add scripts to each package's `package.json` scoped to that package's source folder. Optionally add a root-level script that runs prettier across all packages.

## Step 2 — Scan the project

For each package root (or just the single root), search for all `.ts`, `.tsx`, `.js`, `.jsx` files (excluding `node_modules`, `dist`, `.next`, `build`, `out`). Read a sample of files (up to 20 per package, spread across the directory tree) and extract the unique import specifiers.

Pay attention to:

- **Package imports**: `react`, `@tanstack/react-query`, `lucide-react`, etc.
- **Path alias imports**: `@/components/...`, `~/lib/...`, `#utils/...`
- **Relative path patterns**: which folders appear most — `hooks/`, `api/`, `components/`, `views/`, `pages/`, `utils/`, `lib/`, `stores/`, etc.
- **tsconfig.json / jsconfig.json**: read `compilerOptions.paths` and `compilerOptions.baseUrl` to understand existing aliases. In a monorepo, check both the root tsconfig and each package's tsconfig.

## Step 3 — Check for existing config

Look for `apotheke.config.mjs`, `apotheke.config.js`, or `apotheke.config.ts` at each relevant root. If one already exists, read it, tell the user, and ask whether to update it or abort.

## Step 4 — Propose groups

Based on what you found, propose a `groups` array. Use your judgment to create meaningful groups. Common patterns:

- If the project uses React → group `react`, `react-dom`, `react-*`
    > **Warning — `react-*` is greedy**: it will also match `react-hook-form`, `react-i18next`, `react-day-picker`, etc. Groups are matched in order and the first match wins. If you want those libraries in their own groups (Forms, i18n, Date), either list them in those groups _before_ the React group in the array, or narrow the React match to just `['react', 'react-dom']` without the wildcard.
- If the project has `hooks/` folder → group `**/hooks/**`
- If the project has `api/`, `services/`, `queries/` → group those paths + data-fetching libraries (react-query, swr, etc.)
- If the project has `components/`, `ui/` → group those
- If the project uses a router (react-router, tanstack-router, next/navigation) → group it
- If the project uses icon libraries (lucide-react, @heroicons, react-icons) → group as Assets
- If the project has a `store/`, `context/` folder → group it
- If the project uses a UI kit (@mui, @radix-ui, shadcn) → group it
- In a monorepo, internal workspace packages (e.g. `@acme/*`) deserve their own group

Always propose a sensible **alias map** based on tsconfig `paths`.

In a monorepo with a shared root config: put universal groups (React, external libraries) in the root config, and package-specific groups (internal paths, local components) in each package config.

Present the proposed config clearly and ask the user:

1. Are these groups right? Any to add, remove, or rename?
2. Is the order right? Groups are matched top-to-bottom and the first match wins.
3. Should there be blank lines between groups? (`groupSeparator`, default: yes)
4. Should group comments (`// React`) be added? (`groupComments`, default: yes)

Do **not** offer to toggle sorting or deduplication. Imports are always sorted
alphabetically within a group, named imports are always sorted within the
braces, and duplicate specifiers are always merged. There are no options for
these.

Wait for confirmation before proceeding.

## Step 5 — Write apotheke.config.mjs

**Always use `.mjs`** — it works with both the CLI and the Node.js prettier plugin. Never write `.ts` configs: Node.js (where prettier runs) cannot `import()` TypeScript files. Only `apotheke.config.mjs` and `apotheke.config.js` are discovered.

```js
// apotheke.config.mjs
export default {
    groups: [
        // ... confirmed groups
    ],
    aliases: {
        // ... from tsconfig paths
    },
    groupSeparator: true,
    groupComments: true
};
```

For a monorepo with a shared root:

```js
// apps/web/apotheke.config.mjs
export default {
    extends: '../../apotheke.config.mjs',
    groups: [
        // package-specific groups only — root groups are inherited
        { name: 'Local Components', match: ['**/components/**'] }
    ]
};
```

## Step 6 — Install apotheke and wire up prettier

### 6a. Install apotheke

Check if apotheke is already in `package.json` dependencies. If not, install it:

- Bun project (`bun.lock` present) → `bun add -D apotheke`
- pnpm (`pnpm-lock.yaml`) → `pnpm add -D apotheke`
- yarn (`yarn.lock`) → `yarn add -D apotheke`
- npm (`package-lock.json`) → `npm install -D apotheke`

In a monorepo, install at the root unless the workspace requires per-package installs.

### 6b. Add apotheke to the prettier config

Check for `.prettierrc`, `.prettierrc.js`, `.prettierrc.json`, or `prettier.config.js`. Add `"apotheke"` to the `plugins` array (create the file if none exists):

```js
// prettier.config.js  (or .prettierrc.js)
module.exports = {
    // ...existing options unchanged...
    plugins: ['apotheke']
};
```

For JSON prettier configs (`.prettierrc` or `.prettierrc.json`):

```json
{
    "plugins": ["apotheke"]
}
```

> **Ordering is critical**: apotheke must be the **last** entry in `plugins`. It chains to the previous plugin's `preprocess` hook via `getBase()?.preprocess`, so any plugin listed after it will completely override apotheke's preprocess and imports will not be organized. If another prettier plugin (e.g. `prettier-plugin-tailwindcss`) is already present, place `"apotheke"` after it:
>
> ```json
> { "plugins": ["prettier-plugin-tailwindcss", "apotheke"] }
> ```

### 6c. Verify prettier version

Check that prettier v3 is installed (`"prettier": "^3"` in devDependencies). If v2 is found, tell the user:

> "Apotheke's prettier plugin requires prettier v3 (async `preprocess`). I can upgrade it, or set up the v2 fallback (CLI + prettier in sequence). Which do you prefer?"

**v2 fallback** (lint-staged only):

```json
{
    "lint-staged": {
        "*.{ts,tsx,js,jsx}": ["apotheke --write", "prettier --write"]
    }
}
```

## Step 7 — Add scripts to package.json

With the prettier plugin wired up, a single `prettier --write` does everything. Add:

```json
{
    "scripts": {
        "format": "prettier --write 'src/**/*.{ts,tsx,js,jsx}'",
        "format:check": "prettier --check 'src/**/*.{ts,tsx,js,jsx}'"
    }
}
```

Adjust the glob to match the project's source folder. In a monorepo, also add a root script:

```json
{
    "scripts": {
        "format": "prettier --write 'packages/*/src/**/*.{ts,tsx}' 'apps/*/src/**/*.{ts,tsx}'",
        "format:check": "prettier --check 'packages/*/src/**/*.{ts,tsx}' 'apps/*/src/**/*.{ts,tsx}'"
    }
}
```

## Step 8 — VS Code on-save (optional)

Ask the user: "Do you want imports organized automatically on save in VS Code?"

If yes, the prettier VS Code extension handles this automatically once the plugin is in the prettier config — no extra config needed. Confirm that the extension is installed and `editor.formatOnSave` is enabled:

```json
// .vscode/settings.json
{
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
        "source.organizeImports": false
    }
}
```

Disable `source.organizeImports` to prevent VS Code's built-in import sorter from conflicting with apotheke.

## Step 9 — Run a dry-run

Run a true dry-run (no writes) on a small sample (3–5 files, one per package in a monorepo) and show the user what would change:

```sh
prettier --list-different 'src/App.tsx' 'src/main.tsx'
```

> `--write --list-different` together would actually write the files; use `--list-different` alone for a real dry-run.

Show the before/after for imports to confirm the groups look right.

Ask: "Does this look right? Shall I run `format` on the whole project?"

If yes, run the `format` script using the package manager detected in Step 6a
(`pnpm run format`, `bun run format`, `yarn format` or `npm run format`).

## Final summary

Report:

- Project type: single-package or monorepo (list package roots if monorepo)
- Config(s) written to: paths
- Groups configured: list them
- Prettier plugin: wired up in `prettier.config.js` (or equivalent)
- Script added: `format` / `format:check`
- Files that would be changed: N files
- Whether `--write` was run

Point the user at the documentation for anything beyond this setup:
<https://mraffaello.github.io/apotheke>
