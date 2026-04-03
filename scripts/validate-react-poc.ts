import { readdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const GENERATED_DIR = join(ROOT, "generated/react");
const TMP_DIR = join(ROOT, ".tmp/react-poc");

async function collectEntryPoints(dir: string) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...await collectEntryPoints(fullPath));
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    if (
      (fullPath.endsWith(".ts") || fullPath.endsWith(".tsx")) &&
      !fullPath.endsWith(".d.ts")
    ) {
      files.push(fullPath);
    }
  }

  return files.sort();
}

async function validateReactPoc() {
  const entrypoints = await collectEntryPoints(GENERATED_DIR);
  const result = await Bun.build({
    entrypoints,
    external: ["react", "react/jsx-runtime"],
    outdir: TMP_DIR,
    target: "browser",
  });

  await rm(TMP_DIR, { recursive: true, force: true });

  if (!result.success) {
    throw new AggregateError(result.logs, "React proof-of-concept generation failed syntax validation.");
  }

  console.log(`Validated generated React proof-of-concept package (${entrypoints.length} entrypoints).`);
}

validateReactPoc().catch((error) => {
  console.error(error);
  process.exit(1);
});
