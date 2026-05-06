import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: { index: "index.ts" },
    format: ["esm"],
    target: "node18",
    dts: true,
    clean: true,
    external: ["oxc-parser"],
  },
  {
    entry: { cli: "cli.ts" },
    format: ["esm"],
    target: "node18",
    banner: { js: "#!/usr/bin/env node" },
    external: ["oxc-parser", "fast-glob"],
  },
]);
