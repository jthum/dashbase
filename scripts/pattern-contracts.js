import { access, readdir, readFile } from "node:fs/promises";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { resolvePatternFragment, resolvePatternHtml } from "./pattern-composition.js";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const COMPONENTS_DIR = join(ROOT, "src/components");
const PATTERNS_DIR = join(ROOT, "src/patterns");
const CONTRACT_FILE_NAME = "pattern.contract.json";
const CONTRACT_SCHEMA_VERSION = 1;
const PATTERN_SCOPES = new Set(["field", "section", "page"]);
const PATTERN_PROP_TYPES = new Set(["string"]);

function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function formatPath(filePath) {
  return relative(ROOT, filePath).replaceAll("\\", "/");
}

async function pathExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function collectContractFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...await collectContractFiles(fullPath));
      continue;
    }

    if (entry.isFile() && entry.name === CONTRACT_FILE_NAME) {
      files.push(fullPath);
    }
  }

  return files.sort();
}

function ensureString({ value, field, errors, required = true }) {
  if (value === undefined || value === null) {
    if (required) {
      errors.push(`${field} is required`);
    }
    return null;
  }

  if (typeof value !== "string" || value.trim() === "") {
    errors.push(`${field} must be a non-empty string`);
    return null;
  }

  return value;
}

function ensureStringArray({ value, field, errors, required = true }) {
  if (value === undefined) {
    if (required) {
      errors.push(`${field} is required`);
    }
    return [];
  }

  if (!Array.isArray(value)) {
    errors.push(`${field} must be an array of strings`);
    return [];
  }

  const valid = [];
  for (const item of value) {
    if (typeof item !== "string" || item.trim() === "") {
      errors.push(`${field} must contain only non-empty strings`);
      continue;
    }

    valid.push(item);
  }

  return valid;
}

function validateProps({ props, contractPath, errors }) {
  if (props === undefined) {
    return [];
  }

  if (!Array.isArray(props)) {
    errors.push(`${contractPath}: props must be an array`);
    return [];
  }

  const seenNames = new Set();
  const validProps = [];

  for (const [index, prop] of props.entries()) {
    const fieldBase = `props[${index}]`;

    if (!isObject(prop)) {
      errors.push(`${contractPath}: ${fieldBase} must be an object`);
      continue;
    }

    const name = ensureString({ value: prop.name, field: `${fieldBase}.name`, errors });
    const type = ensureString({ value: prop.type, field: `${fieldBase}.type`, errors });
    const defaultValue = ensureString({ value: prop.default, field: `${fieldBase}.default`, errors });

    if (name) {
      if (seenNames.has(name)) {
        errors.push(`${contractPath}: prop names must be unique (${name})`);
      }

      seenNames.add(name);
    }

    if (type && !PATTERN_PROP_TYPES.has(type)) {
      errors.push(`${contractPath}: ${fieldBase}.type must be one of ${[...PATTERN_PROP_TYPES].join(", ")}`);
    }

    ensureString({ value: prop.description, field: `${fieldBase}.description`, errors, required: false });

    if (name && type && defaultValue !== null) {
      validProps.push({ name, type, default: defaultValue });
    }
  }

  return validProps;
}

function validateSlots({ slots, contractPath, errors }) {
  if (slots === undefined) {
    return [];
  }

  if (!Array.isArray(slots)) {
    errors.push(`${contractPath}: slots must be an array`);
    return [];
  }

  const seenNames = new Set();
  const validSlots = [];

  for (const [index, slot] of slots.entries()) {
    const fieldBase = `slots[${index}]`;

    if (!isObject(slot)) {
      errors.push(`${contractPath}: ${fieldBase} must be an object`);
      continue;
    }

    const name = ensureString({ value: slot.name, field: `${fieldBase}.name`, errors });
    const defaultHtml = slot.defaultHtml === undefined
      ? null
      : typeof slot.defaultHtml === "string"
        ? slot.defaultHtml
        : (() => {
          errors.push(`${contractPath}: ${fieldBase}.defaultHtml must be a string`);
          return null;
        })();

    if (name) {
      if (seenNames.has(name)) {
        errors.push(`${contractPath}: slot names must be unique (${name})`);
      }

      seenNames.add(name);
      validSlots.push({
        name,
        defaultHtml: defaultHtml ?? "",
      });
    }

    ensureString({ value: slot.description, field: `${fieldBase}.description`, errors, required: false });
  }

  return validSlots;
}

