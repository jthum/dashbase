import { access, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadComponentContracts } from "./component-contracts.js";
import {
  loadPatternContracts,
  getPatternAllowedTokens,
  getPatternDefaultBindings,
} from "./pattern-contracts.js";
import { resolvePatternFragment } from "./pattern-composition.js";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const OUTPUT_DIR = join(ROOT, "generated/react");
const COMPONENTS_OUTPUT_DIR = join(OUTPUT_DIR, "components");
const PATTERNS_OUTPUT_DIR = join(OUTPUT_DIR, "patterns");
const COMPONENTS_DIR = join(ROOT, "src/components");

type ContractVariant = {
  name: string;
  type: "class" | "attribute";
  target: string;
  value?: string;
  attribute?: string;
  values?: string[];
};

type ContractProp = {
  name: string;
  kind: "class-group" | "attribute";
  target: string;
  values?: Record<string, string> | string[];
  attribute?: string;
};

type ContractAnatomy = {
  name: string;
  selector: string;
  required: boolean;
  children?: string[];
  tag?: string;
  exportName?: string;
};

type ContractDocExample = {
  id: string;
  title: string;
  source: string;
};

type ContractState = {
  name: string;
  target: string;
  attribute: string;
  values?: string[];
};

type ComponentContract = {
  schemaVersion: number;
  name: string;
  slug: string;
  category: "presentational" | "interactive";
  summary: string;
  docs?: {
    examples?: ContractDocExample[];
  };
  root: {
    tag: string;
    selector: string;
    exportName?: string;
  };
  anatomy: ContractAnatomy[];
  variants?: ContractVariant[];
  props?: ContractProp[];
  states?: ContractState[];
  imports: {
    css: string[];
    js?: string[];
  };
  behavior: {
    defaultMode: "none" | "shim-backed";
    shim?: string;
  };
};

type ContractEntry = {
  contract: ComponentContract;
  contractDir: string;
  fullPath: string;
};

type PatternContract = {
  schemaVersion: number;
  name: string;
  title: string;
  slug: string;
  category: string;
  family: string;
  variant: string;
  scope: "field" | "section" | "page";
  summary: string;
  tags: string[];
  files: {
    html: string;
    css?: string;
    js?: string;
  };
  dependencies: {
    components: string[];
    patterns?: string[];
  };
  props?: Array<{
    name: string;
    type: "string";
    default: string;
    description?: string;
  }>;
  slots?: Array<{
    name: string;
    defaultHtml?: string;
    description?: string;
  }>;
};

type PatternEntry = {
  contract: PatternContract;
  patternDir: string;
  fullPath: string;
};

type DashbaseAssetManifest = {
  css: string[];
  js: string[];
};

type GeneratorTarget = {
  name: string;
  tag: string;
  exportName: string;
  selector: string;
  variants: ContractVariant[];
  contractProps: ContractProp[];
  root: boolean;
};

type ResolvedDocExample = ContractDocExample & {
  exportName: string;
  htmlSnippet: string;
  reactSnippet: string;
};

const NATIVE_TAG_REF_TYPES: Record<string, string> = {
  a: "HTMLAnchorElement",
  button: "HTMLButtonElement",
  input: "HTMLInputElement",
  textarea: "HTMLTextAreaElement",
  select: "HTMLSelectElement",
};

const NATIVE_TAG_PROP_TYPES: Record<string, string> = {
  a: 'React.ComponentPropsWithoutRef<"a">',
  button: 'React.ComponentPropsWithoutRef<"button">',
  input: 'React.ComponentPropsWithoutRef<"input">',
  textarea: 'React.ComponentPropsWithoutRef<"textarea">',
  select: 'React.ComponentPropsWithoutRef<"select">',
};

const RESERVED_VARIANT_PROP_NAMES = new Set(["children", "className"]);
const VOID_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);
const JSX_ATTRIBUTE_ALIASES: Record<string, string> = {
  autocomplete: "autoComplete",
  class: "className",
  crossorigin: "crossOrigin",
  for: "htmlFor",
  inputmode: "inputMode",
  maxlength: "maxLength",
  minlength: "minLength",
  readonly: "readOnly",
  tabindex: "tabIndex",
};

function toPascalCase(value: string) {
  return value
    .split(/[^A-Za-z0-9]+/u)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join("");
}

