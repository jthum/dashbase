import { copyFile, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const DIST_PREVIEW = join(ROOT, "dist/preview");
const PREVIEW_SOURCE_DIRS = [
  join(ROOT, "src/baseline"),
  join(ROOT, "src/components"),
  join(ROOT, "src/examples"),
  join(ROOT, "src/patterns"),
  join(ROOT, "themes"),
];
const ALLOWED_EXTENSIONS = new Set([
  ".css",
  ".gif",
  ".html",
  ".jpeg",
  ".jpg",
  ".js",
  ".png",
  ".svg",
  ".webp",
]);

function toPosixPath(path) {
  return path.replaceAll("\\", "/");
}

async function collectFiles(dir, predicate = () => true) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...await collectFiles(fullPath, predicate));
      continue;
    }

    if (entry.isFile() && predicate(fullPath)) {
      files.push(fullPath);
    }
  }

  return files.sort();
}

async function copyFilesToPreview(rootDir) {
  const files = await collectFiles(rootDir, (filePath) => ALLOWED_EXTENSIONS.has(extname(filePath).toLowerCase()));

  for (const sourcePath of files) {
    const relativePath = relative(ROOT, sourcePath);
    const outputPath = join(DIST_PREVIEW, relativePath);
    await mkdir(dirname(outputPath), { recursive: true });
    await copyFile(sourcePath, outputPath);
  }
}

function extractTitle(htmlSource, fallback) {
  const titleMatch = htmlSource.match(/<title>([^<]+)<\/title>/i);
  return titleMatch?.[1]?.trim() || fallback;
}

function toPreviewLink(filePath) {
  return `./${toPosixPath(relative(ROOT, filePath))}`;
}

function groupPreviewLinks(files, { filter = () => true } = {}) {
  return files.filter(filter).map((filePath) => ({
    filePath,
    href: toPreviewLink(filePath),
  }));
}

async function loadPageMeta(filePath) {
  const source = await readFile(filePath, "utf8");
  return {
    title: extractTitle(source, toPosixPath(relative(ROOT, filePath))),
    href: toPreviewLink(filePath),
    path: toPosixPath(relative(ROOT, filePath)),
  };
}

function renderLinkList(items) {
  return items.map(({ href, title, path }) => (
    `          <li><a href="${href}">${title}</a><small>${path}</small></li>`
  )).join("\n");
}

function renderSection({ title, description, items }) {
  return [
    "      <section class=\"preview-group\">",
    `        <header><h2>${title}</h2><p>${description}</p></header>`,
    "        <ul class=\"preview-links\">",
    renderLinkList(items),
    "        </ul>",
    "      </section>",
  ].join("\n");
}

function renderPreviewIndex({ examples, components, patterns }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashbase Preview Index</title>
  <link rel="stylesheet" href="./src/baseline/baseline.css">
  <link rel="stylesheet" href="./themes/default.css">
  <style>
    body {
      margin: 0;
      background:
        radial-gradient(circle at top, color-mix(in oklch, var(--bg-subtle) 78%, transparent), transparent 55%),
        var(--bg-default);
    }

    main {
      display: grid;
      gap: var(--space-2xl);
      max-inline-size: 72rem;
      margin-inline: auto;
      padding: var(--space-2xl);
    }

    .intro {
      display: grid;
      gap: var(--space-md);
      padding: var(--space-xl);
      background: color-mix(in oklch, var(--bg-raised) 88%, transparent);
      border: var(--border-width) solid var(--border-default);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-sm);
    }

    .intro > * {
      margin: 0;
    }

    .preview-grid {
      display: grid;
      gap: var(--space-xl);
    }

    @media (min-width: 64rem) {
      .preview-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }

    .preview-group {
      display: grid;
      align-content: start;
      gap: var(--space-md);
      padding: var(--space-xl);
      background: var(--bg-raised);
      border: var(--border-width) solid var(--border-default);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-sm);
    }

    .preview-group header {
      display: grid;
      gap: var(--space-xs);
    }

    .preview-group header > * {
      margin: 0;
    }

    .preview-links {
      display: grid;
      gap: var(--space-xs);
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .preview-links li {
      display: grid;
      gap: 0.125rem;
      padding: var(--space-sm) 0;
      border-block-end: var(--border-width) solid color-mix(in oklch, var(--border-default) 75%, transparent);
    }

    .preview-links li:last-child {
      border-block-end: 0;
      padding-block-end: 0;
    }

    .preview-links a {
      color: var(--text-default);
      font-weight: 600;
      text-decoration: none;
    }

    .preview-links a:hover,
    .preview-links a:focus-visible {
      color: var(--color-primary);
      text-decoration: underline;
      outline: none;
    }

    .preview-links small {
      color: var(--text-muted);
      font-family: var(--font-mono);
      font-size: var(--text-xs);
    }
  </style>
</head>
<body>
  <main>
    <section class="intro">
      <h1>Dashbase Preview Index</h1>
      <p>Browse the current source-shaped preview tree generated by the build. This is intentionally lightweight: it mirrors the authored example pages so component, pattern, and cross-component demos stay easy to inspect.</p>
    </section>

    <div class="preview-grid">
${renderSection({
  title: "Cross-Component Demos",
  description: "Shared examples that combine multiple components.",
  items: examples,
})}
${renderSection({
  title: "Component Pages",
  description: "Component-owned reference pages under src/components.",
  items: components,
})}
${renderSection({
  title: "Pattern Pages",
  description: "Higher-level native HTML patterns and composed layouts.",
  items: patterns,
})}
    </div>
  </main>
</body>
</html>`;
}

export async function generatePreview({ log = true } = {}) {
  for (const sourceDir of PREVIEW_SOURCE_DIRS) {
    await copyFilesToPreview(sourceDir);
  }

  const exampleFiles = await collectFiles(join(ROOT, "src/examples"), (filePath) => filePath.endsWith(".html"));
  const componentFiles = await collectFiles(
    join(ROOT, "src/components"),
    (filePath) => filePath.endsWith(".html") && !filePath.endsWith(".fragments.html"),
  );
  const patternFiles = await collectFiles(
    join(ROOT, "src/patterns"),
    (filePath) => basename(filePath) === "pattern.html",
  );

  const examples = await Promise.all(groupPreviewLinks(exampleFiles).map(({ filePath }) => loadPageMeta(filePath)));
  const components = await Promise.all(groupPreviewLinks(componentFiles).map(({ filePath }) => loadPageMeta(filePath)));
  const patterns = await Promise.all(groupPreviewLinks(patternFiles).map(({ filePath }) => loadPageMeta(filePath)));

  const outputPath = join(DIST_PREVIEW, "index.html");
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, renderPreviewIndex({ examples, components, patterns }));

  if (log) {
    console.log("  ✓ dist/preview/index.html");
  }
}

if (import.meta.main) {
  generatePreview().catch((error) => {
    console.error("Preview generation failed:", error);
    process.exit(1);
  });
}
