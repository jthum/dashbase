import { access, readFile, readdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const GENERATED_DIR = join(ROOT, "generated/vue");
const transpiler = new Bun.Transpiler({ loader: "ts" });

async function pathExists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function collectFiles(dir: string) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectFiles(fullPath));
      continue;
    }
    if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files.sort();
}

async function validateRelativeImports(filePath: string, source: string) {
  const specifiers = [
    ...source.matchAll(/from\s+["']([^"']+)["']/g),
    ...source.matchAll(/import\s+["']([^"']+)["']/g),
  ].map((match) => match[1]);

  for (const specifier of specifiers) {
    if (!specifier.startsWith(".")) {
      continue;
    }

    const resolvedBase = resolve(dirname(filePath), specifier);
    const candidates = [
      resolvedBase,
      `${resolvedBase}.ts`,
      `${resolvedBase}.vue`,
      `${resolvedBase}.js`,
      `${resolvedBase}.css`,
      `${resolvedBase}.md`,
      join(resolvedBase, "index.ts"),
    ];

    let found = false;
    for (const candidate of candidates) {
      if (await pathExists(candidate)) {
        found = true;
        break;
      }
    }

    if (!found) {
      throw new Error(`${filePath}: unresolved relative import ${specifier}`);
    }
  }
}

async function validateVue() {
  const files = await collectFiles(GENERATED_DIR);
  const errors: string[] = [];

  for (const filePath of files) {
    const source = await readFile(filePath, "utf8");

    await validateRelativeImports(filePath, source).catch((error) => {
      errors.push(error.message);
    });

    if (filePath.endsWith(".ts")) {
      try {
        transpiler.transformSync(source);
      } catch (error) {
        errors.push(`${filePath}: ${error.message}`);
      }
      continue;
    }

    if (filePath.endsWith(".vue")) {
      for (const marker of [
        "className=",
        "htmlFor=",
        "forwardRef",
        "React.",
        "props.children",
        "{@render",
        "$props()",
        'import type { Snippet } from "svelte"',
        'from "svelte/elements"',
        "<script module",
        "<compose-fragment",
      ]) {
        if (source.includes(marker)) {
          errors.push(`${filePath}: contains non-Vue artifact ${marker}`);
        }
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`Generated Vue target validation failed:\n\n${errors.join("\n")}`);
  }

  console.log(`Validated generated Vue target (${files.length} files).`);
}

validateVue().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