function toCamelCase(value: string) {
  const pascal = toPascalCase(value);
  return pascal ? pascal[0].toLowerCase() + pascal.slice(1) : value;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toPosixPath(filePath: string) {
  return filePath.replaceAll("\\", "/");
}

function toImportSpecifier(fromFile: string, targetFile: string) {
  const specifier = toPosixPath(relative(dirname(fromFile), targetFile));
  return specifier.startsWith(".") ? specifier : `./${specifier}`;
}

function toAssetImportSpecifier(fromFile: string, assetPath: string) {
  if (assetPath.startsWith(".")) {
    return assetPath;
  }

  return toImportSpecifier(fromFile, join(ROOT, assetPath));
}

async function pathExists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function isCustomElementTag(tag: string) {
  return tag.includes("-");
}

function getRefType(tag: string) {
  return NATIVE_TAG_REF_TYPES[tag] ?? "HTMLElement";
}

function getPropsBaseType(tag: string) {
  return NATIVE_TAG_PROP_TYPES[tag] ?? "DashbaseCustomElementProps";
}

function getAssetsConstName(slug: string) {
  return `${toCamelCase(slug)}Assets`;
}

function extractStaticAttributes(selector: string) {
  const attributes: Array<{ name: string; value: string | true }> = [];

  for (const match of selector.matchAll(/\[([A-Za-z0-9:_-]+)(?:([*^$|~]?=)"([^"]*)")?\]/g)) {
    const [, name, operator, value] = match;

    if (operator && operator !== "=") {
      continue;
    }

    attributes.push({ name, value: operator ? value : true });
  }

  return attributes;
}

function getTargetVariants(contract: ComponentContract, targetName: string) {
  return (contract.variants ?? []).filter((variant) => variant.target === targetName);
}

function getTargetContractProps(contract: ComponentContract, targetName: string) {
  return (contract.props ?? []).filter((prop) => prop.target === targetName);
}

function getConsumedClassVariantValues(targetProps: ContractProp[]) {
  const values = new Set<string>();

  for (const prop of targetProps) {
    if (prop.kind !== "class-group" || !prop.values || Array.isArray(prop.values)) {
      continue;
    }

    for (const classValue of Object.values(prop.values)) {
      values.add(classValue);
    }
  }

  return values;
}

function getConsumedAttributeNames(targetProps: ContractProp[]) {
  const attributes = new Set<string>();

  for (const prop of targetProps) {
    if (prop.kind === "attribute" && prop.attribute) {
      attributes.add(prop.attribute);
    }
  }

  return attributes;
}

function getGeneratorTargets(contract: ComponentContract) {
  const targets: GeneratorTarget[] = [];
  const usedExportNames = new Set<string>();
  const rootExportName = contract.root.exportName ?? toPascalCase(contract.slug);

  targets.push({
    name: "root",
    tag: contract.root.tag,
    exportName: rootExportName,
    selector: contract.root.selector,
    variants: getTargetVariants(contract, "root"),
    contractProps: getTargetContractProps(contract, "root"),
    root: true,
  });
  usedExportNames.add(rootExportName);

  for (const anatomy of contract.anatomy) {
    if (!anatomy.tag || !anatomy.exportName) {
      continue;
    }

    if (anatomy.name === "root" || usedExportNames.has(anatomy.exportName)) {
      continue;
    }

    targets.push({
      name: anatomy.name,
      tag: anatomy.tag,
      exportName: anatomy.exportName,
      selector: anatomy.selector,
      variants: getTargetVariants(contract, anatomy.name),
      contractProps: getTargetContractProps(contract, anatomy.name),
      root: false,
    });
    usedExportNames.add(anatomy.exportName);
  }

  return targets;
}

function getRenderableAttrVariants(target: GeneratorTarget) {
  const consumedAttributes = getConsumedAttributeNames(target.contractProps);
  return target.variants.filter((variant) => (
    variant.type === "attribute" &&
    variant.attribute &&
    !consumedAttributes.has(variant.attribute) &&
    variant.name !== variant.attribute &&
    !RESERVED_VARIANT_PROP_NAMES.has(toCamelCase(variant.name))
  ));
}

function getRenderableClassVariants(target: GeneratorTarget) {
  const consumedClassValues = getConsumedClassVariantValues(target.contractProps);
  return target.variants.filter((variant) => (
    variant.type === "class" &&
    variant.value &&
    !consumedClassValues.has(variant.value)
  ));
}

function renderAttrValueType(values: string[] | undefined) {
  if (!values || values.length === 0) {
    return "string";
  }

  return values.map((value) => JSON.stringify(value)).join(" | ");
}

function renderTypeBlock(target: GeneratorTarget) {
  const baseType = getPropsBaseType(target.tag);
  const classVariants = getRenderableClassVariants(target);
  const attrVariants = getRenderableAttrVariants(target);
  const groupedProps = target.contractProps;
  const lines: string[] = [];

  lines.push(`export type ${target.exportName}Props = ${baseType} & {`);

  for (const prop of groupedProps) {
    if (prop.kind === "class-group" && prop.values && !Array.isArray(prop.values)) {
      lines.push(`  ${toCamelCase(prop.name)}?: ${Object.keys(prop.values).map((value) => JSON.stringify(value)).join(" | ")};`);
      continue;
    }

    if (prop.kind === "attribute") {
      lines.push(`  ${toCamelCase(prop.name)}?: ${renderAttrValueType(Array.isArray(prop.values) ? prop.values : undefined)};`);
    }
  }

  for (const variant of classVariants) {
    lines.push(`  ${toCamelCase(variant.name)}?: boolean;`);
  }

  for (const variant of attrVariants) {
    lines.push(`  ${toCamelCase(variant.name)}?: ${renderAttrValueType(variant.values)};`);
  }

  lines.push("};");
  return lines.join("\n");
}

function renderVariantClassExpression(target: GeneratorTarget) {
  const classVariants = getRenderableClassVariants(target);
  const classGroupExpressions = target.contractProps
    .filter((prop) => prop.kind === "class-group" && prop.values && !Array.isArray(prop.values))
    .map((prop) => {
      const propName = toCamelCase(prop.name);
      return `${propName} && ${JSON.stringify(prop.values)}[${propName}]`;
    });

  if (classVariants.length === 0 && classGroupExpressions.length === 0) {
    return "className";
  }

  const variantTokens = [
    ...classGroupExpressions,
    ...classVariants.map((variant) => `${toCamelCase(variant.name)} && ${JSON.stringify(variant.value)}`),
  ]
    .join(",\n        ");

  return [
    "cx(",
    "        className,",
    `        ${variantTokens},`,
    "      )",
  ].join("\n");
}

function renderDefaultAttributeLines(target: GeneratorTarget) {
  const lines: string[] = [];
  const staticAttributes = extractStaticAttributes(target.selector);
  const attrVariants = getRenderableAttrVariants(target);
  const propAttributes = new Set(
    target.contractProps
      .filter((prop) => prop.kind === "attribute" && prop.attribute)
      .map((prop) => prop.attribute as string),
  );

  for (const attribute of staticAttributes) {
    const propName = attribute.name === "class" ? "className" : attribute.name;
    if (propName === "className") {
      continue;
    }

    if (attribute.value === true) {
      lines.push(`      ${propName}`);
      continue;
    }

    const matchingVariant = attrVariants.find((variant) => variant.attribute === attribute.name);
    if (matchingVariant) {
      continue;
    }

    if (propAttributes.has(attribute.name)) {
      continue;
    }

    lines.push(`      ${propName}=${JSON.stringify(attribute.value)}`);
  }

  for (const prop of target.contractProps) {
    if (prop.kind !== "attribute" || !prop.attribute) {
      continue;
    }

    lines.push(`      ${prop.attribute}={${toCamelCase(prop.name)}}`);
  }

  for (const variant of attrVariants) {
    const propName = toCamelCase(variant.name);
    const attrName = variant.attribute ?? variant.name;
    lines.push(`      ${attrName}={${propName}}`);
  }

  return lines.join("\n");
}

function renderComponentBlock(target: GeneratorTarget) {
  const refType = getRefType(target.tag);
  const classVariants = getRenderableClassVariants(target);
  const attrVariants = getRenderableAttrVariants(target);
  const propNames = [
    "className",
    ...target.contractProps.map((prop) => toCamelCase(prop.name)),
    ...classVariants.map((variant) => toCamelCase(variant.name)),
    ...attrVariants.map((variant) => toCamelCase(variant.name)),
  ];

  const destructureLine = propNames.length > 0
    ? `{ ${propNames.join(", ")}, ...props }`
    : "props";
  const defaultAttributeLines = renderDefaultAttributeLines(target);
  const classExpression = renderVariantClassExpression(target);
  const tagOpen = `<${target.tag}`;
  const tagClose = `</${target.tag}>`;
  const isVoidTag = VOID_TAGS.has(target.tag);

  return [
    `export const ${target.exportName} = forwardRef<${refType}, ${target.exportName}Props>(function ${target.exportName}(${destructureLine}: ${target.exportName}Props, ref) {`,
    "  return (",
    `    ${tagOpen}`,
    "      ref={ref}",
    defaultAttributeLines,
    "      {...props}",
    `      className={${classExpression}}`,
    isVoidTag ? "    />" : "    >",
    isVoidTag ? "" : "      {props.children}",
    isVoidTag ? "" : `    ${tagClose}`,
    "  );",
    "});",
    `${target.exportName}.displayName = ${JSON.stringify(target.exportName)};`,
  ].filter(Boolean).join("\n");
}

function renderManualComponentFile(contract: ComponentContract) {
  const targets = getGeneratorTargets(contract);
  const assetsConstName = getAssetsConstName(contract.slug);

  return [
    "/* eslint-disable react-refresh/only-export-components */",
    `/* Generated by scripts/generate-react-poc.ts for ${contract.name}. */`,
    'import React, { forwardRef } from "react";',
    'import { cx, type DashbaseAssetManifest, type DashbaseCustomElementProps } from "../../runtime.ts";',
    "",
    `export const ${assetsConstName} = {`,
    `  css: ${JSON.stringify(contract.imports.css, null, 2)},`,
    `  js: ${JSON.stringify(contract.imports.js ?? [], null, 2)},`,
    "} as const satisfies DashbaseAssetManifest;",
    "",
    ...targets.flatMap((target) => [
      renderTypeBlock(target),
      "",
      renderComponentBlock(target),
      "",
    ]),
  ].join("\n");
}

function renderAutoEntryFile(contract: ComponentContract, outputFile: string) {
  const imports = [
    ...contract.imports.css,
    ...(contract.imports.js ?? []),
  ].map((assetPath) => `import ${JSON.stringify(toAssetImportSpecifier(outputFile, assetPath))};`);

  return [
    `/* Generated by scripts/generate-react-poc.ts for ${contract.name}. */`,
    ...imports,
    'export * from "./manual.tsx";',
    "",
  ].join("\n");
}

function renderRuntimeFile() {
  return [
    'import type { HTMLAttributes, ReactNode } from "react";',
    "",
    "export type DashbaseAssetManifest = {",
    "  css: readonly string[];",
    "  js: readonly string[];",
    "};",
    "",
    "export type DashbaseCustomElementProps = HTMLAttributes<HTMLElement> & {",
    "  children?: ReactNode;",
    "  [key: string]: unknown;",
    "};",
    "",
    "const loadedStyles = new Set<string>();",
    "const loadedScripts = new Map<string, Promise<void>>();",
    "",
    "function ensureStylesheet(href: string) {",
    "  if (typeof document === \"undefined\" || loadedStyles.has(href)) {",
    "    return;",
    "  }",
    "",
    "  const link = document.createElement(\"link\");",
    "  link.rel = \"stylesheet\";",
    "  link.href = href;",
    "  link.dataset.dashbaseGenerated = \"true\";",
    "  document.head.append(link);",
    "  loadedStyles.add(href);",
    "}",
    "",
    "function ensureScript(src: string) {",
    "  if (typeof document === \"undefined\") {",
    "    return Promise.resolve();",
    "  }",
    "",
    "  const existing = loadedScripts.get(src);",
    "  if (existing) {",
    "    return existing;",
    "  }",
    "",
    "  const promise = new Promise<void>((resolve, reject) => {",
    "    const script = document.createElement(\"script\");",
    "    script.src = src;",
    "    script.async = true;",
    "    script.dataset.dashbaseGenerated = \"true\";",
    "    script.addEventListener(\"load\", () => resolve(), { once: true });",
    "    script.addEventListener(\"error\", () => reject(new Error(`Failed to load ${src}`)), { once: true });",
    "    document.head.append(script);",
    "  });",
    "",
    "  loadedScripts.set(src, promise);",
    "  return promise;",
    "}",
    "",
    "export function loadDashbaseAssets(assets: DashbaseAssetManifest) {",
    "  for (const href of assets.css) {",
    "    ensureStylesheet(href);",
    "  }",
    "",
    "  return Promise.all(assets.js.map((src) => ensureScript(src)));",
    "}",
    "",
    "export function cx(...tokens: Array<string | false | null | undefined>) {",
    "  return tokens.filter(Boolean).join(\" \");",
    "}",
    "",
  ].join("\n");
}

function collectCustomTagsFromMarkup(markup: string) {
  const tags = new Set<string>();

  for (const match of markup.matchAll(/<\/?([a-z][a-z0-9]*-[a-z0-9-]*)(?=[\s/>])/g)) {
    tags.add(match[1]);
  }

  return tags;
}

function renderCustomElementDeclarations(tags: Iterable<string>) {
  return [
    'import type * as React from "react";',
    "",
    "declare global {",
    "  namespace JSX {",
    "    interface IntrinsicElements {",
    ...[...new Set(tags)].sort().map((tag) => `      ${JSON.stringify(tag)}: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;`),
    "    }",
    "  }",
    "}",
    "",
    "export {};",
    "",
  ].join("\n");
}

function renderPackageIndexFile() {
  return [
    'export * from "./runtime.ts";',
    'export * from "./manifest.ts";',
    "",
  ].join("\n");
}

function renderPackageManualFile(contracts: ComponentContract[], patterns: PatternContract[]) {
  const componentExportLines = contracts
    .slice()
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .map((contract) => `export * from "./components/${contract.slug}/manual.tsx";`);
  const patternExportLines = patterns
    .slice()
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .map((pattern) => `export * from "./patterns/${pattern.slug}/manual.tsx";`);

  return [
    'export * from "./runtime.ts";',
    'export * from "./manifest.ts";',
    ...componentExportLines,
    ...patternExportLines,
    "",
  ].join("\n");
}

function renderManifestFile(contracts: ComponentContract[], patternManifests: Array<{ slug: string; assets: DashbaseAssetManifest }>) {
  const lines = [
    'import type { DashbaseAssetManifest } from "./runtime.ts";',
    "",
    "export const dashbaseReactPocManifest = {",
  ];

  for (const contract of contracts.slice().sort((a, b) => a.slug.localeCompare(b.slug))) {
    lines.push(`  ${contract.slug}: {`);
    lines.push(`    css: ${JSON.stringify(contract.imports.css, null, 4)},`);
    lines.push(`    js: ${JSON.stringify(contract.imports.js ?? [], null, 4)},`);
    lines.push("  },");
  }

  lines.push("} as const satisfies Record<string, DashbaseAssetManifest>;");
  lines.push("");
  lines.push("export const dashbaseReactPocPatternManifest = {");

  for (const pattern of patternManifests.slice().sort((a, b) => a.slug.localeCompare(b.slug))) {
    lines.push(`  ${JSON.stringify(pattern.slug)}: {`);
    lines.push(`    css: ${JSON.stringify(pattern.assets.css, null, 4)},`);
    lines.push(`    js: ${JSON.stringify(pattern.assets.js, null, 4)},`);
    lines.push("  },");
  }

  lines.push("} as const satisfies Record<string, DashbaseAssetManifest>;");
  lines.push("");
  return lines.join("\n");
}

function renderPackageJson(
  contracts: ComponentContract[],
  exampleSlugs: Set<string>,
  patterns: PatternContract[],
) {
  const exports: Record<string, string> = {
    ".": "./index.ts",
    "./manual": "./manual.ts",
    "./manifest": "./manifest.ts",
    "./runtime": "./runtime.ts",
    "./custom-elements": "./custom-elements.d.ts",
    "./package.json": "./package.json",
  };

  for (const contract of contracts.slice().sort((a, b) => a.slug.localeCompare(b.slug))) {
    exports[`./${contract.slug}`] = `./components/${contract.slug}/index.ts`;
    exports[`./${contract.slug}/manual`] = `./components/${contract.slug}/manual.tsx`;

    if (exampleSlugs.has(contract.slug)) {
      exports[`./${contract.slug}/examples`] = `./components/${contract.slug}/examples.tsx`;
    }
  }

  for (const pattern of patterns.slice().sort((a, b) => a.slug.localeCompare(b.slug))) {
    exports[`./patterns/${pattern.slug}`] = `./patterns/${pattern.slug}/index.ts`;
    exports[`./patterns/${pattern.slug}/manual`] = `./patterns/${pattern.slug}/manual.tsx`;
  }

  return JSON.stringify({
    name: "@dashbase/react",
    private: true,
    type: "module",
    exports,
    peerDependencies: {
      react: ">=18",
    },
  }, null, 2) + "\n";
}

function renderPackageReadme(
  contracts: ComponentContract[],
  exampleSlugs: Set<string>,
  patterns: PatternContract[],
) {
  const lines = [
    "# Dashbase React Proof Of Concept",
    "",
    "This folder is generated by `scripts/generate-react-poc.ts`.",
    "",
    "Recommended usage:",
    "",
    "- import components from `@dashbase/react/{component}` for auto asset imports",
    "- import from `@dashbase/react/{component}/manual` when you want to manage CSS and behavior assets yourself",
    "",
    "Current pilot components:",
    "",
  ];

  for (const contract of contracts.slice().sort((a, b) => a.slug.localeCompare(b.slug))) {
    lines.push(`- \`${contract.slug}\``);
    lines.push(`  - Auto entry: \`@dashbase/react/${contract.slug}\``);
    lines.push(`  - Manual entry: \`@dashbase/react/${contract.slug}/manual\``);
    if (exampleSlugs.has(contract.slug)) {
      lines.push(`  - Generated examples: \`@dashbase/react/${contract.slug}/examples\``);
    }
  }

  if (patterns.length > 0) {
    lines.push("");
    lines.push("Current pilot patterns:");
    lines.push("");

    for (const pattern of patterns.slice().sort((a, b) => a.slug.localeCompare(b.slug))) {
      lines.push(`- \`${pattern.slug}\``);
      lines.push(`  - Auto entry: \`@dashbase/react/patterns/${pattern.slug}\``);
      lines.push(`  - Manual entry: \`@dashbase/react/patterns/${pattern.slug}/manual\``);
    }
  }

  lines.push("");
  lines.push("These files are a generated adapter proof of concept, not the final published package format.");
  lines.push("");
  return lines.join("\n");
}

function getPublicExportNames(contract: ComponentContract) {
  return getGeneratorTargets(contract).map((target) => target.exportName);
}

function stripExampleMarkers(source: string) {
  return source.replace(/<!--\s*@example\s+[^:]+:(?:start|end)\s*-->\s*/g, "");
}

function dedent(value: string) {
  const lines = value.replace(/\r\n/g, "\n").trim().split("\n");
  const indents = lines
    .filter((line) => line.trim().length > 0)
    .map((line) => line.match(/^\s*/u)?.[0].length ?? 0);
  const minIndent = indents.length > 0 ? Math.min(...indents) : 0;

  return lines
    .map((line) => line.slice(minIndent))
    .join("\n")
    .trim();
}

function selfCloseVoidTags(markup: string) {
  let output = markup;

  for (const tag of VOID_TAGS) {
    const pattern = new RegExp(`<${tag}(\\b[^>]*?)(?<!/)>`, "g");
    output = output.replace(pattern, `<${tag}$1 />`);
  }

  return output;
}

function transformHtmlSnippetToReactWithTagMap(htmlSnippet: string, tagMap = new Map<string, string>()) {
  let output = dedent(stripExampleMarkers(htmlSnippet));

  for (const [tag, exportName] of tagMap) {
    const pattern = new RegExp(`<(/?)${escapeRegExp(tag)}(?=[\\s>/])`, "g");
    output = output.replace(pattern, `<$1${exportName}`);
  }

  for (const [attribute, jsxAttribute] of Object.entries(JSX_ATTRIBUTE_ALIASES)) {
    output = output.replace(
      new RegExp(`(?<![A-Za-z0-9:-])${attribute}=`, "g"),
      `${jsxAttribute}=`,
    );
  }
  output = selfCloseVoidTags(output);

  return output;
}

function transformHtmlSnippetToReact(contract: ComponentContract, htmlSnippet: string) {
  const targets = getGeneratorTargets(contract);
  const tagMap = new Map<string, string>();

  for (const target of targets) {
    if (isCustomElementTag(target.tag)) {
      tagMap.set(target.tag, target.exportName);
    }
  }

  return transformHtmlSnippetToReactWithTagMap(htmlSnippet, tagMap);
}

function renderJsxBody(markup: string, indent = "    ") {
  return [
    `${indent}<>`,
    ...markup.split("\n").map((line) => `${indent}  ${line}`),
    `${indent}</>`,
  ];
}

function extractExampleSnippet(source: string, id: string) {
  const startMarker = `<!-- @example ${id}:start -->`;
  const endMarker = `<!-- @example ${id}:end -->`;
  const startIndex = source.indexOf(startMarker);
  const endIndex = source.indexOf(endMarker);

  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    throw new Error(`Missing example markers for ${id}.`);
  }

  return source.slice(startIndex + startMarker.length, endIndex);
}

async function resolveDocExamples(entry: ContractEntry) {
  const docsExamples = entry.contract.docs?.examples ?? [];
  const resolvedExamples: ResolvedDocExample[] = [];

  for (const docExample of docsExamples) {
    const sourcePath = resolve(entry.contractDir, docExample.source);
    const source = await readFile(sourcePath, "utf8");
    const htmlSnippet = dedent(stripExampleMarkers(extractExampleSnippet(source, docExample.id)));

    resolvedExamples.push({
      ...docExample,
      exportName: `${toPascalCase(docExample.id)}Example`,
      htmlSnippet,
      reactSnippet: transformHtmlSnippetToReact(entry.contract, htmlSnippet),
    });
  }

  return resolvedExamples;
}

function renderExamplesFile(contract: ComponentContract, examples: ResolvedDocExample[]) {
  const exportNames = getPublicExportNames(contract).join(", ");
  const exampleBlocks = examples.flatMap((example) => ([
    `export function ${example.exportName}() {`,
    "  return (",
    ...renderJsxBody(example.reactSnippet),
    "  );",
    "}",
    "",
  ]));

  return [
    `/* Generated by scripts/generate-react-poc.ts for ${contract.name}. */`,
    'import React from "react";',
    `import { ${exportNames} } from "./index.ts";`,
    "",
    ...exampleBlocks,
  ].join("\n");
}

function renderExampleCodeBlock(contract: ComponentContract, example: ResolvedDocExample) {
  const exportNames = getPublicExportNames(contract).join(", ");
  return [
    `import { ${exportNames} } from "@dashbase/react/${contract.slug}";`,
    "",
    `export function ${example.exportName}() {`,
    "  return (",
    ...renderJsxBody(example.reactSnippet, "    "),
    "  );",
    "}",
  ].join("\n");
}

function renderComponentReadme(contract: ComponentContract, examples: ResolvedDocExample[]) {
  const exportNames = getPublicExportNames(contract).join(", ");
  const autoImportPath = `@dashbase/react/${contract.slug}`;
  const manualImportPath = `@dashbase/react/${contract.slug}/manual`;
  const lines = [
    `# ${contract.name}`,
    "",
    contract.summary,
    "",
    "## Imports",
    "",
    "Default entrypoint with automatic CSS and behavior asset imports:",
    "",
    "```tsx",
    `import { ${exportNames} } from "${autoImportPath}";`,
    "```",
    "",
    "Manual entrypoint when you want to control asset loading yourself:",
    "",
    "```tsx",
    `import { ${exportNames}, ${getAssetsConstName(contract.slug)} } from "${manualImportPath}";`,
    "```",
    "",
    "## Anatomy",
    "",
    `- \`${contract.root.exportName ?? toPascalCase(contract.slug)}\` renders \`<${contract.root.tag}>\``,
  ];
  const seenAnatomyExports = new Set([contract.root.exportName ?? toPascalCase(contract.slug)]);

  for (const anatomy of contract.anatomy) {
    if (!anatomy.exportName || !anatomy.tag || seenAnatomyExports.has(anatomy.exportName)) {
      continue;
    }

    seenAnatomyExports.add(anatomy.exportName);
    lines.push(`- \`${anatomy.exportName}\` renders \`<${anatomy.tag}>\``);
  }

  lines.push("");
  lines.push("## Assets");
  lines.push("");

  for (const cssPath of contract.imports.css) {
    lines.push(`- CSS: \`${cssPath}\``);
  }

  for (const jsPath of contract.imports.js ?? []) {
    lines.push(`- JS: \`${jsPath}\``);
  }

  if ((contract.imports.js ?? []).length === 0) {
    lines.push("- No behavior shim is required.");
  }

  if ((contract.variants ?? []).length > 0) {
    lines.push("");
    lines.push("## Variants");
    lines.push("");

    for (const variant of contract.variants ?? []) {
      if (variant.type === "class") {
        lines.push(`- \`${toCamelCase(variant.name)}\` adds \`.${variant.value}\` on \`${variant.target}\``);
      } else {
        lines.push(`- \`${toCamelCase(variant.name)}\` maps to \`${variant.attribute}\` on \`${variant.target}\``);
      }
    }
  }

  if ((contract.props ?? []).length > 0) {
    lines.push("");
    lines.push("## Adapter Props");
    lines.push("");

    for (const prop of contract.props ?? []) {
      if (prop.kind === "class-group" && prop.values && !Array.isArray(prop.values)) {
        lines.push(`- \`${toCamelCase(prop.name)}\` accepts ${Object.keys(prop.values).map((value) => `\`${value}\``).join(", ")} and maps them to classes on \`${prop.target}\``);
        continue;
      }

      if (prop.kind === "attribute") {
        const values = Array.isArray(prop.values) && prop.values.length > 0
          ? ` (${prop.values.map((value) => `\`${value}\``).join(", ")})`
          : "";
        lines.push(`- \`${toCamelCase(prop.name)}\` maps to \`${prop.attribute}\` on \`${prop.target}\`${values}`);
      }
    }
  }

  if ((contract.states ?? []).length > 0) {
    lines.push("");
    lines.push("## State Surface");
    lines.push("");

    for (const state of contract.states ?? []) {
      const values = Array.isArray(state.values) && state.values.length > 0
        ? ` (${state.values.map((value) => JSON.stringify(value)).join(", ")})`
        : "";
      lines.push(`- \`${state.attribute}\` on \`${state.target}\`${values}`);
    }
  }

  if (examples.length > 0) {
    lines.push("");
    lines.push("## Examples");
    lines.push("");

    for (const example of examples) {
      lines.push(`### ${example.title}`);
      lines.push("");
      lines.push("```tsx");
      lines.push(renderExampleCodeBlock(contract, example));
      lines.push("```");
      lines.push("");
    }
  }

  return lines.join("\n");
}

