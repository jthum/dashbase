import { readdir, readFile } from "node:fs/promises";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateComponentContracts } from "./component-contracts.js";
import { validatePatternContracts } from "./pattern-contracts.js";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const COMPONENTS_DIR = join(ROOT, "src/components");
const PATTERNS_DIR = join(ROOT, "src/patterns");
const EXAMPLES_DIR = join(ROOT, "src/examples");
const VALIDATION_DIRS = [COMPONENTS_DIR, PATTERNS_DIR, EXAMPLES_DIR];
const VALIDATED_MARKDOWN_FILES = [
  join(ROOT, "README.md"),
  join(ROOT, "docs/dashbase-implementation-guidance.md"),
];

function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "");
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

function splitTopLevel(input, separator = ",") {
  const parts = [];
  let current = "";
  let parenDepth = 0;
  let bracketDepth = 0;

  for (const char of input) {
    if (char === "(") parenDepth += 1;
    if (char === ")") parenDepth = Math.max(0, parenDepth - 1);
    if (char === "[") bracketDepth += 1;
    if (char === "]") bracketDepth = Math.max(0, bracketDepth - 1);

    if (char === separator && parenDepth === 0 && bracketDepth === 0) {
      if (current.trim()) parts.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  if (current.trim()) parts.push(current.trim());
  return parts;
}

function extractFirstRuleSelectors(cssSource) {
  const css = stripComments(cssSource);
  const layerIndex = css.indexOf("@layer components");

  if (layerIndex === -1) return [];

  const layerOpen = css.indexOf("{", layerIndex);
  if (layerOpen === -1) return [];

  let cursor = layerOpen + 1;
  while (cursor < css.length && /\s/.test(css[cursor])) {
    cursor += 1;
  }

  const selectorStart = cursor;
  let parenDepth = 0;
  let bracketDepth = 0;

  while (cursor < css.length) {
    const char = css[cursor];

    if (char === "(") parenDepth += 1;
    if (char === ")") parenDepth = Math.max(0, parenDepth - 1);
    if (char === "[") bracketDepth += 1;
    if (char === "]") bracketDepth = Math.max(0, bracketDepth - 1);

    if (char === "{" && parenDepth === 0 && bracketDepth === 0) {
      break;
    }

    cursor += 1;
  }

  const selectorBlock = css.slice(selectorStart, cursor).trim();
  return splitTopLevel(selectorBlock);
}

function extractRequiredClasses(selector) {
  const selectorWithoutNegation = selector.replace(/:not\([^)]*\)/g, "");
  const classes = new Set();

  for (const match of selectorWithoutNegation.matchAll(/\.([A-Za-z_][A-Za-z0-9_-]*)/g)) {
    classes.add(match[1]);
  }

  return classes;
}

function getTagName(selector) {
  const tagMatch = selector.match(/^[A-Za-z][A-Za-z0-9-]*/);
  return tagMatch ? tagMatch[0].toLowerCase() : null;
}

function selectorMatchesElement(selector, element) {
  const baseSelector = selector.includes(":where(")
    ? selector.slice(0, selector.indexOf(":where("))
    : selector;

  const tagName = getTagName(baseSelector);
  if (!tagName || tagName !== element.tag) return false;

  for (const match of baseSelector.matchAll(/\[type=["']([^"']+)["']\]/g)) {
    if ((element.attrs.type ?? "").toLowerCase() !== match[1].toLowerCase()) {
      return false;
    }
  }

  for (const match of baseSelector.matchAll(/:not\(\.([A-Za-z_][A-Za-z0-9_-]*)\)/g)) {
    if (element.classes.has(match[1])) {
      return false;
    }
  }

  for (const className of extractRequiredClasses(baseSelector)) {
    if (!element.classes.has(className)) {
      return false;
    }
  }

  return true;
}

function parseAttributes(attributeSource) {
  const attrs = {};
  const attrPattern = /([:@A-Za-z0-9_-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;

  for (const match of attributeSource.matchAll(attrPattern)) {
    const [, name, doubleQuoted, singleQuoted, bare] = match;
    attrs[name.toLowerCase()] = doubleQuoted ?? singleQuoted ?? bare ?? "";
  }

  return attrs;
}

function getLineNumber(source, index) {
  return source.slice(0, index).split("\n").length;
}

function getLineOffset(source, index) {
  return getLineNumber(source, index) - 1;
}

function extractElementsWithClasses(htmlSource) {
  const elements = [];
  const tagPattern = /<([A-Za-z][A-Za-z0-9-]*)(\s[^>]*?)?>/g;

  for (const match of htmlSource.matchAll(tagPattern)) {
    const [, tagName, attrSource = ""] = match;
    const attrs = parseAttributes(attrSource);
    const classValue = attrs.class;

    if (!classValue) continue;

    elements.push({
      tag: tagName.toLowerCase(),
      attrs,
      classes: new Set(classValue.split(/\s+/).filter(Boolean)),
      index: match.index ?? 0,
      snippet: match[0],
    });
  }

  return elements;
}

function extractInlineStyleClasses(htmlSource) {
  const localClasses = new Set();

  for (const match of htmlSource.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) {
    const styleContent = stripComments(match[1]);

    for (const classMatch of styleContent.matchAll(/\.([A-Za-z_][A-Za-z0-9_-]*)/g)) {
      localClasses.add(classMatch[1]);
    }
  }

  return localClasses;
}

function extractLoadedComponentFiles(htmlSource, examplePath) {
  const files = [];

  for (const match of htmlSource.matchAll(/<link\b[^>]+href=["']([^"']+\.css)["']/gi)) {
    const href = match[1];
    if (/^(?:https?:|data:|\/)/i.test(href)) {
      continue;
    }

    const resolvedPath = resolve(dirname(examplePath), href);
    if (!resolvedPath.startsWith(COMPONENTS_DIR) || !resolvedPath.endsWith(".css")) {
      continue;
    }

    files.push(basename(resolvedPath));
  }

  return files;
}

function extractHtmlCodeBlocks(markdownSource) {
  const blocks = [];
  const codeFencePattern = /```html\s*\n([\s\S]*?)```/g;

  for (const match of markdownSource.matchAll(codeFencePattern)) {
    const fullMatch = match[0];
    const html = match[1];
    const contentIndex = (match.index ?? 0) + fullMatch.indexOf(html);

    blocks.push({
      html,
      lineOffset: getLineOffset(markdownSource, contentIndex),
    });
  }

  return blocks;
}

async function buildComponentCatalog() {
  const componentFiles = await collectFiles(COMPONENTS_DIR, ".css");

  const catalog = new Map();

  for (const fullPath of componentFiles) {
    const file = basename(fullPath);
    const source = await readFile(fullPath, "utf8");
    const selectors = extractFirstRuleSelectors(source);
    const supportedClasses = new Set();

    for (const selector of selectors) {
      for (const className of extractRequiredClasses(selector)) {
        supportedClasses.add(className);
      }
    }

    for (const match of source.matchAll(/&\.([A-Za-z_][A-Za-z0-9_-]*)/g)) {
      supportedClasses.add(match[1]);
    }

    catalog.set(file, {
      file: relative(ROOT, fullPath),
      selectors,
      supportedClasses,
    });
  }

  return catalog;
}

function formatClasses(classes) {
  return classes.size === 0 ? "none" : [...classes].sort().join(", ");
}

function collectAllowedClasses(localClasses, components) {
  const allowedClasses = new Set(localClasses);

  for (const component of components) {
    for (const className of component.supportedClasses) {
      allowedClasses.add(className);
    }
  }

  return allowedClasses;
}

function appendValidationErrors({
  errors,
  sourcePath,
  html,
  components,
  localClasses = new Set(),
  lineOffset = 0,
}) {
  const allowedClasses = collectAllowedClasses(localClasses, components);

  for (const element of extractElementsWithClasses(html)) {
    const matchingComponents = components.filter((component) =>
      component.selectors.some((selector) => selectorMatchesElement(selector, element)),
    );

    if (matchingComponents.length === 0) continue;

    const allowedClasses = collectAllowedClasses(localClasses, matchingComponents);

    const unsupportedClasses = [...element.classes]
      .filter((className) => !allowedClasses.has(className))
      .sort();

    if (unsupportedClasses.length === 0) continue;

    errors.push({
      sourcePath,
      line: lineOffset + getLineNumber(html, element.index),
      snippet: element.snippet,
      unsupportedClasses,
      matchingComponents: matchingComponents.map((component) => component.file).sort(),
      supportedClasses: new Set(
        matchingComponents.flatMap((component) => [...component.supportedClasses]),
      ),
    });
  }
}

export async function validateContracts({ log = true } = {}) {
  const contractEntries = await validateComponentContracts({ log: false });
  const patternEntries = await validatePatternContracts({ log: false });
  const componentCatalog = await buildComponentCatalog();
  const allComponents = [...componentCatalog.values()];
  const exampleFiles = (
    await Promise.all(VALIDATION_DIRS.map((dir) => collectFiles(dir, ".html")))
  ).flat().sort();

  const errors = [];
  let documentationSnippetCount = 0;

  for (const examplePath of exampleFiles) {
    const html = await readFile(examplePath, "utf8");
    const localClasses = extractInlineStyleClasses(html);
    const loadedComponents = extractLoadedComponentFiles(html, examplePath)
      .map((file) => componentCatalog.get(file))
      .filter(Boolean);

    appendValidationErrors({
      errors,
      sourcePath: relative(ROOT, examplePath),
      html,
      components: loadedComponents,
      localClasses,
    });
  }

  for (const markdownPath of VALIDATED_MARKDOWN_FILES) {
    const markdownSource = await readFile(markdownPath, "utf8");
    const sourcePath = markdownPath.replace(`${ROOT}/`, "");

    for (const block of extractHtmlCodeBlocks(markdownSource)) {
      documentationSnippetCount += 1;

      appendValidationErrors({
        errors,
        sourcePath,
        html: block.html,
        components: allComponents,
        lineOffset: block.lineOffset,
      });
    }
  }

  if (errors.length > 0) {
    const formatted = errors.map((error) => {
      const supported = formatClasses(error.supportedClasses);
      const unsupported = error.unsupportedClasses.join(", ");
      const components = error.matchingComponents.join(", ");

      return [
        `${error.sourcePath}:${error.line}`,
        `  unsupported classes: ${unsupported}`,
        `  matching components: ${components}`,
        `  supported classes: ${supported}`,
        `  element: ${error.snippet}`,
      ].join("\n");
    }).join("\n\n");

    throw new Error(`Contract validation failed:\n\n${formatted}`);
  }

  if (log) {
    console.log(
      `Validated ${contractEntries.length} component contracts, ${patternEntries.length} pattern contracts, ${exampleFiles.length} HTML files, and ${documentationSnippetCount} documentation snippets against component CSS.`,
    );
  }
}

export const validateExamples = validateContracts;

const isEntrypoint = process.argv[1] === fileURLToPath(import.meta.url);

if (isEntrypoint) {
  validateContracts().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
