import path from "node:path";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import fg from "fast-glob";
import { loadConfig } from "./src/config";
import { formatImports } from "./src/format";

const HELP = `
apotheke — JavaScript/TypeScript import organizer

Usage:
  apotheke --write <files...>           Organize imports in place
  apotheke --check <files...>           Exit 1 if any file would change (CI)
  apotheke --diff <files...>            Print what would change
  apotheke --stdin-filepath <file>      Read from stdin, write to stdout

Options:
  --config <path>    Path to config file (default: auto-discover apotheke.config.mjs/.js)
  --help             Show this help

Examples:
  apotheke --write src/**/*.tsx
  apotheke --check src/**/*.ts
  echo "import..." | apotheke --stdin-filepath src/app.tsx
`.trim();

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help")) {
    console.log(HELP);
    process.exit(0);
  }

  const mode = args.find((a) => ["--write", "--check", "--diff", "--stdin-filepath"].includes(a));
  if (!mode) {
    console.error("Error: specify --write, --check, --diff, or --stdin-filepath\n");
    console.log(HELP);
    process.exit(1);
  }

  const configIdx = args.indexOf("--config");
  const explicitConfig = configIdx >= 0 ? args[configIdx + 1] : undefined;

  if (mode === "--stdin-filepath") {
    const filepath = args[args.indexOf("--stdin-filepath") + 1];
    if (!filepath) {
      console.error("Error: --stdin-filepath requires a file path argument");
      process.exit(1);
    }
    const source = await readStdin();
    const config = await resolveConfig(filepath, explicitConfig);
    const result = formatImports(source, config, {
      fileDir: path.dirname(path.resolve(filepath)),
      rootDir: findRootDir(filepath),
    });
    process.stdout.write(result);
    return;
  }

  // Collect file globs (everything after mode flag that doesn't start with --)
  const modeIdx = args.indexOf(mode);
  const fileArgs: string[] = [];
  for (let i = modeIdx + 1; i < args.length; i++) {
    const arg = args[i]!;
    if (arg === "--config") { i++; continue; }
    if (!arg.startsWith("--")) fileArgs.push(arg);
  }

  if (fileArgs.length === 0) {
    console.error("Error: no files specified");
    process.exit(1);
  }

  const files = await expandGlobs(fileArgs);
  let anyChanged = false;

  for (const file of files) {
    const source = fs.readFileSync(file, "utf-8");
    const config = await resolveConfig(file, explicitConfig);
    const result = formatImports(source, config, {
      fileDir: path.dirname(path.resolve(file)),
      rootDir: findRootDir(file),
    });

    if (result === source) continue;
    anyChanged = true;

    if (mode === "--write") {
      fs.writeFileSync(file, result, "utf-8");
      console.log(`  formatted ${file}`);
    } else if (mode === "--diff") {
      printDiff(file, source, result);
    } else if (mode === "--check") {
      console.log(`  needs formatting: ${file}`);
    }
  }

  if (mode === "--check" && anyChanged) process.exit(1);
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString("utf-8");
}

async function resolveConfig(
  filePath: string,
  explicitConfig?: string
): Promise<import("./src/types").ApothekeConfig> {
  if (explicitConfig) {
    return loadConfig(path.resolve(explicitConfig));
  }

  let dir = path.dirname(path.resolve(filePath));
  while (true) {
    for (const name of ["apotheke.config.mjs", "apotheke.config.js"]) {
      const candidate = path.join(dir, name);
      if (fs.existsSync(candidate)) {
        return loadConfig(candidate);
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  throw new Error(
    `apotheke: no config found for ${filePath}. Create an apotheke.config.mjs in your project root.`
  );
}

function findRootDir(filePath: string): string {
  let dir = path.dirname(path.resolve(filePath));
  while (true) {
    if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return dir;
    dir = parent;
  }
}

async function expandGlobs(patterns: string[]): Promise<string[]> {
  const cwd = process.cwd();
  const submoduleDirs = getSubmoduleDirs(cwd);
  const files: string[] = [];

  for (const pattern of patterns) {
    if (!/[*?{[]/.test(pattern)) {
      const abs = path.resolve(pattern);
      if (
        /\.(tsx?|jsx?)$/.test(abs) &&
        fs.existsSync(abs) &&
        !isUnderSubmodule(abs, submoduleDirs)
      ) {
        files.push(abs);
      }
      continue;
    }
    const matches = await fg(pattern, { cwd, onlyFiles: true, absolute: true });
    for (const abs of matches) {
      if (/\.(tsx?|jsx?)$/.test(abs) && !isUnderSubmodule(abs, submoduleDirs)) {
        files.push(abs);
      }
    }
  }

  return [...new Set(files)];
}

function getSubmoduleDirs(cwd: string): string[] {
  try {
    const output = execFileSync("git", ["-C", cwd, "submodule", "foreach", "--recursive", "--quiet", "pwd"], {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return output.trim().split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

function isUnderSubmodule(filePath: string, submoduleDirs: string[]): boolean {
  return submoduleDirs.some(
    (dir) => filePath === dir || filePath.startsWith(dir + path.sep)
  );
}

function printDiff(file: string, original: string, updated: string): void {
  const origLines = original.split("\n");
  const newLines = updated.split("\n");
  console.log(`--- ${file}`);
  console.log(`+++ ${file}`);
  const maxLen = Math.max(origLines.length, newLines.length);
  for (let i = 0; i < maxLen; i++) {
    const o = origLines[i];
    const n = newLines[i];
    if (o !== n) {
      if (o !== undefined) console.log(`- ${o}`);
      if (n !== undefined) console.log(`+ ${n}`);
    }
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