function getPatternPropsTypeName(contract: PatternContract) {
  return `${getPatternExportName(contract)}Props`;
}

function getPatternSlotRenderName(slotName: string) {
  return `rendered${toPascalCase(slotName)}`;
}

function transformPatternTokensToReact(markup: string, contract: PatternContract) {
  const bindingNames = new Set([
    ...(contract.props ?? []).map((prop) => prop.name),
    ...(contract.slots ?? []).map((slot) => slot.name),
  ]);

  let output = markup;

  for (const name of bindingNames) {
    const escapedName = escapeRegExp(name);
    output = output.replace(
      new RegExp(`=([\"'])\\s*\\{\\{\\s*${escapedName}\\s*\\}\\}\\s*\\1`, "g"),
      `={${toCamelCase(name)}}`,
    );
  }

  for (const name of bindingNames) {
    const escapedName = escapeRegExp(name);
    output = output.replace(
      new RegExp(`\\{\\{\\s*${escapedName}\\s*\\}\\}`, "g"),
      `{${toCamelCase(name)}}`,
    );
  }

  return output;
}

function renderPatternPropsType(contract: PatternContract) {
  const lines = [`export type ${getPatternPropsTypeName(contract)} = {`];

  for (const prop of contract.props ?? []) {
    lines.push(`  ${toCamelCase(prop.name)}?: string;`);
  }

  for (const slot of contract.slots ?? []) {
    lines.push(`  ${toCamelCase(slot.name)}?: React.ReactNode;`);
  }

  lines.push("};");
  return lines.join("\n");
}

