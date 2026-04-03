import { access, readdir, readFile } from "node:fs/promises";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const COMPONENTS_DIR = join(ROOT, "src/components");
const CONTRACT_SUFFIX = ".contract.json";
const CONTRACT_SCHEMA_VERSION = 1;
const CONTRACT_CATEGORIES = new Set(["presentational", "interactive"]);
const BEHAVIOR_MODES = new Set(["none", "shim-backed"]);
const VARIANT_TYPES = new Set(["class", "attribute"]);
const PROP_KINDS = new Set(["class-group", "attribute"]);
const FRAMEWORK_TARGETS = new Set(["react", "svelte", "vue", "solid"]);

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

async function collectFiles(dir, suffix) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...await collectFiles(fullPath, suffix));
      continue;
    }

    if (entry.isFile() && fullPath.endsWith(suffix)) {
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

function ensureLocalFilePath({ value, field, contractDir, errors }) {
  const localPath = ensureString({ value, field, errors });
  if (!localPath) {
    return null;
  }

  const resolvedPath = resolve(contractDir, localPath);
  if (!resolvedPath.startsWith(contractDir)) {
    errors.push(`${field} must stay within its component folder`);
    return null;
  }

  return resolvedPath;
}

function ensureProjectFilePath({ value, field, contractDir, errors }) {
  const filePath = ensureString({ value, field, errors });
  if (!filePath) {
    return null;
  }

  const resolvedPath = resolve(contractDir, filePath);
  if (!resolvedPath.startsWith(ROOT)) {
    errors.push(`${field} must resolve inside the project`);
    return null;
  }

  return resolvedPath;
}

function validateNamedTarget({ value, field, contractPath, errors, allowedTargets }) {
  const target = ensureString({ value, field, errors });
  if (target && !allowedTargets.has(target)) {
    errors.push(`${contractPath}: ${field} must reference root or a declared anatomy name`);
  }

  return target;
}

function validateVariants({ variants, contractPath, errors, allowedTargets }) {
  if (variants === undefined) {
    return;
  }

  if (!Array.isArray(variants)) {
    errors.push(`${contractPath}: variants must be an array`);
    return;
  }

  for (const [index, variant] of variants.entries()) {
    const fieldBase = `variants[${index}]`;
    if (!isObject(variant)) {
      errors.push(`${contractPath}: ${fieldBase} must be an object`);
      continue;
    }

    const type = ensureString({ value: variant.type, field: `${fieldBase}.type`, errors });
    ensureString({ value: variant.name, field: `${fieldBase}.name`, errors });
    validateNamedTarget({
      value: variant.target,
      field: `${fieldBase}.target`,
      contractPath,
      errors,
      allowedTargets,
    });

    if (type && !VARIANT_TYPES.has(type)) {
      errors.push(`${contractPath}: ${fieldBase}.type must be one of ${[...VARIANT_TYPES].join(", ")}`);
    }

    if (type === "class") {
      ensureString({ value: variant.value, field: `${fieldBase}.value`, errors });
    }

    if (type === "attribute") {
      ensureString({ value: variant.attribute, field: `${fieldBase}.attribute`, errors });
      ensureStringArray({ value: variant.values, field: `${fieldBase}.values`, errors });
    }
  }
}

function validateStates({ states, contractPath, errors, allowedTargets }) {
  if (states === undefined) {
    return;
  }

  if (!Array.isArray(states)) {
    errors.push(`${contractPath}: states must be an array`);
    return;
  }

  for (const [index, state] of states.entries()) {
    const fieldBase = `states[${index}]`;
    if (!isObject(state)) {
      errors.push(`${contractPath}: ${fieldBase} must be an object`);
      continue;
    }

    ensureString({ value: state.name, field: `${fieldBase}.name`, errors });
    validateNamedTarget({
      value: state.target,
      field: `${fieldBase}.target`,
      contractPath,
      errors,
      allowedTargets,
    });
    ensureString({ value: state.attribute, field: `${fieldBase}.attribute`, errors });

    if (state.values !== undefined) {
      ensureStringArray({ value: state.values, field: `${fieldBase}.values`, errors, required: false });
    }
  }
}

function validateEvents({ events, contractPath, errors, allowedTargets }) {
  if (events === undefined) {
    return;
  }

  if (!Array.isArray(events)) {
    errors.push(`${contractPath}: events must be an array`);
    return;
  }

  for (const [index, event] of events.entries()) {
    const fieldBase = `events[${index}]`;
    if (!isObject(event)) {
      errors.push(`${contractPath}: ${fieldBase} must be an object`);
      continue;
    }

    ensureString({ value: event.name, field: `${fieldBase}.name`, errors });
    validateNamedTarget({
      value: event.source,
      field: `${fieldBase}.source`,
      contractPath,
      errors,
      allowedTargets,
    });
  }
}

function validateProps({ props, contractPath, errors, allowedTargets, variants }) {
  if (props === undefined) {
    return;
  }

  if (!Array.isArray(props)) {
    errors.push(`${contractPath}: props must be an array`);
    return;
  }

  const seenPropNames = new Set();

  for (const [index, prop] of props.entries()) {
    const fieldBase = `props[${index}]`;

    if (!isObject(prop)) {
      errors.push(`${contractPath}: ${fieldBase} must be an object`);
      continue;
    }

    const name = ensureString({ value: prop.name, field: `${fieldBase}.name`, errors });
    const kind = ensureString({ value: prop.kind, field: `${fieldBase}.kind`, errors });
    const target = validateNamedTarget({
      value: prop.target,
      field: `${fieldBase}.target`,
      contractPath,
      errors,
      allowedTargets,
    });

    if (name) {
      if (seenPropNames.has(name)) {
        errors.push(`${contractPath}: props names must be unique (${name})`);
      }

      seenPropNames.add(name);
    }

    if (kind && !PROP_KINDS.has(kind)) {
      errors.push(`${contractPath}: ${fieldBase}.kind must be one of ${[...PROP_KINDS].join(", ")}`);
      continue;
    }

    if (kind === "class-group") {
      if (!isObject(prop.values)) {
        errors.push(`${contractPath}: ${fieldBase}.values must be an object mapping prop values to class names`);
        continue;
      }

      for (const [propValue, classValue] of Object.entries(prop.values)) {
        if (propValue.trim() === "" || typeof classValue !== "string" || classValue.trim() === "") {
          errors.push(`${contractPath}: ${fieldBase}.values must map non-empty strings to non-empty class names`);
          continue;
        }

        if (target) {
          const matchingVariant = Array.isArray(variants)
            ? variants.find((variant) => (
              isObject(variant) &&
              variant.type === "class" &&
              variant.target === target &&
              variant.value === classValue
            ))
            : null;

          if (!matchingVariant) {
            errors.push(`${contractPath}: ${fieldBase}.values.${propValue} must reference a declared class variant on ${target}`);
          }
        }
      }
    }

    if (kind === "attribute") {
      ensureString({ value: prop.attribute, field: `${fieldBase}.attribute`, errors });
      if (prop.values !== undefined) {
        ensureStringArray({ value: prop.values, field: `${fieldBase}.values`, errors, required: false });
      }
    }
  }
}

async function validateDocs({ docs, contractPath, contractDir, errors, declaredExamplePaths }) {
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
      contractDir,
      errors,
    });

    if (id) {
      if (seenExampleIds.has(id)) {
        errors.push(`${contractPath}: docs example ids must be unique (${id})`);
      }

      seenExampleIds.add(id);
    }

    if (!sourcePath) {
      continue;
    }

    if (!declaredExamplePaths.has(sourcePath)) {
      errors.push(`${contractPath}: ${fieldBase}.source must point to a file already declared in files.examples`);
      continue;
    }

    if (!(await pathExists(sourcePath))) {
      errors.push(`${contractPath}: ${fieldBase}.source does not exist (${formatPath(sourcePath)})`);
      continue;
    }

    if (!id) {
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

function validateAnatomy({ anatomy, contractPath, errors }) {
  if (!Array.isArray(anatomy) || anatomy.length === 0) {
    errors.push(`${contractPath}: anatomy must be a non-empty array`);
    return [];
  }

  const names = new Set();
  const entries = [];

  for (const [index, item] of anatomy.entries()) {
    const fieldBase = `anatomy[${index}]`;
    if (!isObject(item)) {
      errors.push(`${contractPath}: ${fieldBase} must be an object`);
      continue;
    }

    const name = ensureString({ value: item.name, field: `${fieldBase}.name`, errors });
    ensureString({ value: item.selector, field: `${fieldBase}.selector`, errors });
    if (item.tag !== undefined) {
      ensureString({ value: item.tag, field: `${fieldBase}.tag`, errors });
    }
    if (item.exportName !== undefined) {
      ensureString({ value: item.exportName, field: `${fieldBase}.exportName`, errors });
      if (item.tag === undefined) {
        errors.push(`${contractPath}: ${fieldBase}.exportName requires ${fieldBase}.tag`);
      }
    }

    if (typeof item.required !== "boolean") {
      errors.push(`${contractPath}: ${fieldBase}.required must be a boolean`);
    }

    if (name) {
      if (names.has(name)) {
        errors.push(`${contractPath}: anatomy names must be unique (${name})`);
      }

      names.add(name);
      entries.push({ name, children: Array.isArray(item.children) ? item.children : [] });
    }
  }

  for (const entry of entries) {
    for (const child of entry.children) {
      if (!names.has(child)) {
        errors.push(`${contractPath}: anatomy child reference "${child}" is not declared`);
      }
    }
  }

  return entries;
}

async function validateContractEntry(entry) {
  const errors = [];
  const { contract, fullPath, contractDir } = entry;
  const contractPath = formatPath(fullPath);

  if (!isObject(contract)) {
    return [`${contractPath}: contract must be a JSON object`];
  }

  if (contract.schemaVersion !== CONTRACT_SCHEMA_VERSION) {
    errors.push(`${contractPath}: schemaVersion must be ${CONTRACT_SCHEMA_VERSION}`);
  }

  const slug = ensureString({ value: contract.slug, field: "slug", errors });
  const name = ensureString({ value: contract.name, field: "name", errors });
  const category = ensureString({ value: contract.category, field: "category", errors });
  ensureString({ value: contract.summary, field: "summary", errors });

  if (category && !CONTRACT_CATEGORIES.has(category)) {
    errors.push(`${contractPath}: category must be one of ${[...CONTRACT_CATEGORIES].join(", ")}`);
  }

  if (slug) {
    const expectedFile = `${slug}${CONTRACT_SUFFIX}`;
    const expectedDir = basename(contractDir);

    if (basename(fullPath) !== expectedFile) {
      errors.push(`${contractPath}: contract filename must be ${expectedFile}`);
    }

    if (expectedDir !== slug) {
      errors.push(`${contractPath}: component folder must match slug (${slug})`);
    }
  }

  if (!isObject(contract.files)) {
    errors.push(`${contractPath}: files must be an object`);
  }

  const cssPath = isObject(contract.files)
    ? ensureLocalFilePath({ value: contract.files.css, field: "files.css", contractDir, errors })
    : null;
  const behaviorPath = isObject(contract.files) && contract.files.behavior !== undefined
    ? ensureLocalFilePath({ value: contract.files.behavior, field: "files.behavior", contractDir, errors })
    : null;
  const examplePaths = isObject(contract.files)
    ? ensureStringArray({ value: contract.files.examples, field: "files.examples", errors })
    : [];

  if (cssPath && !(await pathExists(cssPath))) {
    errors.push(`${contractPath}: files.css does not exist (${formatPath(cssPath)})`);
  }

  if (behaviorPath && !(await pathExists(behaviorPath))) {
    errors.push(`${contractPath}: files.behavior does not exist (${formatPath(behaviorPath)})`);
  }

  const resolvedExamplePaths = [];

  for (const [index, examplePath] of examplePaths.entries()) {
    const resolvedExamplePath = ensureProjectFilePath({
      value: examplePath,
      field: `files.examples[${index}]`,
      contractDir,
      errors,
    });

    if (resolvedExamplePath) {
      resolvedExamplePaths.push(resolvedExamplePath);
    }

    if (resolvedExamplePath && !(await pathExists(resolvedExamplePath))) {
      errors.push(`${contractPath}: files.examples[${index}] does not exist (${formatPath(resolvedExamplePath)})`);
    }
  }

  const declaredExamplePaths = new Set(resolvedExamplePaths);

  if (!isObject(contract.root)) {
    errors.push(`${contractPath}: root must be an object`);
  } else {
    ensureString({ value: contract.root.tag, field: "root.tag", errors });
    ensureString({ value: contract.root.selector, field: "root.selector", errors });
    if (contract.root.exportName !== undefined) {
      ensureString({ value: contract.root.exportName, field: "root.exportName", errors });
    }
  }

  const anatomyEntries = validateAnatomy({ anatomy: contract.anatomy, contractPath, errors });
  const allowedTargets = new Set(["root", ...anatomyEntries.map((entry) => entry.name)]);
  validateVariants({ variants: contract.variants, contractPath, errors, allowedTargets });
  validateProps({ props: contract.props, contractPath, errors, allowedTargets, variants: contract.variants });
  validateStates({ states: contract.states, contractPath, errors, allowedTargets });
  validateEvents({ events: contract.events, contractPath, errors, allowedTargets });
  await validateDocs({ docs: contract.docs, contractPath, contractDir, errors, declaredExamplePaths });

  if (!isObject(contract.behavior)) {
    errors.push(`${contractPath}: behavior must be an object`);
  } else {
    const defaultMode = ensureString({ value: contract.behavior.defaultMode, field: "behavior.defaultMode", errors });
    const shim = contract.behavior.shim === undefined
      ? null
      : ensureLocalFilePath({ value: contract.behavior.shim, field: "behavior.shim", contractDir, errors });

    if (defaultMode && !BEHAVIOR_MODES.has(defaultMode)) {
      errors.push(`${contractPath}: behavior.defaultMode must be one of ${[...BEHAVIOR_MODES].join(", ")}`);
    }

    if (defaultMode === "shim-backed" && !behaviorPath) {
      errors.push(`${contractPath}: shim-backed components must declare files.behavior`);
    }

    if (defaultMode === "shim-backed" && !shim) {
      errors.push(`${contractPath}: shim-backed components must declare behavior.shim`);
    }

    if (defaultMode === "none" && (behaviorPath || shim)) {
      errors.push(`${contractPath}: behavior.defaultMode \"none\" cannot declare a shim`);
    }

    if (behaviorPath && shim && behaviorPath !== shim) {
      errors.push(`${contractPath}: behavior.shim must match files.behavior`);
    }

    if (Array.isArray(contract.behavior.overrideTargets)) {
      for (const target of contract.behavior.overrideTargets) {
        if (!FRAMEWORK_TARGETS.has(target)) {
          errors.push(`${contractPath}: unsupported behavior.overrideTargets entry (${target})`);
        }
      }
    }
  }

  if (!isObject(contract.imports)) {
    errors.push(`${contractPath}: imports must be an object`);
  }

  const cssImports = isObject(contract.imports)
    ? ensureStringArray({ value: contract.imports.css, field: "imports.css", errors })
    : [];
  const jsImports = isObject(contract.imports)
    ? ensureStringArray({ value: contract.imports.js, field: "imports.js", errors, required: false })
    : [];

  for (const cssImport of cssImports) {
    if (!cssImport.startsWith("dist/") || !cssImport.endsWith(".css")) {
      errors.push(`${contractPath}: imports.css entries must point to dist/*.css files`);
    }
  }

  for (const jsImport of jsImports) {
    if (!jsImport.startsWith("dist/") || !jsImport.endsWith(".js")) {
      errors.push(`${contractPath}: imports.js entries must point to dist/*.js files`);
    }
  }

  if (slug && cssPath) {
    const expectedCssImport = `dist/components/${slug}/${basename(cssPath)}`;
    if (!cssImports.includes(expectedCssImport)) {
      errors.push(`${contractPath}: imports.css must include ${expectedCssImport}`);
    }
  }

  if (behaviorPath && slug) {
    const expectedJsImport = `dist/components/${slug}/${basename(behaviorPath)}`;
    if (!jsImports.includes(expectedJsImport)) {
      errors.push(`${contractPath}: imports.js must include ${expectedJsImport}`);
    }
  }

  if (contract.behavior?.defaultMode === "none" && jsImports.length > 0) {
    errors.push(`${contractPath}: non-shim components should not declare imports.js`);
  }

  return errors;
}

export async function loadComponentContracts() {
  const contractFiles = await collectFiles(COMPONENTS_DIR, CONTRACT_SUFFIX);
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
      contractDir: dirname(fullPath),
      fullPath,
    });
  }

  return entries;
}

export async function validateComponentContracts({ log = true } = {}) {
  const entries = await loadComponentContracts();
  const errors = [];

  for (const entry of entries) {
    errors.push(...await validateContractEntry(entry));
  }

  if (errors.length > 0) {
    throw new Error(`Component contract validation failed:\n\n${errors.join("\n")}`);
  }

  if (log) {
    console.log(`Validated ${entries.length} component contract files.`);
  }

  return entries;
}

const isEntrypoint = process.argv[1] === fileURLToPath(import.meta.url);

if (isEntrypoint) {
  validateComponentContracts().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
