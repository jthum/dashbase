import { access, readFile, readdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const GENERATED_DIR = join(ROOT, "generated/svelte");
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
      `${resolvedBase}.svelte`,
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

async function validateSvelte() {
  const files = await collectFiles(GENERATED_DIR);
  const errors: string[] = [];

  for (const filePath of files) {
    const source = await readFile(filePath, "utf8");

    if (source.includes("{{")) {
      errors.push(`${filePath}: contains unresolved template tokens`);
    }

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

    if (filePath.endsWith(".svelte")) {
      for (const marker of ["className=", "htmlFor=", "forwardRef", "React.", "props.children"]) {
        if (source.includes(marker)) {
          errors.push(`${filePath}: contains non-Svelte artifact ${marker}`);
        }
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`Generated Svelte target validation failed:\n\n${errors.join("\n")}`);
  }

  console.log(`Validated generated Svelte target (${files.length} files).`);
}

validateSvelte().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