function ensureLocalFilePath({ value, field, patternDir, errors }) {
  const localPath = ensureString({ value, field, errors });
  if (!localPath) {
    return null;
  }

  const resolvedPath = resolve(patternDir, localPath);
  if (!resolvedPath.startsWith(patternDir)) {
    errors.push(`${field} must stay within its pattern folder`);
    return null;
  }

  return resolvedPath;
}

async function validateDocs({ docs, contractPath, patternDir, errors, htmlPath }) {
  if (docs === undefined) {
    return;
  }

  if (!isObject(docs)) {
    errors.push(`${contractPath}: docs must be an object`);
    return;
  }

  if (docs.examples === undefined) {
    return;
  }

  if (!Array.isArray(docs.examples)) {
    errors.push(`${contractPath}: docs.examples must be an array`);
    return;
  }

  const seenExampleIds = new Set();

  for (const [index, example] of docs.examples.entries()) {
    const fieldBase = `docs.examples[${index}]`;

    if (!isObject(example)) {
      errors.push(`${contractPath}: ${fieldBase} must be an object`);
      continue;
    }

    const id = ensureString({ value: example.id, field: `${fieldBase}.id`, errors });
    ensureString({ value: example.title, field: `${fieldBase}.title`, errors });
    const sourcePath = ensureLocalFilePath({
      value: example.source,
      field: `${fieldBase}.source`,
      patternDir,
      errors,
    });

    if (id) {
      if (seenExampleIds.has(id)) {
        errors.push(`${contractPath}: docs example ids must be unique (${id})`);
      }

      seenExampleIds.add(id);
    }

    if (!sourcePath || !htmlPath || sourcePath !== htmlPath || !id) {
      continue;
    }

    const source = await readFile(sourcePath, "utf8");
    const startMarker = `<!-- @example ${id}:start -->`;
    const endMarker = `<!-- @example ${id}:end -->`;

    if (!source.includes(startMarker) || !source.includes(endMarker)) {
      errors.push(`${contractPath}: ${fieldBase} must reference matching ${startMarker} / ${endMarker} markers`);
    }
  }
}

