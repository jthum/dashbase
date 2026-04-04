import { access, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadComponentContracts } from "../../contracts/component-contracts.js";
import {
  getPatternAllowedTokens,
  loadPatternContracts,
} from "../../contracts/pattern-contracts.js";
import { resolvePatternFragment } from "../../patterns/pattern-composition.js";

const ROOT = fileURLToPath(new URL("../../..", import.meta.url));
const OUTPUT_DIR = join(ROOT, "generated/vue");
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

type ContractAccessibility = {
  focusModel?: "native" | "roving-tabindex" | "active-descendant";
  requiredAttributes?: Array<{
    target: string;
    attributes: string[];
  }>;
  relationships?: Array<{
    from: string;
    attribute: string;
    to: string;
  }>;
  keyboardInteractions?: Array<{
    target: string;
    key: string;
    effect: string;
  }>;
};

type ContractAdapterMeta = {
  mode?: "generated" | "browser-shim" | "controller-backed" | "native";
  clientOnly?: boolean;
  notes?: string[];
  eventMap?: Record<string, string>;
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
  accessibility?: ContractAccessibility;
  adapters?: Partial<Record<"react" | "svelte" | "vue" | "solid", ContractAdapterMeta>>;
  imports: {
    css: string[];
    js?: string[];
  };
  behavior: {
    defaultMode: "none" | "shim-backed";
    shim?: string;
    clientOnly?: boolean;
    lifecycle?: {
      init?: string;
      destroy?: string;
      boot?: string;
    };
    domOwnership?: "adapter-safe" | "shim-mutates-live-state";
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
  vueSnippet: string;
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

function getTargetAdapterMeta(contract: ComponentContract, target: "react" | "svelte" | "vue" | "solid") {
  return contract.adapters?.[target];
}

function getGeneratedAdapterMode(contract: ComponentContract, target: "react" | "svelte" | "vue" | "solid") {
  return getTargetAdapterMeta(contract, target)?.mode
    ?? (contract.behavior.defaultMode === "shim-backed" ? "browser-shim" : "generated");
}

function isClientHostedComponent(contract: ComponentContract, target: "react" | "svelte" | "vue" | "solid") {
  return getTargetAdapterMeta(contract, target)?.clientOnly ?? contract.behavior.clientOnly ?? false;
}

function getAdapterNotes(contract: ComponentContract, target: "react" | "svelte" | "vue" | "solid") {
  return getTargetAdapterMeta(contract, target)?.notes ?? [];
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

    attributes.push({
      name,
      value: value ?? true,
    });
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

    for (const value of Object.values(prop.values)) {
      values.add(value);
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
  const targets: GeneratorTarget[] = [
    {
      name: "root",
      tag: contract.root.tag,
      exportName: contract.root.exportName ?? contract.name,
      selector: contract.root.selector,
      variants: getTargetVariants(contract, "root"),
      contractProps: getTargetContractProps(contract, "root"),
      root: true,
    },
  ];

  for (const anatomy of contract.anatomy) {
    if (!anatomy.exportName) {
      continue;
    }

    targets.push({
      name: anatomy.name,
      tag: anatomy.tag ?? contract.root.tag,
      exportName: anatomy.exportName,
      selector: anatomy.selector,
      variants: getTargetVariants(contract, anatomy.name),
      contractProps: getTargetContractProps(contract, anatomy.name),
      root: false,
    });
  }

  const seen = new Set<string>();
  const uniqueTargets: GeneratorTarget[] = [];

  for (const target of targets) {
    const key = `${target.exportName}::${target.tag}::${target.selector}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    uniqueTargets.push(target);
  }

  return uniqueTargets;
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

function renderValueType(values: string[] | undefined) {
  if (!values || values.length === 0) {
    return "string";
  }

  return values.map((value) => JSON.stringify(value)).join(" | ");
}

function getRenderableClassVariants(target: GeneratorTarget) {
  const consumedValues = getConsumedClassVariantValues(target.contractProps);
  return target.variants.filter((variant) => variant.type === "class" && variant.value && !consumedValues.has(variant.value));
}

function getRenderableAttrVariants(target: GeneratorTarget) {
  const consumedAttributeNames = getConsumedAttributeNames(target.contractProps);
  return target.variants.filter((variant) => variant.type === "attribute" && variant.attribute && !consumedAttributeNames.has(variant.attribute));
}

function renderVuePropsType(target: GeneratorTarget) {
  const lines = ["interface Props {"];

  for (const variant of getRenderableClassVariants(target)) {
    lines.push(`  ${toCamelCase(variant.name)}?: boolean;`);
  }

  for (const prop of target.contractProps) {
    if (prop.kind === "class-group" && prop.values && !Array.isArray(prop.values)) {
      lines.push(`  ${toCamelCase(prop.name)}?: ${Object.keys(prop.values).map((value) => JSON.stringify(value)).join(" | ")};`);
      continue;
    }

    if (prop.kind === "attribute") {
      lines.push(`  ${toCamelCase(prop.name)}?: ${renderValueType(Array.isArray(prop.values) ? prop.values : undefined)};`);
    }
  }

  lines.push("}");
  return lines.join("\n");
}

function renderVueStaticAttributeLines(target: GeneratorTarget) {
  const consumedAttributeNames = getConsumedAttributeNames(target.contractProps);
  const lines: string[] = [];

  for (const attribute of extractStaticAttributes(target.selector)) {
    if (attribute.name === "class" || consumedAttributeNames.has(attribute.name)) {
      continue;
    }

    if (attribute.value === true) {
      lines.push(`  ${attribute.name}`);
    } else {
      lines.push(`  ${attribute.name}=${JSON.stringify(attribute.value)}`);
    }
  }

  for (const variant of getRenderableAttrVariants(target)) {
    if (!variant.attribute) {
      continue;
    }

    if (variant.values && variant.values.length > 0) {
      lines.push(`  :${variant.attribute}="${toCamelCase(variant.name)}"`);
    } else {
      lines.push(`  ${variant.attribute}`);
    }
  }

  for (const prop of target.contractProps) {
    if (prop.kind === "attribute" && prop.attribute) {
      lines.push(`  :${prop.attribute}="${toCamelCase(prop.name)}"`);
    }
  }

  return lines;
}

function renderVueClassExpression(target: GeneratorTarget) {
  const entries = ["attrs.class"];

  for (const variant of getRenderableClassVariants(target)) {
    entries.push(`${toCamelCase(variant.name)} && ${JSON.stringify(variant.value)}`);
  }

  for (const prop of target.contractProps) {
    if (prop.kind !== "class-group" || !prop.values || Array.isArray(prop.values)) {
      continue;
    }

    const mapping = JSON.stringify(prop.values);
    entries.push(`${toCamelCase(prop.name)} && ${mapping}[${toCamelCase(prop.name)}]`);
  }

  return `cx(${entries.join(", ")})`;
}

function renderVueDestructure(target: GeneratorTarget) {
  const parts: string[] = [];

  for (const variant of getRenderableClassVariants(target)) {
    parts.push(`${toCamelCase(variant.name)} = false`);
  }

  for (const prop of target.contractProps) {
    parts.push(toCamelCase(prop.name));
  }

  return parts.length > 0
    ? `const { ${parts.join(", ")} } = defineProps<Props>();`
    : "defineProps<Props>();";
}

function renderVueComponentMarkup(target: GeneratorTarget) {
  const lines = [`<${target.tag}`];
  lines.push('  v-bind="omitClass(attrs)"');
  lines.push(...renderVueStaticAttributeLines(target));
  lines.push(`  :class="${renderVueClassExpression(target)}"`);

  if (["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"].includes(target.tag)) {
    lines[lines.length - 1] += " />";
    return lines;
  }

  lines.push(">");
  lines.push("  <slot />");
  lines.push(`</${target.tag}>`);
  return lines;
}

function renderVueComponentFile(
  target: GeneratorTarget,
  assets: DashbaseAssetManifest,
  outputFile: string,
  autoImports: boolean,
) {
  const lines: string[] = [];

  if (autoImports && (assets.css.length > 0 || assets.js.length > 0)) {
    lines.push("<script setup lang=\"ts\">");
    for (const asset of [...assets.css, ...assets.js]) {
      lines.push(`  import ${JSON.stringify(toAssetImportSpecifier(outputFile, asset))};`);
    }
  } else {
    lines.push("<script setup lang=\"ts\">");
  }

  lines.push('  import { useAttrs } from "vue";');
  lines.push('  import { cx, omitClass } from "../../runtime.ts";');
  lines.push("");
  lines.push("  defineOptions({ inheritAttrs: false });");
  lines.push("");
  for (const line of renderVuePropsType(target).split("\n")) {
    lines.push(`  ${line}`);
  }
  lines.push("");
  lines.push(`  ${renderVueDestructure(target)}`);
  lines.push("  defineSlots<{ default?: () => any }>();");
  lines.push("  const attrs = useAttrs();");
  lines.push("</script>");
  lines.push("");
  lines.push("<template>");
  for (const line of renderVueComponentMarkup(target)) {
    lines.push(`  ${line}`);
  }
  lines.push("</template>");
  lines.push("");
  return lines.join("\n");
}

function renderComponentManualIndex(
  contract: ComponentContract,
  targets: GeneratorTarget[],
  assets: DashbaseAssetManifest,
) {
  const lines = [
    `/* Generated by scripts/targets/vue/generate.ts for ${contract.name}. */`,
    'import type { DashbaseAssetManifest } from "../../runtime.ts";',
    "",
    `export const ${getAssetsConstName(contract.slug)} = {`,
    `  css: ${JSON.stringify(assets.css, null, 2)},`,
    `  js: ${JSON.stringify(assets.js, null, 2)},`,
    "} as const satisfies DashbaseAssetManifest;",
    "",
  ];

  const exported = new Set<string>();

  for (const target of targets) {
    if (exported.has(target.exportName)) {
      continue;
    }
    exported.add(target.exportName);
    lines.push(`export { default as ${target.exportName} } from "./${target.exportName}Manual.vue";`);
  }

  lines.push("");
  return lines.join("\n");
}

function renderComponentAutoIndex(contract: ComponentContract, targets: GeneratorTarget[]) {
  const lines = [`/* Generated by scripts/targets/vue/generate.ts for ${contract.name}. */`];

  if (getGeneratedAdapterMode(contract, "vue") === "browser-shim") {
    lines.push("/* This entrypoint auto-imports a browser shim. In SSR runtimes, mount it from a client boundary or after client hydration. */");
  }

  const exported = new Set<string>();
  for (const target of targets) {
    if (exported.has(target.exportName)) {
      continue;
    }
    exported.add(target.exportName);
    lines.push(`export { default as ${target.exportName} } from "./${target.exportName}.vue";`);
  }
  lines.push("");
  return lines.join("\n");
}

function renderRuntimeFile() {
  return [
    "export type DashbaseAssetManifest = {",
    "  css: string[];",
    "  js: string[];",
    "};",
    "",
    "export function cx(...values: Array<unknown>) {",
    "  const parts: string[] = [];",
    "  for (const value of values) {",
    "    if (!value) continue;",
    "    if (typeof value === \"string\") {",
    "      if (value.trim()) parts.push(value);",
      "      continue;",
    "    }",
    "    if (Array.isArray(value)) {",
    "      const nested = cx(...value);",
    "      if (nested) parts.push(nested);",
    "      continue;",
    "    }",
    "    if (typeof value !== \"object\") {",
    "      parts.push(String(value));",
    "      continue;",
    "    }",
    "    for (const [key, enabled] of Object.entries(value)) {",
    "      if (enabled && key.trim()) parts.push(key);",
    "    }",
    "  }",
    "  return parts.join(\" \");",
    "}",
    "",
    "export function omitClass(source: Record<string, unknown>) {",
    "  const { class: _class, ...rest } = source;",
    "  return rest;",
    "}",
    "",
  ].join("\n");
}

function renderPackageIndexFile(contracts: ComponentContract[], patterns: PatternContract[]) {
  const lines = ["/* Generated by scripts/targets/vue/generate.ts. */"];
  for (const contract of contracts) {
    lines.push(`export * from "./components/${contract.slug}/index.ts";`);
  }
  for (const pattern of patterns) {
    lines.push(`export * from "./patterns/${pattern.slug}/index.ts";`);
  }
  lines.push('export * from "./runtime.ts";');
  lines.push('export * from "./manifest.ts";');
  lines.push("");
  return lines.join("\n");
}

function renderPackageManualFile(contracts: ComponentContract[], patterns: PatternContract[]) {
  const lines = ["/* Generated by scripts/targets/vue/generate.ts. */"];
  for (const contract of contracts) {
    lines.push(`export * from "./components/${contract.slug}/manual.ts";`);
  }
  for (const pattern of patterns) {
    lines.push(`export * from "./patterns/${pattern.slug}/manual.ts";`);
  }
  lines.push('export * from "./runtime.ts";');
  lines.push('export * from "./manifest.ts";');
  lines.push("");
  return lines.join("\n");
}

function renderManifestFile(
  contracts: ComponentContract[],
  patternManifests: Array<{ slug: string; assets: DashbaseAssetManifest }>,
) {
  const lines = [
    'import type { DashbaseAssetManifest } from "./runtime.ts";',
    "",
    "export const dashbaseVueManifest = {",
  ];

  for (const contract of contracts) {
    lines.push(`  ${JSON.stringify(contract.slug)}: {`);
    lines.push(`    css: ${JSON.stringify(contract.imports.css ?? [], null, 4)},`);
    lines.push(`    js: ${JSON.stringify(contract.imports.js ?? [], null, 4)},`);
    lines.push("  },");
  }

  lines.push("} as const satisfies Record<string, DashbaseAssetManifest>;");
  lines.push("");
  lines.push("export const dashbaseVuePatternManifest = {");

  for (const pattern of patternManifests) {
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
  patterns: PatternContract[],
) {
  const exports: Record<string, string> = {
    ".": "./index.ts",
    "./manual": "./manual.ts",
    "./manifest": "./manifest.ts",
    "./runtime": "./runtime.ts",
  };

  for (const contract of contracts) {
    exports[`./${contract.slug}`] = `./components/${contract.slug}/index.ts`;
    exports[`./${contract.slug}/manual`] = `./components/${contract.slug}/manual.ts`;
    if ((contract.docs?.examples ?? []).length > 0) {
      exports[`./${contract.slug}/examples`] = `./components/${contract.slug}/examples.vue`;
    }
  }

  for (const pattern of patterns) {
    exports[`./patterns/${pattern.slug}`] = `./patterns/${pattern.slug}/index.ts`;
    exports[`./patterns/${pattern.slug}/manual`] = `./patterns/${pattern.slug}/manual.ts`;
  }

  return JSON.stringify(
    {
      name: "@dashbase/vue",
      private: true,
      type: "module",
      module: "./index.ts",
      exports,
      peerDependencies: {
        vue: ">=3.5",
      },
    },
    null,
    2,
  ) + "\n";
}

function renderPackageReadme(contracts: ComponentContract[], patterns: PatternContract[]) {
  const lines = [
    "# Dashbase Vue",
    "",
    "This folder is generated by `scripts/targets/vue/generate.ts`.",
    "",
    "Use the default entrypoints for automatic CSS and behavior-shim imports, or the matching `/manual` entrypoints when you want to manage Dashbase assets yourself.",
    "",
    "## Components",
    "",
  ];

  for (const contract of contracts) {
    lines.push(`- \`${contract.name}\``);
    lines.push(`  - Auto entry: \`@dashbase/vue/${contract.slug}\``);
    lines.push(`  - Manual entry: \`@dashbase/vue/${contract.slug}/manual\``);
    if ((contract.docs?.examples ?? []).length > 0) {
      lines.push(`  - Generated examples: \`@dashbase/vue/${contract.slug}/examples\``);
    }
  }

  lines.push("");
  lines.push("## Patterns");
  lines.push("");

  for (const pattern of patterns) {
    lines.push(`- \`${pattern.title}\``);
    lines.push(`  - Auto entry: \`@dashbase/vue/patterns/${pattern.slug}\``);
    lines.push(`  - Manual entry: \`@dashbase/vue/patterns/${pattern.slug}/manual\``);
  }

  lines.push("");
  return lines.join("\n");
}

function stripExampleMarkers(source: string) {
  return source.replaceAll(/<!-- @example [^>]+:(?:start|end) -->\n?/g, "");
}

function dedent(value: string) {
  const lines = value.replace(/^\n+|\n+$/g, "").split("\n");
  const indents = lines
    .filter((line) => line.trim().length > 0)
    .map((line) => line.match(/^\s*/)?.[0].length ?? 0);
  const margin = indents.length > 0 ? Math.min(...indents) : 0;
  return lines.map((line) => line.slice(margin)).join("\n");
}

function selfCloseVoidTags(markup: string) {
  return markup.replace(/<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)([^>]*)>/g, (match, tag, attrs) => {
    return /\/>$/.test(match) ? match : `<${tag}${attrs} />`;
  });
}

function isCustomElementTag(tag: string) {
  return tag.includes("-");
}

function transformHtmlSnippetToVue(contract: ComponentContract, htmlSnippet: string) {
  const tagMap = new Map<string, string>([
    [contract.root.tag, contract.root.exportName ?? contract.name],
  ]);

  for (const anatomy of contract.anatomy) {
    if (anatomy.tag && anatomy.exportName && isCustomElementTag(anatomy.tag)) {
      tagMap.set(anatomy.tag, anatomy.exportName);
    }
  }

  let output = selfCloseVoidTags(htmlSnippet);
  for (const [sourceTag, targetTag] of tagMap) {
    output = output.replace(new RegExp(`<${sourceTag}(?=[\\s>])`, "g"), `<${targetTag}`);
    output = output.replace(new RegExp(`</${sourceTag}>`, "g"), `</${targetTag}>`);
  }

  return output;
}

function renderVueExampleFile(contract: ComponentContract, examples: ResolvedDocExample[]) {
  const exportNames = getGeneratorTargets(contract).map((target) => target.exportName).join(", ");
  const lines = [
    `<!-- Generated by scripts/targets/vue/generate.ts for ${contract.name}. -->`,
    "<script setup lang=\"ts\">",
    `  import { ${exportNames} } from "./index.ts";`,
    "</script>",
    "",
    "<template>",
  ];

  for (const example of examples) {
    lines.push(`  <section aria-labelledby="${toCamelCase(example.id)}-title">`);
    lines.push(`    <h2 id="${toCamelCase(example.id)}-title">${example.title}</h2>`);
    for (const line of example.vueSnippet.split("\n")) {
      lines.push(`    ${line}`);
    }
    lines.push("  </section>");
    lines.push("");
  }

  lines.push("</template>");
  lines.push("");
  return lines.join("\n");
}

function renderComponentReadme(contract: ComponentContract, examples: ResolvedDocExample[]) {
  const exportNames = getGeneratorTargets(contract).map((target) => target.exportName).join(", ");
  const adapterMode = getGeneratedAdapterMode(contract, "vue");
  const lines = [
    `# ${contract.name}`,
    "",
    contract.summary,
    "",
    "## Imports",
    "",
    "Default entrypoint with automatic CSS and behavior asset imports:",
    "",
    "```vue",
    `<script setup lang="ts">`,
    `import { ${exportNames} } from "@dashbase/vue/${contract.slug}";`,
    `</script>`,
    "```",
    "",
    "Manual entrypoint when you want to control asset loading yourself:",
    "",
    "```ts",
    `import { ${exportNames}, ${getAssetsConstName(contract.slug)} } from "@dashbase/vue/${contract.slug}/manual";`,
    "```",
    "",
    "## Behavior Hosting",
    "",
    `- Generated adapter mode: \`${adapterMode}\``,
  ];

  if (adapterMode === "browser-shim") {
    lines.push("- The default entrypoint auto-imports a browser behavior shim.");
  }

  if (isClientHostedComponent(contract, "vue")) {
    lines.push("- In SSR runtimes, mount this component from a client boundary or after client hydration.");
  }

  if (contract.behavior.domOwnership === "shim-mutates-live-state") {
    lines.push("- The shim mutates live DOM state. If the framework starts fighting those mutations, prefer a controller-backed or native override.");
  }

  for (const note of getAdapterNotes(contract, "vue")) {
    lines.push(`- ${note}`);
  }

  lines.push("");

  if (examples.length > 0) {
    lines.push("## Generated Examples");
    lines.push("");
    lines.push(`- \`@dashbase/vue/${contract.slug}/examples\``);
    lines.push("");
  }

  if ((contract.props ?? []).length > 0) {
    lines.push("## Adapter Props");
    lines.push("");
    for (const prop of contract.props ?? []) {
      const valueType = prop.kind === "class-group" && prop.values && !Array.isArray(prop.values)
        ? Object.keys(prop.values).map((value) => JSON.stringify(value)).join(" | ")
        : renderValueType(Array.isArray(prop.values) ? prop.values : undefined);
      lines.push(`- \`${toCamelCase(prop.name)}?: ${valueType}\``);
    }
    lines.push("");
  }

  if (contract.accessibility) {
    lines.push("## Accessibility");
    lines.push("");

    if (contract.accessibility.focusModel) {
      lines.push(`- Focus model: \`${contract.accessibility.focusModel}\``);
    }

    for (const required of contract.accessibility.requiredAttributes ?? []) {
      lines.push(`- Required authored attributes on \`${required.target}\`: ${required.attributes.map((attribute) => `\`${attribute}\``).join(", ")}`);
    }

    for (const relationship of contract.accessibility.relationships ?? []) {
      lines.push(`- Relationship: \`${relationship.from}\` uses \`${relationship.attribute}\` to reference \`${relationship.to}\``);
    }

    for (const interaction of contract.accessibility.keyboardInteractions ?? []) {
      lines.push(`- Keyboard: \`${interaction.key}\` on \`${interaction.target}\` ${interaction.effect}`);
    }

    lines.push("");
  }

  if (examples.length > 0) {
    lines.push("## Usage");
    lines.push("");
    for (const example of examples) {
      lines.push(`### ${example.title}`);
      lines.push("");
      lines.push("```vue");
      lines.push("<script setup lang=\"ts\">");
      lines.push(`import { ${exportNames} } from "@dashbase/vue/${contract.slug}";`);
      lines.push("</script>");
      lines.push("");
      lines.push("<template>");
      lines.push(example.vueSnippet);
      lines.push("</template>");
      lines.push("```");
      lines.push("");
    }
  }

  return lines.join("\n");
}

function extractExampleSnippet(source: string, id: string) {
  const startMarker = `<!-- @example ${id}:start -->`;
  const endMarker = `<!-- @example ${id}:end -->`;
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker);

  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`Missing example markers for ${id}`);
  }

  return dedent(stripExampleMarkers(source.slice(start + startMarker.length, end)));
}