function patternHasAdapterBindings(contract: PatternContract) {
  return (contract.props ?? []).length > 0 || (contract.slots ?? []).length > 0;
}

function getPatternExportName(contract: PatternContract) {
  return toPascalCase(contract.slug);
}

function dedupeStrings(values: string[]) {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const value of values) {
    if (seen.has(value)) {
      continue;
    }

    seen.add(value);
    unique.push(value);
  }

  return unique;
}

async function buildComponentAssetCatalog(componentEntries: ContractEntry[]) {
  const catalog = new Map<string, DashbaseAssetManifest>();

  for (const entry of componentEntries) {
    catalog.set(entry.contract.slug, {
      css: [...entry.contract.imports.css],
      js: [...(entry.contract.imports.js ?? [])],
    });
  }

  const componentDirs = await readdir(COMPONENTS_DIR, { withFileTypes: true });

  for (const entry of componentDirs) {
    if (!entry.isDirectory()) {
      continue;
    }

    const slug = entry.name;
    if (catalog.has(slug)) {
      continue;
    }

    const cssPath = join(COMPONENTS_DIR, slug, `${slug}.css`);
    const jsPath = join(COMPONENTS_DIR, slug, `${slug}.js`);
    const css: string[] = [];
    const js: string[] = [];

    if (await pathExists(cssPath)) {
      css.push(`dist/components/${slug}/${slug}.css`);
    }

    if (await pathExists(jsPath)) {
      js.push(`dist/components/${slug}/${slug}.js`);
    }

    catalog.set(slug, { css, js });
  }

  return catalog;
}

