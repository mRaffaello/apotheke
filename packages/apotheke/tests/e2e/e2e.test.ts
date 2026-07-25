import { test, expect, describe, beforeAll } from "vitest";
import path from "node:path";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { parseSync } from "oxc-parser";
import { formatImports } from "../../src/format";
import { parseImports } from "../../src/parser";
import type { ApothekeConfig } from "../../src/types";

// Pinned commits — update these when intentionally upgrading fixtures
const SONNER_COMMIT = "45d894085af8ca8421912789a8f5a4ac4ac3d0ea";
const TREMOR_COMMIT = "ca4d588f47820ff3d514d37fa4ee08a4222dec11";

const REPOS = path.join(import.meta.dirname, "repos");
const SONNER = path.join(REPOS, "sonner");
const TREMOR = path.join(REPOS, "tremor");

// ─── fixture setup ────────────────────────────────────────────────────────────

const FIXTURE_REPOS = [
  { name: "sonner", url: "https://github.com/emilkowalski/sonner.git", dir: SONNER },
  { name: "tremor", url: "https://github.com/tremorlabs/tremor.git", dir: TREMOR },
];

beforeAll(() => {
  fs.mkdirSync(REPOS, { recursive: true });
  for (const repo of FIXTURE_REPOS) {
    if (!fs.existsSync(path.join(repo.dir, "package.json"))) {
      console.log(`  cloning ${repo.name}...`);
      execFileSync("git", ["clone", "--depth", "1", repo.url, repo.dir], { stdio: "inherit" });
    }
  }
}, 120_000);

// ─── helpers ─────────────────────────────────────────────────────────────────

function readFile(p: string): string {
  return fs.readFileSync(p, "utf-8");
}

function collectSpecifiers(source: string): Set<string> {
  return new Set(parseImports(source).map((n) => n.specifier));
}

function parsesCleanly(source: string, filename: string): boolean {
  const result = parseSync(filename, source);
  return result.errors.length === 0;
}

// ─── sonner config ────────────────────────────────────────────────────────────

const sonnerConfig: ApothekeConfig = {
  groups: [
    { name: "React", match: ["react", "react-dom", "react-*"] },
    { name: "Internal", match: ["./**"] },
  ],
  groupSeparator: true,
  groupComments: true,
};

// ─── tremor config ────────────────────────────────────────────────────────────

const tremorConfig: ApothekeConfig = {
  groups: [
    { name: "React", match: ["react", "react-dom", "react-*"] },
    { name: "Icons", match: ["@remixicon/react", "@heroicons/**"] },
    { name: "UI", match: ["@radix-ui/**"] },
    { name: "Charts", match: ["recharts", "recharts/**"] },
    { name: "Styling", match: ["tailwind-variants", "clsx", "class-variance-authority"] },
    { name: "Hooks", match: ["**/hooks/**"] },
    { name: "Utils", match: ["**/utils/**"] },
    { name: "Components", match: ["**/components/**"] },
  ],
  groupSeparator: true,
  groupComments: true,
};

// ─── invariants ──────────────────────────────────────────────────────────────

function checkInvariants(
  original: string,
  result: string,
  filename: string,
  config: ApothekeConfig,
  fileDir: string
) {
  expect(parsesCleanly(result, filename)).toBe(true);

  const originalSpecifiers = collectSpecifiers(original);
  const resultSpecifiers = collectSpecifiers(result);
  for (const s of originalSpecifiers) {
    expect(resultSpecifiers.has(s)).toBe(true);
  }

  const second = formatImports(result, config, { fileDir });
  expect(second).toBe(result);

  const originalImports = parseImports(original);
  if (originalImports.length > 0) {
    const lastImport = originalImports[originalImports.length - 1]!;
    const afterImports = original.slice(lastImport.end).trimStart();
    if (afterImports.length > 0) {
      const codeLines = afterImports
        .split("\n")
        .filter((l) => l.trim().length > 0)
        .slice(0, 3);
      for (const line of codeLines) {
        expect(result).toContain(line);
      }
    }
  }
}

// ─── sonner tests ─────────────────────────────────────────────────────────────