async function validatePatternEntry(entry, knownSlugs) {
  const errors = [];
  const { contract, fullPath, patternDir } = entry;
  const contractPath = formatPath(fullPath);

  if (!isObject(contract)) {
    return [`${contractPath}: contract must be a JSON object`];
  }

  if (contract.schemaVersion !== CONTRACT_SCHEMA_VERSION) {
    errors.push(`${contractPath}: schemaVersion must be ${CONTRACT_SCHEMA_VERSION}`);
  }

  const slug = ensureString({ value: contract.slug, field: "slug", errors });
  const name = ensureString({ value: contract.name, field: "name", errors });
  const title = ensureString({ value: contract.title, field: "title", errors });
  const category = ensureString({ value: contract.category, field: "category", errors });
  const family = ensureString({ value: contract.family, field: "family", errors });
  const variant = ensureString({ value: contract.variant, field: "variant", errors });
  const scope = ensureString({ value: contract.scope, field: "scope", errors });
  ensureString({ value: contract.summary, field: "summary", errors });
  ensureStringArray({ value: contract.tags, field: "tags", errors });
  const props = validateProps({ props: contract.props, contractPath, errors });
  const slots = validateSlots({ slots: contract.slots, contractPath, errors });

  const bindingNames = new Set();
  for (const binding of [...props, ...slots]) {
    if (bindingNames.has(binding.name)) {
      errors.push(`${contractPath}: binding names must be unique across props and slots (${binding.name})`);
    }

    bindingNames.add(binding.name);
  }

  if (scope && !PATTERN_SCOPES.has(scope)) {
    errors.push(`${contractPath}: scope must be one of ${[...PATTERN_SCOPES].join(", ")}`);
  }

  if (basename(fullPath) !== CONTRACT_FILE_NAME) {
    errors.push(`${contractPath}: pattern contract filename must be ${CONTRACT_FILE_NAME}`);
  }

  if (slug) {
    const relativeDir = formatPath(relative(PATTERNS_DIR, patternDir));
    if (relativeDir !== slug) {
      errors.push(`${contractPath}: pattern folder must match slug (${slug})`);
    }

    const slugParts = slug.split("/").filter(Boolean);
    if (slugParts.length < 3) {
      errors.push(`${contractPath}: slug must use at least category/family/variant`);
    } else {
      if (category && slugParts[0] !== category) {
        errors.push(`${contractPath}: category must match the first slug segment (${slugParts[0]})`);
      }

      if (family && slugParts.at(-2) !== family) {
        errors.push(`${contractPath}: family must match the penultimate slug segment (${slugParts.at(-2)})`);
      }

      if (variant && slugParts.at(-1) !== variant) {
        errors.push(`${contractPath}: variant must match the final slug segment (${slugParts.at(-1)})`);
      }
    }
  }

  if (name && title && !title.startsWith(name)) {
    errors.push(`${contractPath}: title should begin with the pattern name for predictable catalog grouping`);
  }

  if (!isObject(contract.files)) {
    errors.push(`${contractPath}: files must be an object`);
  }

  const htmlPath = isObject(contract.files)
    ? ensureLocalFilePath({ value: contract.files.html, field: "files.html", patternDir, errors })
    : null;
  const cssPath = isObject(contract.files) && contract.files.css !== undefined
    ? ensureLocalFilePath({ value: contract.files.css, field: "files.css", patternDir, errors })
    : null;
  const jsPath = isObject(contract.files) && contract.files.js !== undefined
    ? ensureLocalFilePath({ value: contract.files.js, field: "files.js", patternDir, errors })
    : null;

  for (const [field, filePath] of [
    ["files.html", htmlPath],
    ["files.css", cssPath],
    ["files.js", jsPath],
  ]) {
    if (filePath && !(await pathExists(filePath))) {
      errors.push(`${contractPath}: ${field} does not exist (${formatPath(filePath)})`);
    }
  }

  if (!isObject(contract.dependencies)) {
    errors.push(`${contractPath}: dependencies must be an object`);
  }

  const componentDeps = isObject(contract.dependencies)
    ? ensureStringArray({ value: contract.dependencies.components, field: "dependencies.components", errors })
    : [];
  const patternDeps = isObject(contract.dependencies)
    ? ensureStringArray({ value: contract.dependencies.patterns, field: "dependencies.patterns", errors, required: false })
    : [];

  for (const componentSlug of componentDeps) {
    const componentDir = join(COMPONENTS_DIR, componentSlug);
    if (!(await pathExists(componentDir))) {
      errors.push(`${contractPath}: dependencies.components contains unknown component "${componentSlug}"`);
    }
  }

  for (const patternSlug of patternDeps) {
    if (!knownSlugs.has(patternSlug)) {
      errors.push(`${contractPath}: dependencies.patterns contains unknown pattern "${patternSlug}"`);
    }
  }

  await validateDocs({
    docs: contract.docs,
    contractPath,
    patternDir,
    errors,
    htmlPath,
  });

  if (htmlPath) {
    try {
      const options = {
        params: getPatternDefaultBindings(contract),
        allowedTokens: getPatternAllowedTokens(contract),
      };
      await resolvePatternFragment(entry, "pattern", options);
      await resolvePatternHtml(entry, options);
    } catch (error) {
      errors.push(`${contractPath}: ${error.message}`);
    }
  }

  return errors;
}

export async function loadPatternContracts() {
  if (!(await pathExists(PATTERNS_DIR))) {
    return [];
  }

  const contractFiles = await collectContractFiles(PATTERNS_DIR);
  const entries = [];

  for (const fullPath of contractFiles) {
    const source = await readFile(fullPath, "utf8");
    let contract;

    try {
      contract = JSON.parse(source);
    } catch (error) {
      throw new Error(`${formatPath(fullPath)}: invalid JSON (${error.message})`);
    }

    entries.push({
      contract,
      patternDir: dirname(fullPath),
      fullPath,
    });
  }

  return entries;
}

export function getPatternAllowedTokens(contract) {
  return new Set([
    ...(contract.props ?? []).map((prop) => prop.name),
    ...(contract.slots ?? []).map((slot) => slot.name),
  ]);
}

export function getPatternDefaultBindings(contract) {
  return Object.fromEntries([
    ...(contract.props ?? []).map((prop) => [prop.name, prop.default]),
    ...(contract.slots ?? []).map((slot) => [slot.name, slot.defaultHtml ?? ""]),
  ]);
}

export async function validatePatternContracts({ log = true } = {}) {
  const entries = await loadPatternContracts();
  const knownSlugs = new Set(entries.map((entry) => entry.contract?.slug).filter(Boolean));
  const errors = [];

  for (const entry of entries) {
    errors.push(...await validatePatternEntry(entry, knownSlugs));
  }

  if (errors.length > 0) {
    throw new Error(`Pattern contract validation failed:\n\n${errors.join("\n")}`);
  }

  if (log) {
    console.log(`Validated ${entries.length} pattern contract files.`);
  }

  return entries;
}

const isEntrypoint = process.argv[1] === fileURLToPath(import.meta.url);

if (isEntrypoint) {
  validatePatternContracts().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