async function resolveOptionalPatternStyles(entry: PatternEntry) {
  try {
    return await resolvePatternFragment(entry, "pattern-styles");
  } catch {
    return null;
  }
}

async function resolvePatternAssets(
  entry: PatternEntry,
  patternEntriesBySlug: Map<string, PatternEntry>,
  componentAssetCatalog: Map<string, DashbaseAssetManifest>,
  stack = new Set<string>(),
): Promise<DashbaseAssetManifest> {
  if (stack.has(entry.contract.slug)) {
    return { css: [], js: [] };
  }

  const nextStack = new Set(stack);
  nextStack.add(entry.contract.slug);

  const css: string[] = [];
  const js: string[] = [];

  for (const patternSlug of entry.contract.dependencies.patterns ?? []) {
    const dependencyEntry = patternEntriesBySlug.get(patternSlug);
    if (!dependencyEntry) {
      continue;
    }

    const dependencyAssets = await resolvePatternAssets(
      dependencyEntry,
      patternEntriesBySlug,
      componentAssetCatalog,
      nextStack,
    );
    css.push(...dependencyAssets.css);
    js.push(...dependencyAssets.js);
  }

  for (const componentSlug of entry.contract.dependencies.components) {
    const assets = componentAssetCatalog.get(componentSlug);
    if (!assets) {
      continue;
    }

    css.push(...assets.css);
    js.push(...assets.js);
  }

  if (entry.contract.files.css) {
    css.push(toPosixPath(relative(ROOT, resolve(entry.patternDir, entry.contract.files.css))));
  }

  if (entry.contract.files.js) {
    js.push(toPosixPath(relative(ROOT, resolve(entry.patternDir, entry.contract.files.js))));
  }

  return {
    css: dedupeStrings(css),
    js: dedupeStrings(js),
  };
}