async function resolveDocExamples(entry: ContractEntry) {
  const examples = entry.contract.docs?.examples ?? [];
  if (examples.length === 0) {
    return [];
  }

  const sourcePath = resolve(entry.contractDir, examples[0].source);
  const source = await readFile(sourcePath, "utf8");

  return examples.map((example) => {
    const htmlSnippet = extractExampleSnippet(source, example.id);
    return {
      ...example,
      exportName: toPascalCase(example.id),
      vueSnippet: transformHtmlSnippetToVue(entry.contract, htmlSnippet),
    };
  });
}

function getPatternPropsTypeName(contract: PatternContract) {
  return `${getPatternExportName(contract)}Props`;
}

function getPatternExportName(contract: PatternContract) {
  return toPascalCase(contract.slug);
}

function patternHasAdapterBindings(contract: PatternContract) {
  return (contract.props ?? []).length > 0 || (contract.slots ?? []).length > 0;
}

function transformPatternTokensToVue(markup: string, contract: PatternContract) {
  const bindingNames = new Set([
    ...(contract.props ?? []).map((prop) => prop.name),
    ...(contract.slots ?? []).map((slot) => slot.name),
  ]);

  let output = selfCloseVoidTags(markup);

  for (const name of bindingNames) {
    const escapedName = escapeRegExp(name);
    output = output.replace(
      new RegExp(`([A-Za-z0-9:_-]+)=([\"'])\\s*\\{\\{\\s*${escapedName}\\s*\\}\\}\\s*\\2`, "g"),
      `:$1="${toCamelCase(name)}"`,
    );
  }

  for (const name of bindingNames) {
    const escapedName = escapeRegExp(name);
    output = output.replace(
      new RegExp(`\\{\\{\\s*${escapedName}\\s*\\}\\}`, "g"),
      `{{ ${toCamelCase(name)} }}`,
    );
  }

  return output;
}

