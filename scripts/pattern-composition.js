import { readFile } from "node:fs/promises";
import { dirname, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const COMPOSE_FRAGMENT_PATTERN = /(^[ \t]*)<compose-fragment\b([^>]*?)(?:\/>|>\s*<\/compose-fragment>)/im;
const ATTRIBUTE_PATTERN = /([:@A-Za-z0-9_-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
const SUPPORTED_MARKER_TYPES = ["fragment", "example"];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatPath(filePath) {
  return relative(ROOT, filePath).replaceAll("\\", "/");
}

function parseAttributes(attributeSource) {
  const attrs = {};

  for (const match of attributeSource.matchAll(ATTRIBUTE_PATTERN)) {
    const [, name, doubleQuoted, singleQuoted, bare] = match;
    attrs[name] = doubleQuoted ?? singleQuoted ?? bare ?? "";
  }

  return attrs;
}

function stripMarkers(source) {
  return source.replace(/(?:<!--\s*@(fragment|example)\s+[^:]+:(?:start|end)\s*-->|\/\*\s*@(fragment|example)\s+[^:]+:(?:start|end)\s*\*\/)\s*/g, "");
}

function dedent(value) {
  const normalized = value.replace(/\r\n/g, "\n").trim();
  if (normalized.length === 0) {
    return "";
  }

  const lines = normalized.split("\n");
  const indents = lines
    .filter((line) => line.trim().length > 0)
    .map((line) => line.match(/^\s*/u)?.[0].length ?? 0);
  const minIndent = indents.length > 0 ? Math.min(...indents) : 0;

  return lines
    .map((line) => line.slice(minIndent))
    .join("\n")
    .trim();
}

function indentBlock(source, indent) {
  if (!indent) {
    return source;
  }

  return source
    .split("\n")
    .map((line) => (line.length > 0 ? `${indent}${line}` : line))
    .join("\n");
}

function extractMarkedFragment(source, id) {
  for (const markerType of SUPPORTED_MARKER_TYPES) {
    const escapedId = escapeRegExp(id);
    const startMarker = String.raw`(?:<!--\s*@${markerType}\s+${escapedId}:start\s*-->|\/\*\s*@${markerType}\s+${escapedId}:start\s*\*\/)`;
    const endMarker = String.raw`(?:<!--\s*@${markerType}\s+${escapedId}:end\s*-->|\/\*\s*@${markerType}\s+${escapedId}:end\s*\*\/)`;
    const pattern = new RegExp(
      `${startMarker}([\\s\\S]*?)${endMarker}`,
      "m",
    );
    const match = source.match(pattern);

    if (match) {
      return match[1];
    }
  }

  throw new Error(`Missing fragment markers for "${id}"`);
}

function applyTemplateParams(source, params) {
  return source.replace(/\{\{\s*([A-Za-z0-9_-]+)\s*\}\}/g, (fullMatch, key) => {
    if (Object.hasOwn(params, key)) {
      return params[key];
    }

    return fullMatch;
  });
}

function assertNoUnresolvedTokens(source, context, allowedTokens = new Set()) {
  for (const match of source.matchAll(/\{\{\s*([A-Za-z0-9_-]+)\s*\}\}/g)) {
    const token = match[1];

    if (allowedTokens.has(token)) {
      continue;
    }

    throw new Error(`${context}: unresolved template token ${match[0]}`);
  }
}

function parseSourceReference(reference, currentFilePath) {
  const hashIndex = reference.lastIndexOf("#");
  if (hashIndex === -1) {
    throw new Error(`compose-fragment source must use file.html#fragment-id (${reference})`);
  }

  const fileReference = reference.slice(0, hashIndex);
  const fragmentId = reference.slice(hashIndex + 1);

  if (!fileReference || !fragmentId) {
    throw new Error(`compose-fragment source must include both file path and fragment id (${reference})`);
  }

  const resolvedFilePath = resolve(dirname(currentFilePath), fileReference);
  if (!resolvedFilePath.startsWith(ROOT)) {
    throw new Error(`compose-fragment source must stay inside the project (${reference})`);
  }

  return {
    filePath: resolvedFilePath,
    fragmentId,
  };
}

async function resolveSource(source, currentFilePath, options = {}, stack = []) {
  const { params = {}, allowedTokens = new Set() } = options;
  let output = applyTemplateParams(source, params);

  while (true) {
    const match = COMPOSE_FRAGMENT_PATTERN.exec(output);
    if (!match) {
      break;
    }

    const [fullMatch, indent = "", attributeSource = ""] = match;
    const attrs = parseAttributes(attributeSource);
    const sourceAttr = attrs.source;

    if (!sourceAttr) {
      throw new Error(`${formatPath(currentFilePath)}: compose-fragment is missing a source attribute`);
    }

    const { filePath, fragmentId } = parseSourceReference(sourceAttr, currentFilePath);
    const fragmentKey = `${filePath}#${fragmentId}`;

    if (stack.includes(fragmentKey)) {
      throw new Error(`Pattern composition cycle detected: ${[...stack, fragmentKey].map((key) => formatPath(key.split("#")[0]) + "#" + key.split("#")[1]).join(" -> ")}`);
    }

    const fragmentSource = await readFile(filePath, "utf8");
    const rawFragment = extractMarkedFragment(fragmentSource, fragmentId);
    const templateParams = { ...attrs };
    delete templateParams.source;

    const interpolatedFragment = applyTemplateParams(rawFragment, {
      ...params,
      ...templateParams,
    });
    const resolvedFragment = await resolveSource(
      interpolatedFragment,
      filePath,
      { params, allowedTokens },
      [...stack, fragmentKey],
    );
    const cleanedFragment = dedent(stripMarkers(resolvedFragment));

    assertNoUnresolvedTokens(cleanedFragment, `${formatPath(filePath)}#${fragmentId}`, allowedTokens);

    const replacement = indentBlock(cleanedFragment, indent);
    output = `${output.slice(0, match.index)}${replacement}${output.slice(match.index + fullMatch.length)}`;
  }

  const cleanedOutput = stripMarkers(output);
  assertNoUnresolvedTokens(cleanedOutput, formatPath(currentFilePath), allowedTokens);
  return cleanedOutput;
}

export async function resolvePatternHtml(entry, options = {}) {
  const htmlPath = resolve(entry.patternDir, entry.contract.files.html);
  const source = await readFile(htmlPath, "utf8");
  return resolveSource(source, htmlPath, options);
}

export async function resolvePatternFragment(entry, fragmentId = "pattern", options = {}) {
  const htmlPath = resolve(entry.patternDir, entry.contract.files.html);
  const source = await readFile(htmlPath, "utf8");
  const fragment = extractMarkedFragment(source, fragmentId);
  const resolved = await resolveSource(fragment, htmlPath, options, [`${htmlPath}#${fragmentId}`]);
  return dedent(stripMarkers(resolved));
}