function renderPatternManualFile(
  entry: PatternEntry,
  reactSnippet: string,
  assets: DashbaseAssetManifest,
  outputFile: string,
) {
  const exportName = getPatternExportName(entry.contract);
  const propsTypeName = getPatternPropsTypeName(entry.contract);
  const assetsConstName = getAssetsConstName(entry.contract.slug);
  const runtimeImport = `${"../".repeat(entry.contract.slug.split("/").length + 1)}runtime.ts`;
  const hasBindings = patternHasAdapterBindings(entry.contract);
  const defaultAssignments = [
    ...(entry.contract.props ?? []).map((prop) => `  const ${toCamelCase(prop.name)} = props.${toCamelCase(prop.name)} ?? ${JSON.stringify(prop.default)};`),
    ...(entry.contract.slots ?? []).map((slot) => {
      const slotName = toCamelCase(slot.name);
      const defaultHtml = slot.defaultHtml ?? "";

      if (defaultHtml.trim().length === 0) {
        return `  const ${slotName} = props.${slotName};`;
      }

      const renderName = getPatternSlotRenderName(slot.name);
      const defaultMarkup = transformPatternTokensToReact(
        transformHtmlSnippetToReactWithTagMap(defaultHtml),
        entry.contract,
      );
      return [
        `  const ${renderName} = props.${slotName} ?? (`,
        "    <>",
        ...defaultMarkup.split("\n").map((line) => `      ${line}`),
        "    </>",
        "  );",
        `  const ${slotName} = ${renderName};`,
      ].join("\n");
    }),
  ].join("\n");
  const snippetWithSlotFallbacks = (entry.contract.slots ?? []).reduce((markup, slot) => {
    const defaultHtml = slot.defaultHtml ?? "";
    if (defaultHtml.trim().length === 0) {
      return markup;
    }

    const token = `{${toCamelCase(slot.name)}}`;
    return markup.replaceAll(token, `{${getPatternSlotRenderName(slot.name)}}`);
  }, reactSnippet);

  return [
    `/* Generated by scripts/generate-react-poc.ts for ${entry.contract.title}. */`,
    'import React from "react";',
    `import type { DashbaseAssetManifest } from ${JSON.stringify(runtimeImport)};`,
    "",
    `export const ${assetsConstName} = {`,
    `  css: ${JSON.stringify(assets.css, null, 2)},`,
    `  js: ${JSON.stringify(assets.js, null, 2)},`,
    "} as const satisfies DashbaseAssetManifest;",
    "",
    ...(hasBindings ? [renderPatternPropsType(entry.contract), ""] : []),
    `export function ${exportName}${hasBindings ? `(props: ${propsTypeName})` : "()"} {`,
    ...(defaultAssignments.trim().length > 0 ? [defaultAssignments] : []),
    "  return (",
    ...renderJsxBody(snippetWithSlotFallbacks),
    "  );",
    "}",
    "",
  ].join("\n");
}

