import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mkdir, rm } from "node:fs/promises";
import { build } from "esbuild";
import esbuildPluginPino from "esbuild-plugin-pino";

globalThis.require = createRequire(import.meta.url);

const artifactDir = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(artifactDir, "dist");
const outputFile = path.resolve(distDir, "app.mjs");

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });

await build({
  entryPoints: [path.resolve(artifactDir, "src/app.ts")],
  bundle: true,
  platform: "node",
  format: "esm",
  outdir: distDir,
  outExtension: { ".js": ".mjs" },
  sourcemap: false,
  logLevel: "info",
  external: ["*.node", "pg-native", "better-sqlite3", "sqlite3", "canvas"],
  plugins: [esbuildPluginPino({ transports: ["pino-pretty"] })],
  banner: {
    js: `import { createRequire as __bannerCrReq } from 'node:module';
import __bannerPath from 'node:path';
import __bannerUrl from 'node:url';

globalThis.require = __bannerCrReq(import.meta.url);
globalThis.__filename = __bannerUrl.fileURLToPath(import.meta.url);
globalThis.__dirname = __bannerPath.dirname(globalThis.__filename);
    `,
  },
});

console.log(`[serverless-build] wrote ${outputFile}`);
