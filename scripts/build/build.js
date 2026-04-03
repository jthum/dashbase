/**
 * Dashbase Build Script
 *
 * 0. Validates example HTML and current docs snippets against component + pattern contracts
 * 0.5. Generates the pattern manifest
 * 1. Resolves @import in baseline.css (inline the imports)
 * 2. Copies individual component files to dist/components/<component>/
 * 3. Emits readable + minified component assets side by side
 * 4. Creates optional bundled dist/bundles/dashbase.css
 *
 * Usage: bun run scripts/build/build.js
 */

import { readdir, mkdir, copyFile, rm } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { gzipSync } from "node:zlib";
import { validateContracts } from "./validate-examples.js";
import { generatePatternManifest } from "./generate-pattern-manifest.js";

const ROOT = new URL("../..", import.meta.url).pathname;
const BASELINE_DIR = join(ROOT, "src/baseline");
const COMPONENTS_DIR = join(ROOT, "src/components");
const DIST = join(ROOT, "dist");
const DIST_COMPONENTS = join(DIST, "components");
const DIST_BUNDLES = join(DIST, "bundles");
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

function toPosixPath(path) {
  return path.replaceAll("\\", "/");
}

function withMinExtension(path) {
  return path.replace(/\.(css|js)$/u, ".min.$1");
}

async function ensureParentDir(filePath) {
  await mkdir(dirname(filePath), { recursive: true });
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
  const dir = dirname(filePath);

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

async function buildMinifiedFiles({ entrypoints, outdir, root }) {
  if (entrypoints.length === 0) {
    return;
  }

  const result = await Bun.build({
    entrypoints,
    minify: true,
    naming: "[dir]/[name].min.[ext]",
    outdir,
    root,
    target: "browser",
  });

  if (!result.success) {
    throw new AggregateError(result.logs, `Minification failed for ${outdir}`);
  }
}

async function build() {
  const startTime = performance.now();

  await validateContracts({ log: false });
  console.log("  ✓ examples + docs");
  await generatePatternManifest({ log: false });
  console.log("  ✓ generated/patterns/patterns.manifest.json");

  // Clean and create dist
  await rm(DIST, { recursive: true, force: true });
  await mkdir(DIST, { recursive: true });
  await mkdir(DIST_COMPONENTS, { recursive: true });
  await mkdir(DIST_BUNDLES, { recursive: true });

  // 1. Build baseline.css with resolved imports
  const baselineContent = await resolveImports(join(BASELINE_DIR, "baseline.css"));
  const baselineReadablePath = join(DIST, "baseline.css");
  const baselineMinPath = join(DIST, "baseline.min.css");
  await Bun.write(baselineReadablePath, baselineContent);
  console.log("  ✓ dist/baseline.css");
  await buildMinifiedFiles({
    entrypoints: [baselineReadablePath],
    outdir: DIST,
    root: DIST,
  });
  console.log("  ✓ dist/baseline.min.css");

  // 2. Copy individual component files
  let componentContents = [];
  let componentSizes = [];
  let cssFiles = [];
  let jsFiles = [];

  cssFiles = await collectFiles(COMPONENTS_DIR, ".css");
  if (cssFiles.length > 0) {
    for (const src of cssFiles) {
      const relativePath = toPosixPath(relative(COMPONENTS_DIR, src));
      const dest = join(DIST_COMPONENTS, relativePath);
      await ensureParentDir(dest);
      await copyFile(src, dest);
      console.log(`  ✓ dist/components/${relativePath}`);

      const content = await Bun.file(src).text();
      componentContents.push(content);
      componentSizes.push({
        name: relativePath,
        readable: getSizeMetrics(content),
        minPath: join(DIST_COMPONENTS, withMinExtension(relativePath)),
      });
    }
    await buildMinifiedFiles({
      entrypoints: cssFiles,
      outdir: DIST_COMPONENTS,
      root: COMPONENTS_DIR,
    });
    console.log("  ✓ dist/components/**/*.min.css");
  } else {
    console.log("  ℹ No components found (yet)");
  }

  // 2b. Copy optional behavior shims
  jsFiles = await collectFiles(COMPONENTS_DIR, ".js");
  if (jsFiles.length > 0) {
    for (const src of jsFiles) {
      const relativePath = toPosixPath(relative(COMPONENTS_DIR, src));
      const dest = join(DIST_COMPONENTS, relativePath);
      await ensureParentDir(dest);
      await copyFile(src, dest);
      console.log(`  ✓ dist/components/${relativePath}`);
    }
    await buildMinifiedFiles({
      entrypoints: jsFiles,
      outdir: DIST_COMPONENTS,
      root: COMPONENTS_DIR,
    });
    console.log("  ✓ dist/components/**/*.min.js");
  } else {
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

  const bundleReadablePath = join(DIST_BUNDLES, "dashbase.css");
  const bundleMinPath = join(DIST_BUNDLES, "dashbase.min.css");
  await Bun.write(bundleReadablePath, bundle);
  console.log("  ✓ dist/bundles/dashbase.css");
  await buildMinifiedFiles({
    entrypoints: [bundleReadablePath],
    outdir: DIST_BUNDLES,
    root: DIST_BUNDLES,
  });
  console.log("  ✓ dist/bundles/dashbase.min.css");

  // 4. Report sizes
  const baselineSize = getSizeMetrics(await Bun.file(baselineMinPath).text());
  const bundleSize = getSizeMetrics(await Bun.file(bundleMinPath).text());

  for (const componentSize of componentSizes) {
    componentSize.minified = getSizeMetrics(await Bun.file(componentSize.minPath).text());
  }

  const elapsed = (performance.now() - startTime).toFixed(1);

  console.log("");
  console.log("  Minified transfer sizes");
  console.log(`  baseline.min.css:  ${formatSize(baselineSize.raw)} raw / ${formatSize(baselineSize.gzip)} gzip`);
  for (const { name, readable, minified } of componentSizes) {
    const warn = minified.gzip > SIZE_BUDGETS.componentGzip ? " ⚠ gzip budget" : "";
    console.log(`  ${name.padEnd(36)} ${formatSize(readable.raw)} raw / ${formatSize(minified.gzip)} min gzip${warn}`);
  }
  console.log(`  dashbase.min.css: ${formatSize(bundleSize.raw)} raw / ${formatSize(bundleSize.gzip)} gzip (${componentSizes.length} components)`);
  console.log(`  Built in ${elapsed}ms`);

  if (baselineSize.gzip > SIZE_BUDGETS.baselineGzip) {
    console.warn(`  ⚠ baseline.min.css exceeds gzip budget (${formatSize(baselineSize.gzip)})`);
  }
  for (const { name, minified } of componentSizes) {
    if (minified.gzip > SIZE_BUDGETS.componentGzip) {
      console.warn(`  ⚠ ${name} exceeds component gzip budget (${formatSize(minified.gzip)})`);
    }
  }
  if (bundleSize.gzip > SIZE_BUDGETS.bundleGzip) {
    console.warn(`  ⚠ dashbase.min.css exceeds bundle gzip budget (${formatSize(bundleSize.gzip)})`);
  }
}

console.log("Dashbase Build");
console.log("──────────────");
build().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