function renderPatternPropsInterface(contract: PatternContract) {
  const lines = [`interface ${getPatternPropsTypeName(contract)} {`];
  for (const prop of contract.props ?? []) {
    lines.push(`  ${toCamelCase(prop.name)}?: string;`);
  }
  lines.push("}");
  return lines.join("\n");
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
    if (!entry.isDirectory()) continue;
    const slug = entry.name;
    if (catalog.has(slug)) continue;

    const cssPath = join(COMPONENTS_DIR, slug, `${slug}.css`);
    const jsPath = join(COMPONENTS_DIR, slug, `${slug}.js`);
    const css: string[] = [];
    const js: string[] = [];

    if (await pathExists(cssPath)) css.push(`dist/components/${slug}/${slug}.css`);
    if (await pathExists(jsPath)) js.push(`dist/components/${slug}/${slug}.js`);
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
    if (!dependencyEntry) continue;
    const dependencyAssets = await resolvePatternAssets(dependencyEntry, patternEntriesBySlug, componentAssetCatalog, nextStack);
    css.push(...dependencyAssets.css);
    js.push(...dependencyAssets.js);
  }

  for (const componentSlug of entry.contract.dependencies.components) {
    const assets = componentAssetCatalog.get(componentSlug);
    if (!assets) continue;
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

function renderPatternSnippetWithSlots(markup: string, contract: PatternContract) {
  let output = markup;

  for (const slot of contract.slots ?? []) {
    const token = `{{ ${toCamelCase(slot.name)} }}`;
    const fallback = (slot.defaultHtml ?? "").trim();
    if (fallback.length === 0) {
      output = output.replaceAll(token, `<slot name="${toCamelCase(slot.name)}" />`);
      continue;
    }

    output = output.replaceAll(
      token,
      `<slot name="${toCamelCase(slot.name)}">${transformPatternTokensToVue(fallback, contract)}</slot>`,
    );
  }

  return output;
}

function renderPatternVueFile(
  entry: PatternEntry,
  markup: string,
  assets: DashbaseAssetManifest,
  outputFile: string,
  autoImports: boolean,
) {
  const lines: string[] = [];

  lines.push("<script setup lang=\"ts\">");

  if (autoImports && (assets.css.length > 0 || assets.js.length > 0)) {
    for (const asset of [...assets.css, ...assets.js]) {
      lines.push(`  import ${JSON.stringify(toAssetImportSpecifier(outputFile, asset))};`);
    }
  }

  if (patternHasAdapterBindings(entry.contract)) {
    for (const line of renderPatternPropsInterface(entry.contract).split("\n")) {
      lines.push(`  ${line}`);
    }
    lines.push("");

    const destructureParts = [
      ...(entry.contract.props ?? []).map((prop) => `${toCamelCase(prop.name)} = ${JSON.stringify(prop.default)}`),
    ];
    if (destructureParts.length > 0) {
      lines.push(`  const { ${destructureParts.join(", ")} } = defineProps<${getPatternPropsTypeName(entry.contract)}>();`);
    } else {
      lines.push(`  defineProps<${getPatternPropsTypeName(entry.contract)}>();`);
    }
  }

  if ((entry.contract.slots ?? []).length > 0) {
    lines.push("");
    lines.push("  defineSlots<{");
    for (const slot of entry.contract.slots ?? []) {
      lines.push(`    ${toCamelCase(slot.name)}?: () => any;`);
    }
    lines.push("  }>();");
  }

  lines.push("</script>");
  lines.push("");
  lines.push("<template>");
  for (const line of renderPatternSnippetWithSlots(markup, entry.contract).split("\n")) {
    lines.push(`  ${line}`);
  }
  lines.push("</template>");
  lines.push("");
  return lines.join("\n");
}

function renderPatternManualIndex(entry: PatternEntry, assets: DashbaseAssetManifest) {
  const exportName = getPatternExportName(entry.contract);
  return [
    `/* Generated by scripts/targets/vue/generate.ts for ${entry.contract.title}. */`,
    'import type { DashbaseAssetManifest } from "../../../../runtime.ts";',
    "",
    `export const ${getAssetsConstName(entry.contract.slug)} = {`,
    `  css: ${JSON.stringify(assets.css, null, 2)},`,
    `  js: ${JSON.stringify(assets.js, null, 2)},`,
    "} as const satisfies DashbaseAssetManifest;",
    "",
    `export { default as ${exportName} } from "./${exportName}Manual.vue";`,
    "",
  ].join("\n");
}

function renderPatternAutoIndex(entry: PatternEntry) {
  const exportName = getPatternExportName(entry.contract);
  return [
    `/* Generated by scripts/targets/vue/generate.ts for ${entry.contract.title}. */`,
    `export { default as ${exportName} } from "./${exportName}.vue";`,
    "",
  ].join("\n");
}

function renderPatternReadme(entry: PatternEntry) {
  const exportName = getPatternExportName(entry.contract);
  const autoImportPath = `@dashbase/vue/patterns/${entry.contract.slug}`;
  const manualImportPath = `@dashbase/vue/patterns/${entry.contract.slug}/manual`;
  const lines = [
    `# ${entry.contract.title}`,
    "",
    entry.contract.summary,
    "",
    "## Imports",
    "",
    "```vue",
    `<script setup lang="ts">`,
    `import { ${exportName} } from "${autoImportPath}";`,
    `</script>`,
    "```",
    "",
    "```ts",
    `import { ${exportName}, ${getAssetsConstName(entry.contract.slug)} } from "${manualImportPath}";`,
    "```",
    "",
    "## Scope",
    "",
    `- Category: \`${entry.contract.category}\``,
    `- Family: \`${entry.contract.family}\``,
    `- Variant: \`${entry.contract.variant}\``,
    `- Scope: \`${entry.contract.scope}\``,
    "",
  ];

  if ((entry.contract.props ?? []).length > 0) {
    lines.push("## Adapter Props");
    lines.push("");
    for (const prop of entry.contract.props ?? []) {
      lines.push(`- \`${toCamelCase(prop.name)}?: string\` ${prop.description ?? ""} Default: ${JSON.stringify(prop.default)}.`);
    }
    lines.push("");
  }

  if ((entry.contract.slots ?? []).length > 0) {
    lines.push("## Named Slots");
    lines.push("");
    for (const slot of entry.contract.slots ?? []) {
      const fallbackText = (slot.defaultHtml ?? "").trim() ? "Includes fallback markup." : "No fallback markup.";
      lines.push(`- \`${toCamelCase(slot.name)}\` ${slot.description ?? ""} ${fallbackText}`);
    }
    lines.push("");
    lines.push("Use Vue named slots to supply those regions.");
    lines.push("");
  }

  lines.push("## Usage");
  lines.push("");
  lines.push("```vue");
  lines.push("<script setup lang=\"ts\">");
  lines.push(`  import { ${exportName} } from "${autoImportPath}";`);
  lines.push("</script>");
  lines.push("");
  lines.push("<template>");
  lines.push(`<${exportName} />`);
  lines.push("</template>");
  lines.push("```");
  lines.push("");
  return lines.join("\n");
}

async function ensureDir(filePath: string) {
  await mkdir(dirname(filePath), { recursive: true });
}

async function writeTextFile(filePath: string, source: string) {
  await ensureDir(filePath);
  await writeFile(filePath, source, "utf8");
}

async function generateVue() {
  const contracts = (await loadComponentContracts()) as ContractEntry[];
  const patternContracts = (await loadPatternContracts()) as PatternEntry[];
  const componentAssetCatalog = await buildComponentAssetCatalog(contracts);
  const patternEntriesBySlug = new Map(patternContracts.map((entry) => [entry.contract.slug, entry]));
  const patternManifests: Array<{ slug: string; assets: DashbaseAssetManifest }> = [];

  await rm(OUTPUT_DIR, { recursive: true, force: true });
  await mkdir(COMPONENTS_OUTPUT_DIR, { recursive: true });
  await mkdir(PATTERNS_OUTPUT_DIR, { recursive: true });

  for (const entry of contracts) {
    const componentDir = join(COMPONENTS_OUTPUT_DIR, entry.contract.slug);
    const targets = getGeneratorTargets(entry.contract);
    const examples = await resolveDocExamples(entry);
    const assets: DashbaseAssetManifest = {
      css: [...entry.contract.imports.css],
      js: [...(entry.contract.imports.js ?? [])],
    };

    for (const target of targets) {
      await writeTextFile(
        join(componentDir, `${target.exportName}.vue`),
        renderVueComponentFile(target, assets, join(componentDir, `${target.exportName}.vue`), true),
      );
      await writeTextFile(
        join(componentDir, `${target.exportName}Manual.vue`),
        renderVueComponentFile(target, assets, join(componentDir, `${target.exportName}Manual.vue`), false),
      );
    }

    await writeTextFile(join(componentDir, "index.ts"), renderComponentAutoIndex(entry.contract, targets));
    await writeTextFile(join(componentDir, "manual.ts"), renderComponentManualIndex(entry.contract, targets, assets));
    await writeTextFile(join(componentDir, "README.md"), renderComponentReadme(entry.contract, examples));

    if (examples.length > 0) {
      await writeTextFile(join(componentDir, "examples.vue"), renderVueExampleFile(entry.contract, examples));
    }
  }

  for (const entry of patternContracts) {
    const patternDir = join(PATTERNS_OUTPUT_DIR, entry.contract.slug);
    const exportName = getPatternExportName(entry.contract);
    const assets = await resolvePatternAssets(entry, patternEntriesBySlug, componentAssetCatalog);
    const resolvedPatternSnippet = await resolvePatternFragment(entry, "pattern", {
      allowedTokens: getPatternAllowedTokens(entry.contract),
    });
    const resolvedPatternStyles = await resolveOptionalPatternStyles(entry);
    const vueSnippet = transformPatternTokensToVue(resolvedPatternSnippet, entry.contract);

    if (resolvedPatternStyles && resolvedPatternStyles.trim().length > 0) {
      await writeTextFile(join(patternDir, "pattern.css"), resolvedPatternStyles);
      if (!assets.css.includes("./pattern.css")) {
        assets.css.unshift("./pattern.css");
      }
    }

    await writeTextFile(
      join(patternDir, `${exportName}.vue`),
      renderPatternVueFile(entry, vueSnippet, assets, join(patternDir, `${exportName}.vue`), true),
    );
    await writeTextFile(
      join(patternDir, `${exportName}Manual.vue`),
      renderPatternVueFile(entry, vueSnippet, assets, join(patternDir, `${exportName}Manual.vue`), false),
    );
    await writeTextFile(join(patternDir, "index.ts"), renderPatternAutoIndex(entry));
    await writeTextFile(join(patternDir, "manual.ts"), renderPatternManualIndex(entry, assets));
    await writeTextFile(join(patternDir, "README.md"), renderPatternReadme(entry));

    patternManifests.push({ slug: entry.contract.slug, assets });
  }

  await writeTextFile(join(OUTPUT_DIR, "runtime.ts"), renderRuntimeFile());
  await writeTextFile(join(OUTPUT_DIR, "index.ts"), renderPackageIndexFile(contracts.map((entry) => entry.contract), patternContracts.map((entry) => entry.contract)));
  await writeTextFile(join(OUTPUT_DIR, "manual.ts"), renderPackageManualFile(contracts.map((entry) => entry.contract), patternContracts.map((entry) => entry.contract)));
  await writeTextFile(join(OUTPUT_DIR, "manifest.ts"), renderManifestFile(contracts.map((entry) => entry.contract), patternManifests));
  await writeTextFile(join(OUTPUT_DIR, "package.json"), renderPackageJson(contracts.map((entry) => entry.contract), patternContracts.map((entry) => entry.contract)));
  await writeTextFile(join(OUTPUT_DIR, "README.md"), renderPackageReadme(contracts.map((entry) => entry.contract), patternContracts.map((entry) => entry.contract)));

  console.log(`Generated package-style Vue target for ${contracts.length} component contracts and ${patternContracts.length} patterns in ${join("generated", "vue")}.`);
}

generateVue().catch((error) => {
  console.error(error);
  process.exit(1);
});
