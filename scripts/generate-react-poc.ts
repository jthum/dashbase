import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadComponentContracts } from "./component-contracts.js";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const OUTPUT_DIR = join(ROOT, "generated/react");

type ContractVariant = {
  name: string;
  type: "class" | "attribute";
  target: string;
  value?: string;
  attribute?: string;
  values?: string[];
};

type ContractAnatomy = {
  name: string;
  selector: string;
  required: boolean;
  children?: string[];
  tag?: string;
  exportName?: string;
};

type ComponentContract = {
  schemaVersion: number;
  name: string;
  slug: string;
  category: "presentational" | "interactive";
  summary: string;
  root: {
    tag: string;
    selector: string;
    exportName?: string;
  };
  anatomy: ContractAnatomy[];
  variants?: ContractVariant[];
  imports: {
    css: string[];
    js?: string[];
  };
  behavior: {
    defaultMode: "none" | "shim-backed";
    shim?: string;
  };
};

type GeneratorTarget = {
  name: string;
  tag: string;
  exportName: string;
  selector: string;
  variants: ContractVariant[];
  root: boolean;
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

const RESERVED_VARIANT_PROP_NAMES = new Set([
  "children",
  "className",
  "loadAssets",
]);

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

function getGeneratorTargets(contract: ComponentContract): GeneratorTarget[] {
  const targets: GeneratorTarget[] = [];
  const usedExportNames = new Set<string>();
  const rootExportName = contract.root.exportName ?? toPascalCase(contract.slug);

  targets.push({
    name: "root",
    tag: contract.root.tag,
    exportName: rootExportName,
    selector: contract.root.selector,
    variants: getTargetVariants(contract, "root"),
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
      root: false,
    });
    usedExportNames.add(anatomy.exportName);
  }

  return targets;
}

function getRenderableAttrVariants(target: GeneratorTarget) {
  return target.variants.filter((variant) => (
    variant.type === "attribute" &&
    variant.attribute &&
    variant.name !== variant.attribute &&
    !RESERVED_VARIANT_PROP_NAMES.has(toCamelCase(variant.name))
  ));
}

function getRenderableClassVariants(target: GeneratorTarget) {
  return target.variants.filter((variant) => variant.type === "class" && variant.value);
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
  const lines: string[] = [];

  lines.push(`export type ${target.exportName}Props = ${baseType} & {`);
  if (target.root) {
    lines.push("  loadAssets?: boolean;");
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
  if (classVariants.length === 0) {
    return "className";
  }

  const variantTokens = classVariants
    .map((variant) => `${toCamelCase(variant.name)} && ${JSON.stringify(variant.value)}`)
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

    lines.push(`      ${propName}=${JSON.stringify(attribute.value)}`);
  }

  for (const variant of attrVariants) {
    const propName = toCamelCase(variant.name);
    const attrName = variant.attribute ?? variant.name;
    lines.push(`      ${attrName}={${propName}}`);
  }

  return lines.join("\n");
}

function renderComponentBlock(contract: ComponentContract, target: GeneratorTarget) {
  const refType = getRefType(target.tag);
  const classVariants = getRenderableClassVariants(target);
  const attrVariants = getRenderableAttrVariants(target);
  const propNames = [
    target.root ? "loadAssets = false" : null,
    "className",
    ...classVariants.map((variant) => toCamelCase(variant.name)),
    ...attrVariants.map((variant) => toCamelCase(variant.name)),
  ].filter(Boolean);

  const destructureLine = propNames.length > 0
    ? `{ ${propNames.join(", ")}, ...props }`
    : "props";
  const assetsConstName = getAssetsConstName(contract.slug);
  const defaultAttributeLines = renderDefaultAttributeLines(target);
  const classExpression = renderVariantClassExpression(target);
  const hookLine = target.root
    ? `  useDashbaseAssets(${assetsConstName}, loadAssets);\n`
    : "";
  const tagOpen = `<${target.tag}`;
  const tagClose = `</${target.tag}>`;

  return [
    `export const ${target.exportName} = forwardRef<${refType}, ${target.exportName}Props>(function ${target.exportName}(${destructureLine}: ${target.exportName}Props, ref) {`,
    hookLine ? hookLine.trimEnd() : "",
    "  return (",
    `    ${tagOpen}`,
    "      ref={ref}",
    defaultAttributeLines,
    "      {...props}",
    `      className={${classExpression}}`,
    "    >",
    "      {props.children}",
    `    ${tagClose}`,
    "  );",
    "});",
    `${target.exportName}.displayName = ${JSON.stringify(target.exportName)};`,
  ].filter(Boolean).join("\n");
}