function renderPatternAutoEntryFile(entry: PatternEntry, assets: DashbaseAssetManifest, outputFile: string) {
  const imports = [
    ...assets.css,
    ...assets.js,
  ].map((assetPath) => `import ${JSON.stringify(toAssetImportSpecifier(outputFile, assetPath))};`);

  return [
    `/* Generated by scripts/generate-react-poc.ts for ${entry.contract.title}. */`,
    ...imports,
    'export * from "./manual.tsx";',
    "",
  ].join("\n");
}

function renderPatternReadme(entry: PatternEntry, assets: DashbaseAssetManifest, reactSnippet: string) {
  const exportName = getPatternExportName(entry.contract);
  const autoImportPath = `@dashbase/react/patterns/${entry.contract.slug}`;
  const manualImportPath = `@dashbase/react/patterns/${entry.contract.slug}/manual`;
  const assetsConstName = getAssetsConstName(entry.contract.slug);

  const lines = [
    `# ${entry.contract.title}`,
    "",
    entry.contract.summary,
    "",
    "## Imports",
    "",
    "Default entrypoint with automatic CSS and behavior asset imports:",
    "",
    "```tsx",
    `import { ${exportName} } from "${autoImportPath}";`,
    "```",
    "",
    "Manual entrypoint when you want to control asset loading yourself:",
    "",
    "```tsx",
    `import { ${exportName}, ${assetsConstName} } from "${manualImportPath}";`,
    "```",
    "",
    "## Scope",
    "",
    `- Category: \`${entry.contract.category}\``,
    `- Family: \`${entry.contract.family}\``,
    `- Variant: \`${entry.contract.variant}\``,
    `- Scope: \`${entry.contract.scope}\``,
    "",
    "## Dependencies",
    "",
    `- Components: ${(entry.contract.dependencies.components ?? []).length > 0 ? entry.contract.dependencies.components.map((value) => `\`${value}\``).join(", ") : "none"}`,
    `- Patterns: ${(entry.contract.dependencies.patterns ?? []).length > 0 ? entry.contract.dependencies.patterns.map((value) => `\`${value}\``).join(", ") : "none"}`,
    "",
    "## Assets",
    "",
  ];

  for (const cssPath of assets.css) {
    lines.push(`- CSS: \`${cssPath}\``);
  }

  for (const jsPath of assets.js) {
    lines.push(`- JS: \`${jsPath}\``);
  }

  if (assets.css.length === 0 && assets.js.length === 0) {
    lines.push("- No additional assets are required.");
  }

  lines.push("");
  lines.push("## Usage");
  lines.push("");
  lines.push("```tsx");
  lines.push(`import { ${exportName} } from "${autoImportPath}";`);
  lines.push("");
  lines.push("export function Example() {");
  lines.push("  return (");
  lines.push(`    <${exportName} />`);
  lines.push("  );");
  lines.push("}");
  lines.push("```");
  lines.push("");

  if ((entry.contract.props ?? []).length > 0) {
    lines.push("## Adapter Props");
    lines.push("");

    for (const prop of entry.contract.props ?? []) {
      const description = prop.description ? ` ${prop.description}` : "";
      lines.push(`- \`${toCamelCase(prop.name)}?: string\`` + description + ` Default: ${JSON.stringify(prop.default)}.`);
    }

    lines.push("");
  }

  if ((entry.contract.slots ?? []).length > 0) {
    lines.push("## Slots");
    lines.push("");

    for (const slot of entry.contract.slots ?? []) {
      const description = slot.description ? ` ${slot.description}` : "";
      const defaultText = (slot.defaultHtml ?? "").trim().length > 0
        ? "Includes default fallback markup."
        : "No default fallback markup.";
      lines.push(`- \`${toCamelCase(slot.name)}?: React.ReactNode\`` + description + ` ${defaultText}`);
    }

    lines.push("");
  }

  lines.push("## Rendered Structure");
  lines.push("");
  lines.push("```tsx");
  lines.push(reactSnippet);
  lines.push("```");
  lines.push("");

  return lines.join("\n");
}

