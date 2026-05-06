/**
 * Apotheke — prettier plugin + programmatic API
 *
 * Prettier plugin usage (.prettierrc):
 *   { "plugins": ["apotheke"] }
 *
 * Requirements: prettier v3+, Bun runtime
 *
 * The plugin runs as a `preprocess` step, so apotheke organises imports
 * first and prettier formats the result — correct order, one pass.
 *
 * Pre-commit (lint-staged, prettier v2):
 *   { "*.{ts,tsx}": ["apotheke --write", "prettier --write"] }
 */

import path from "node:path";
import { existsSync } from "node:fs";
import { formatImports } from "./src/format";
import { loadConfig } from "./src/config";
import type { ApothekeConfig } from "./src/types";

// ── config resolution ────────────────────────────────────────────────────────

async function resolveConfig(filePath: string): Promise<ApothekeConfig> {
  const candidates = ["apotheke.config.mjs", "apotheke.config.js"];
  let dir = path.dirname(path.resolve(filePath));
  while (true) {
    for (const name of candidates) {
      const candidate = path.join(dir, name);
      if (existsSync(candidate)) return loadConfig(candidate);
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(
    `apotheke: no config found for ${filePath}. Create an apotheke.config.mjs in your project root.`
  );
}

// ── preprocess hook ──────────────────────────────────────────────────────────

async function preprocess(
  text: string,
  options: { filepath?: string }
): Promise<string> {
  try {
    const config = await resolveConfig(options.filepath ?? process.cwd());
    const fileDir = options.filepath
      ? path.dirname(path.resolve(options.filepath))
      : undefined;
    return formatImports(text, config, { fileDir });
  } catch {
    // Never break prettier — return source unchanged on any error
    return text;
  }
}

// ── prettier plugin export ───────────────────────────────────────────────────
// Prettier v3 takes the LAST plugin that defines a parser name and uses it
// entirely — it does not merge. So we must spread the built-in parser and
// only override `preprocess`. We resolve prettier from `process.cwd()` so
// the resolution finds the parser in the project that's actually running
// prettier, not from our own install location.

import { createRequire } from "node:module";

type PrettierParser = {
  preprocess?: (text: string, opts: { filepath?: string }) => string | Promise<string>;
  parse?: (text: string, options: unknown) => unknown;
  astFormat?: string;
  locStart?: (node: unknown) => number;
  locEnd?: (node: unknown) => number;
  [k: string]: unknown;
};

// Walk up from `startDir` looking for a node that can require `pluginPath`.
// This works in VS Code where process.cwd() is the extension host dir, not
// the project root — but opts.filepath always points into the project tree.
function resolveBaseParser(
  pluginPath: string,
  parserName: string,
  startDir: string
): PrettierParser | null {
  let dir = startDir;
  while (true) {
    try {
      const req = createRequire(path.join(dir, "__placeholder__.js"));
      const mod = req(pluginPath) as { parsers?: Record<string, PrettierParser> };
      const base = mod.parsers?.[parserName];
      if (base) return base;
    } catch {
      // not resolvable from this dir — keep walking up
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function makeParser(pluginPath: string, parserName: string): PrettierParser {
  let cached: PrettierParser | undefined = undefined;

  function getBase(filepath?: string): PrettierParser | null {
    if (cached) return cached;
    const roots = [
      filepath ? path.dirname(path.resolve(filepath)) : null,
      process.cwd(),
    ].filter(Boolean) as string[];
    for (const root of roots) {
      const found = resolveBaseParser(pluginPath, parserName, root);
      if (found) {
        cached = found;
        return cached;
      }
    }
    // Don't cache null — allow retry once opts.filepath is available
    // (e.g. in VS Code where process.cwd() is the extension host dir)
    return null;
  }

  // Eagerly resolve from cwd — succeeds in CLI context.
  getBase();

  return {
    // astFormat must always be present so prettier can find its printer before
    // parse() is called. "estree" is correct for all four parsers we expose.
    astFormat: "estree",
    // locStart/locEnd must match the base parser exactly. By the time prettier
    // calls these, parse() has already run and populated `cached`, so we always
    // delegate to the real implementations rather than approximating them.
    locStart(node: unknown): number {
      return (cached?.locStart ?? ((n: unknown) => (n as Record<string, unknown>).start as number))(node);
    },
    locEnd(node: unknown): number {
      return (cached?.locEnd ?? ((n: unknown) => (n as Record<string, unknown>).end as number))(node);
    },
    parse(text: string, options: unknown) {
      const base = getBase((options as { filepath?: string })?.filepath);
      if (base?.parse) {
        return (base.parse as (t: string, o: unknown) => unknown)(text, options);
      }
      throw new Error(
        `apotheke: could not resolve ${parserName} parser from prettier. ` +
          `Make sure prettier is installed in your project.`
      );
    },
    async preprocess(text: string, opts: { filepath?: string }): Promise<string> {
      const base = getBase(opts?.filepath);
      const basePreprocess = base?.preprocess;
      const after = basePreprocess
        ? await (basePreprocess as (t: string, o: typeof opts) => Promise<string>)(text, opts)
        : text;
      return preprocess(after, opts);
    },
  };
}

export const parsers = {
  typescript:   makeParser("prettier/plugins/typescript", "typescript"),
  babel:        makeParser("prettier/plugins/babel", "babel"),
  "babel-ts":   makeParser("prettier/plugins/babel", "babel-ts"),
  "babel-flow": makeParser("prettier/plugins/babel", "babel-flow"),
};

// ── programmatic API ─────────────────────────────────────────────────────────

export { formatImports } from "./src/format";
export type { ApothekeConfig } from "./src/types";