function renderComponentFile(contract: ComponentContract) {
  const targets = getGeneratorTargets(contract);
  const assetsConstName = getAssetsConstName(contract.slug);

  return [
    "/* eslint-disable react-refresh/only-export-components */",
    `/* Generated by scripts/generate-react-poc.ts for ${contract.name}. */`,
    'import React, { forwardRef } from "react";',
    'import { cx, type DashbaseAssetManifest, type DashbaseCustomElementProps, useDashbaseAssets } from "./runtime";',
    "",
    `export const ${assetsConstName} = {`,
    `  css: ${JSON.stringify(contract.imports.css, null, 2)},`,
    `  js: ${JSON.stringify(contract.imports.js ?? [], null, 2)},`,
    "} as const satisfies DashbaseAssetManifest;",
    "",
    ...targets.flatMap((target) => [
      renderTypeBlock(target),
      "",
      renderComponentBlock(contract, target),
      "",
    ]),
  ].join("\n");
}

function renderRuntimeFile() {
  return [
    'import { useEffect, type HTMLAttributes, type ReactNode } from "react";',
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
    "export function useDashbaseAssets(assets: DashbaseAssetManifest, enabled = false) {",
    "  useEffect(() => {",
    "    if (!enabled) {",
    "      return;",
    "    }",
    "",
    "    for (const href of assets.css) {",
    "      ensureStylesheet(href);",
    "    }",
    "",
    "    for (const src of assets.js) {",
    "      void ensureScript(src);",
    "    }",
    "  }, [assets, enabled]);",
    "}",
    "",
    "export function cx(...tokens: Array<string | false | null | undefined>) {",
    "  return tokens.filter(Boolean).join(\" \");",
    "}",
    "",
  ].join("\n");
}

function renderCustomElementDeclarations(contracts: ComponentContract[]) {
  const tags = new Set<string>();

  for (const contract of contracts) {
    if (isCustomElementTag(contract.root.tag)) {
      tags.add(contract.root.tag);
    }

    for (const anatomy of contract.anatomy) {
      if (anatomy.tag && isCustomElementTag(anatomy.tag)) {
        tags.add(anatomy.tag);
      }
    }
  }

  return [
    'import type * as React from "react";',
    "",
    "declare global {",
    "  namespace JSX {",
    "    interface IntrinsicElements {",
    ...[...tags].sort().map((tag) => `      ${JSON.stringify(tag)}: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;`),
    "    }",
    "  }",
    "}",
    "",
    "export {};",
    "",
  ].join("\n");
}

function renderIndexFile(contracts: ComponentContract[]) {
  const exportLines = contracts
    .slice()
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .map((contract) => `export * from "./${contract.slug}";`);

  return [
    'export * from "./runtime";',
    'export * from "./manifest";',
    ...exportLines,
    "",
  ].join("\n");
}

function renderManifestFile(contracts: ComponentContract[]) {
  const lines = [
    'import type { DashbaseAssetManifest } from "./runtime";',
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
  return lines.join("\n");
}

function renderReadmeFile() {
  return [
    "# Dashbase React Proof Of Concept",
    "",
    "This folder is generated by `scripts/generate-react-poc.ts`.",
    "",
    "What it demonstrates:",
    "",
    "- Bun-native TypeScript generation with no added node modules",
    "- shim-backed React wrappers generated from Dashbase component contracts",
    "- generated asset manifests plus an optional `useDashbaseAssets(...)` helper",
    "- typed custom-element JSX declarations for Dashbase tags",
    "",
    "Current scope:",
    "",
    "- `button`",
    "- `tabs`",
    "- `popover`",
    "- `combobox`",
    "- `carousel`",
    "",
    "These files are a proof of concept, not the final published adapter format.",
    "",
  ].join("\n");
}

async function generateReactPoc() {
  const entries = await loadComponentContracts();
  const contracts = entries.map((entry) => entry.contract as ComponentContract);
  const eligibleContracts = contracts.filter((contract) => contract.root.exportName);

  await rm(OUTPUT_DIR, { recursive: true, force: true });
  await mkdir(OUTPUT_DIR, { recursive: true });

  await writeFile(join(OUTPUT_DIR, "runtime.ts"), renderRuntimeFile());
  await writeFile(join(OUTPUT_DIR, "custom-elements.d.ts"), renderCustomElementDeclarations(eligibleContracts));
  await writeFile(join(OUTPUT_DIR, "manifest.ts"), renderManifestFile(eligibleContracts));
  await writeFile(join(OUTPUT_DIR, "index.ts"), renderIndexFile(eligibleContracts));
  await writeFile(join(OUTPUT_DIR, "README.md"), renderReadmeFile());

  for (const contract of eligibleContracts) {
    await writeFile(join(OUTPUT_DIR, `${contract.slug}.tsx`), renderComponentFile(contract));
  }

  console.log(`Generated React proof-of-concept wrappers for ${eligibleContracts.length} contracts in ${join("generated", "react")}.`);
}

generateReactPoc().catch((error) => {
  console.error(error);
  process.exit(1);
});
