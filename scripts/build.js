/**
 * Dashbase Build Script
 *
 * 1. Resolves @import in baseline.css (inline the imports)
 * 2. Copies individual component files to dist/components/
 * 3. Creates bundled dist/dashbase.css (baseline + all components)
 *
 * Usage: bun run scripts/build.js
 */

import { readdir, mkdir, copyFile, rm } from "node:fs/promises";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const BASELINE_DIR = join(ROOT, "src/baseline");
const COMPONENTS_DIR = join(ROOT, "src/components");
const DIST = join(ROOT, "dist");
const DIST_COMPONENTS = join(DIST, "components");

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

  // Clean and create dist
  await rm(DIST, { recursive: true, force: true });
  await mkdir(DIST, { recursive: true });
  await mkdir(DIST_COMPONENTS, { recursive: true });

  // 1. Build baseline.css with resolved imports
  const baselineContent = await resolveImports(join(BASELINE_DIR, "baseline.css"));
  await Bun.write(join(DIST, "baseline.css"), baselineContent);
  console.log("  ✓ dist/baseline.css");

  // 2. Copy individual component files
  let componentContents = [];
  let componentSizes = [];

  try {
    const componentFiles = await readdir(COMPONENTS_DIR);
    const cssFiles = componentFiles.filter((f) => f.endsWith(".css")).sort();

    for (const file of cssFiles) {
      const src = join(COMPONENTS_DIR, file);
      const dest = join(DIST_COMPONENTS, file);
      await copyFile(src, dest);
      console.log(`  ✓ dist/components/${file}`);

      const content = await Bun.file(src).text();
      componentContents.push(content);
      componentSizes.push({ name: file, size: new Blob([content]).size });
    }
  } catch {
    console.log("  ℹ No components found (yet)");
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
  const baselineSize = new Blob([baselineContent]).size;
  const bundleSize = new Blob([bundle]).size;
  const elapsed = (performance.now() - startTime).toFixed(1);

  console.log("");
  console.log(`  baseline.css:  ${(baselineSize / 1024).toFixed(2)} KB`);
  for (const { name, size } of componentSizes) {
    const kb = (size / 1024).toFixed(2);
    const warn = size > 4096 ? " ⚠ >4KB" : "";
    console.log(`  ${name.padEnd(16)} ${kb} KB${warn}`);
  }
  console.log(`  dashbase.css:  ${(bundleSize / 1024).toFixed(2)} KB (${componentSizes.length} components)`);
  console.log(`  Built in ${elapsed}ms`);

  if (baselineSize > 8192) {
    console.warn(`  ⚠ baseline.css exceeds 8KB target`);
  }
  for (const { name, size } of componentSizes) {
    if (size > 4096) {
      console.warn(`  ⚠ ${name} exceeds 4KB component target (${(size / 1024).toFixed(2)} KB)`);
    }
  }
}

console.log("Dashbase Build");
console.log("──────────────");
build().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