describe("e2e: sonner", () => {
  const fileDir = path.join(SONNER, "src");

  test("repo fixtures are present at pinned commit", () => {
    const commit = execFileSync("git", ["-C", SONNER, "rev-parse", "HEAD"], {
      encoding: "utf-8",
    }).trim();
    expect(commit).toBe(SONNER_COMMIT);
  });

  test("formats index.tsx correctly", () => {
    const file = path.join(SONNER, "src/index.tsx");
    const source = readFile(file);
    const result = formatImports(source, sonnerConfig, { fileDir });

    checkInvariants(source, result, "index.tsx", sonnerConfig, fileDir);

    const lines = result.split("\n");
    const importLines = lines.filter((l) => l.startsWith("import"));
    const sideEffectIdx = importLines.findIndex((l) => l.includes("styles.css"));
    expect(sideEffectIdx).toBe(0);
  });

  test("formats hooks.tsx correctly", () => {
    const file = path.join(SONNER, "src/hooks.tsx");
    const source = readFile(file);
    const result = formatImports(source, sonnerConfig, { fileDir });
    checkInvariants(source, result, "hooks.tsx", sonnerConfig, fileDir);
  });

  test("formats state.ts correctly", () => {
    const file = path.join(SONNER, "src/state.ts");
    const source = readFile(file);
    const result = formatImports(source, sonnerConfig, { fileDir });
    checkInvariants(source, result, "state.ts", sonnerConfig, fileDir);
  });

  test("index.tsx: react imports are grouped together", () => {
    const source = readFile(path.join(SONNER, "src/index.tsx"));
    const result = formatImports(source, sonnerConfig, { fileDir });

    const reactGroupIdx = result.indexOf("// React");
    const reactImportIdx = result.indexOf("import React from");
    const reactDomImportIdx = result.indexOf("import ReactDOM from");

    expect(reactGroupIdx).toBeGreaterThanOrEqual(0);
    expect(reactImportIdx).toBeGreaterThan(reactGroupIdx);
    expect(reactDomImportIdx).toBeGreaterThan(reactGroupIdx);
  });

  test("index.tsx: internal imports are grouped together", () => {
    const source = readFile(path.join(SONNER, "src/index.tsx"));
    const result = formatImports(source, sonnerConfig, { fileDir });

    const internalGroupIdx = result.indexOf("// Internal");
    expect(internalGroupIdx).toBeGreaterThanOrEqual(0);

    for (const specifier of ["./assets", "./hooks", "./state", "./types"]) {
      const idx = result.indexOf(`from '${specifier}'`);
      expect(idx).toBeGreaterThan(internalGroupIdx);
    }
  });
});

// ─── tremor tests ─────────────────────────────────────────────────────────────

describe("e2e: tremor", () => {
  const tremorFiles = [
    "src/components/Badge/Badge.tsx",
    "src/components/AreaChart/AreaChart.tsx",
    "src/components/Drawer/Drawer.tsx",
    "src/components/Select/Select.tsx",
    "src/components/Tabs/Tabs.tsx",
  ];

  test("repo fixtures are present at pinned commit", () => {
    const commit = execFileSync("git", ["-C", TREMOR, "rev-parse", "HEAD"], {
      encoding: "utf-8",
    }).trim();
    expect(commit).toBe(TREMOR_COMMIT);
  });

  for (const relPath of tremorFiles) {
    test(`formats ${relPath}`, () => {
      const file = path.join(TREMOR, relPath);
      const fileDir = path.dirname(file);
      const source = readFile(file);
      const result = formatImports(source, tremorConfig, { fileDir });

      checkInvariants(source, result, path.basename(relPath), tremorConfig, fileDir);
    });

    test(`${relPath}: idempotent`, () => {
      const file = path.join(TREMOR, relPath);
      const fileDir = path.dirname(file);
      const source = readFile(file);
      const first = formatImports(source, tremorConfig, { fileDir });
      const second = formatImports(first, tremorConfig, { fileDir });
      expect(first).toBe(second);
    });
  }

  test("AreaChart.tsx: recharts imports grouped under Charts", () => {
    const file = path.join(TREMOR, "src/components/AreaChart/AreaChart.tsx");
    const fileDir = path.dirname(file);
    const source = readFile(file);
    const result = formatImports(source, tremorConfig, { fileDir });

    const chartsIdx = result.indexOf("// Charts");
    expect(chartsIdx).toBeGreaterThanOrEqual(0);
    const rechartsIdx = Math.max(
      result.indexOf("from 'recharts'"),
      result.indexOf(`from "recharts"`)
    );
    expect(rechartsIdx).toBeGreaterThan(chartsIdx);
  });

  test("Drawer.tsx: @radix-ui imports grouped under UI", () => {
    const file = path.join(TREMOR, "src/components/Drawer/Drawer.tsx");
    const fileDir = path.dirname(file);
    const source = readFile(file);
    const result = formatImports(source, tremorConfig, { fileDir });

    const uiIdx = result.indexOf("// UI");
    expect(uiIdx).toBeGreaterThanOrEqual(0);
    expect(result.indexOf("@radix-ui/react-dialog")).toBeGreaterThan(uiIdx);
  });

  test("AreaChart.tsx: utils imports grouped under Utils", () => {
    const file = path.join(TREMOR, "src/components/AreaChart/AreaChart.tsx");
    const fileDir = path.dirname(file);
    const source = readFile(file);
    const result = formatImports(source, tremorConfig, { fileDir });

    const utilsIdx = result.indexOf("// Utils");
    expect(utilsIdx).toBeGreaterThanOrEqual(0);
    expect(result.indexOf("chartColors")).toBeGreaterThan(utilsIdx);
    expect(result.indexOf("../../utils/cx")).toBeGreaterThan(utilsIdx);
  });
});
