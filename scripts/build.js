/**
 * Dashbase Build Script
 *
 * 0. Validates example HTML and current docs snippets against component contracts
 * 1. Resolves @import in baseline.css (inline the imports)
 * 2. Copies individual component files to dist/components/
 * 3. Creates bundled dist/dashbase.css (baseline + all components)
 *
 * Usage: bun run scripts/build.js
 */

import { readdir, mkdir, copyFile, rm } from "node:fs/promises";
import { basename, join } from "node:path";
import { gzipSync } from "node:zlib";
import { validateContracts } from "./validate-examples.js";

const ROOT = new URL("..", import.meta.url).pathname;
const BASELINE_DIR = join(ROOT, "src/baseline");
const COMPONENTS_DIR = join(ROOT, "src/components");
const DIST = join(ROOT, "dist");
const DIST_COMPONENTS = join(DIST, "components");
const DIST_BEHAVIORS = join(DIST, "behaviors");
const SIZE_BUDGETS = {
  baselineGzip: 3 * 1024,
  componentGzip: 1.5 * 1024,
  bundleGzip: 10 * 1024,
};

function getSizeMetrics(content) {
  return {
    raw: new Blob([content]).size,
    gzip: gzipSync(content).length,
  };
}

function formatSize(bytes) {
  return `${(bytes / 1024).toFixed(2)} KB`;
}

async function collectFiles(dir, extension) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...await collectFiles(fullPath, extension));
      continue;
    }

    if (entry.isFile() && fullPath.endsWith(extension)) {
      files.push(fullPath);
    }
  }

  return files.sort();
}

/**
 * Resolve @import statements in a CSS file by inlining the imported content.
 * Only handles relative imports (which is all we use).
 */
async function resolveImports(filePath) {
  const content = await Bun.file(filePath).text();
  const dir = join(filePath, "..");

  const lines = content.split("\n");
  const resolved = [];

  for (const line of lines) {
    const match = line.match(/@import\s+["'](.+?)["']\s*;/);
    if (match) {
      const importPath = join(dir, match[1]);
      const importContent = await Bun.file(importPath).text();
      resolved.push(importContent);
    } else {
      resolved.push(line);
    }
  }

  return resolved.join("\n");
}

async function build() {
  const startTime = performance.now();

  await validateContracts({ log: false });
  console.log("  ✓ examples + docs");

  // Clean and create dist
  await rm(DIST, { recursive: true, force: true });
  await mkdir(DIST, { recursive: true });
  await mkdir(DIST_COMPONENTS, { recursive: true });
  await mkdir(DIST_BEHAVIORS, { recursive: true });

  // 1. Build baseline.css with resolved imports
  const baselineContent = await resolveImports(join(BASELINE_DIR, "baseline.css"));
  await Bun.write(join(DIST, "baseline.css"), baselineContent);
  console.log("  ✓ dist/baseline.css");

  // 2. Copy individual component files
  let componentContents = [];
  let componentSizes = [];

  try {
    const cssFiles = await collectFiles(COMPONENTS_DIR, ".css");

    for (const src of cssFiles) {
      const file = basename(src);
      const dest = join(DIST_COMPONENTS, file);
      await copyFile(src, dest);
      console.log(`  ✓ dist/components/${file}`);

      const content = await Bun.file(src).text();
      componentContents.push(content);
      componentSizes.push({ name: file, ...getSizeMetrics(content) });
    }
  } catch {
    console.log("  ℹ No components found (yet)");
  }

  // 2b. Copy optional behavior shims
  try {
    const jsFiles = await collectFiles(COMPONENTS_DIR, ".js");

    for (const src of jsFiles) {
      const file = basename(src);
      const dest = join(DIST_BEHAVIORS, file);
      await copyFile(src, dest);
      console.log(`  ✓ dist/behaviors/${file}`);
    }
  } catch {
    console.log("  ℹ No behaviors found (yet)");
  }

  // 3. Create bundled dashbase.css
  const bundle = [
    "/* Dashbase — Bundled CSS */",
    `/* Generated: ${new Date().toISOString()} */`,
    "",
    baselineContent,
    "",
    ...componentContents,
  ].join("\n");

  await Bun.write(join(DIST, "dashbase.css"), bundle);
  console.log("  ✓ dist/dashbase.css (bundle)");

  // 4. Report sizes
  const baselineSize = getSizeMetrics(baselineContent);
  const bundleSize = getSizeMetrics(bundle);
  const elapsed = (performance.now() - startTime).toFixed(1);

  console.log("");
  console.log(`  baseline.css:  ${formatSize(baselineSize.raw)} raw / ${formatSize(baselineSize.gzip)} gzip`);
  for (const { name, raw, gzip } of componentSizes) {
    const warn = gzip > SIZE_BUDGETS.componentGzip ? " ⚠ gzip budget" : "";
    console.log(`  ${name.padEnd(16)} ${formatSize(raw)} raw / ${formatSize(gzip)} gzip${warn}`);
  }
  console.log(`  dashbase.css:  ${formatSize(bundleSize.raw)} raw / ${formatSize(bundleSize.gzip)} gzip (${componentSizes.length} components)`);
  console.log(`  Built in ${elapsed}ms`);

  if (baselineSize.gzip > SIZE_BUDGETS.baselineGzip) {
    console.warn(`  ⚠ baseline.css exceeds gzip budget (${formatSize(baselineSize.gzip)})`);
  }
  for (const { name, gzip } of componentSizes) {
    if (gzip > SIZE_BUDGETS.componentGzip) {
      console.warn(`  ⚠ ${name} exceeds component gzip budget (${formatSize(gzip)})`);
    }
  }
  if (bundleSize.gzip > SIZE_BUDGETS.bundleGzip) {
    console.warn(`  ⚠ dashbase.css exceeds bundle gzip budget (${formatSize(bundleSize.gzip)})`);
  }
}

console.log("Dashbase Build");
console.log("──────────────");
build().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