async function ensureDir(filePath: string) {
  await mkdir(dirname(filePath), { recursive: true });
}

async function writeTextFile(filePath: string, source: string) {
  await ensureDir(filePath);
  await writeFile(filePath, source);
}

async function generateReactPoc() {
  const componentEntries = await loadComponentContracts() as ContractEntry[];
  const eligibleComponentEntries = componentEntries.filter((entry) => entry.contract.root.exportName);
  const contracts = eligibleComponentEntries.map((entry) => entry.contract);
  const patternEntries = await loadPatternContracts() as PatternEntry[];
  const patternContracts = patternEntries.map((entry) => entry.contract);
  const patternEntriesBySlug = new Map(patternEntries.map((entry) => [entry.contract.slug, entry]));
  const componentAssetCatalog = await buildComponentAssetCatalog(eligibleComponentEntries);
  const patternManifests: Array<{ slug: string; assets: DashbaseAssetManifest }> = [];
  const exampleSlugs = new Set<string>();
  const exampleTags = new Set<string>();
  const patternTags = new Set<string>();

  await rm(OUTPUT_DIR, { recursive: true, force: true });
  await mkdir(COMPONENTS_OUTPUT_DIR, { recursive: true });
  await mkdir(PATTERNS_OUTPUT_DIR, { recursive: true });

  await writeTextFile(join(OUTPUT_DIR, "runtime.ts"), renderRuntimeFile());
  await writeTextFile(join(OUTPUT_DIR, "index.ts"), renderPackageIndexFile());
  await writeTextFile(join(OUTPUT_DIR, "manual.ts"), renderPackageManualFile(contracts, patternContracts));

  for (const entry of eligibleComponentEntries) {
    const { contract } = entry;
    const componentDir = join(COMPONENTS_OUTPUT_DIR, contract.slug);
    const manualFile = join(componentDir, "manual.tsx");
    const autoEntryFile = join(componentDir, "index.ts");
    const readmeFile = join(componentDir, "README.md");
    const resolvedExamples = await resolveDocExamples(entry);

    await writeTextFile(manualFile, renderManualComponentFile(contract));
    await writeTextFile(autoEntryFile, renderAutoEntryFile(contract, autoEntryFile));
    await writeTextFile(readmeFile, renderComponentReadme(contract, resolvedExamples));

    if (resolvedExamples.length > 0) {
      exampleSlugs.add(contract.slug);
      for (const example of resolvedExamples) {
        for (const tag of collectCustomTagsFromMarkup(example.reactSnippet)) {
          exampleTags.add(tag);
        }
      }

      await writeTextFile(
        join(componentDir, "examples.tsx"),
        renderExamplesFile(contract, resolvedExamples),
      );
    }
  }

  for (const entry of patternEntries) {
    const patternDir = join(PATTERNS_OUTPUT_DIR, entry.contract.slug);
    const manualFile = join(patternDir, "manual.tsx");
    const autoEntryFile = join(patternDir, "index.ts");
    const readmeFile = join(patternDir, "README.md");
    const resolvedPatternSnippet = await resolvePatternFragment(entry, "pattern", {
      allowedTokens: getPatternAllowedTokens(entry.contract),
    });
    const resolvedPatternStyles = await resolveOptionalPatternStyles(entry);
    const reactSnippet = transformPatternTokensToReact(
      transformHtmlSnippetToReactWithTagMap(resolvedPatternSnippet),
      entry.contract,
    );
    const assets = await resolvePatternAssets(entry, patternEntriesBySlug, componentAssetCatalog);

    if (resolvedPatternStyles && resolvedPatternStyles.trim().length > 0) {
      assets.css = dedupeStrings(["./pattern.css", ...assets.css]);
      await writeTextFile(
        join(patternDir, "pattern.css"),
        `${resolvedPatternStyles.trim()}\n`,
      );
    }

    patternManifests.push({
      slug: entry.contract.slug,
      assets,
    });

    for (const tag of collectCustomTagsFromMarkup(reactSnippet)) {
      patternTags.add(tag);
    }

    await writeTextFile(manualFile, renderPatternManualFile(entry, reactSnippet, assets, manualFile));
    await writeTextFile(autoEntryFile, renderPatternAutoEntryFile(entry, assets, autoEntryFile));
    await writeTextFile(readmeFile, renderPatternReadme(entry, assets, reactSnippet));
  }

  await writeTextFile(join(OUTPUT_DIR, "manifest.ts"), renderManifestFile(contracts, patternManifests));

  const declarationTags = new Set<string>();

  for (const contract of contracts) {
    if (isCustomElementTag(contract.root.tag)) {
      declarationTags.add(contract.root.tag);
    }

    for (const anatomy of contract.anatomy) {
      if (anatomy.tag && isCustomElementTag(anatomy.tag)) {
        declarationTags.add(anatomy.tag);
      }
    }
  }

  for (const tag of exampleTags) {
    declarationTags.add(tag);
  }

  for (const tag of patternTags) {
    declarationTags.add(tag);
  }

  await writeTextFile(join(OUTPUT_DIR, "custom-elements.d.ts"), renderCustomElementDeclarations(declarationTags));
  await writeTextFile(join(OUTPUT_DIR, "package.json"), renderPackageJson(contracts, exampleSlugs, patternContracts));
  await writeTextFile(join(OUTPUT_DIR, "README.md"), renderPackageReadme(contracts, exampleSlugs, patternContracts));

  console.log(`Generated package-style React proof-of-concept output for ${contracts.length} component contracts and ${patternContracts.length} patterns in ${join("generated", "react")}.`);
}

generateReactPoc().catch((error) => {
  console.error(error);
  process.exit(1);
});
