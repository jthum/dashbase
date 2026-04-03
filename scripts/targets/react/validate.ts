import { readdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../../..", import.meta.url));
const GENERATED_DIR = join(ROOT, "generated/react");
const TMP_DIR = join(ROOT, ".tmp/react");

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

async function validateReact() {
  const entrypoints = await collectEntryPoints(GENERATED_DIR);
  const external = ["react", "react/jsx-runtime", "react/jsx-dev-runtime"];

  for (const entrypoint of entrypoints) {
    const result = await Bun.build({
      entrypoints: [entrypoint],
      external,
      outdir: TMP_DIR,
      target: "browser",
    });

    if (!result.success) {
      await rm(TMP_DIR, { recursive: true, force: true });
      throw new AggregateError(
        result.logs,
        `Generated React target failed syntax validation for ${entrypoint}.`,
      );
    }
  }

  await rm(TMP_DIR, { recursive: true, force: true });

  console.log(`Validated generated React target (${entrypoints.length} entrypoints).`);
}

validateReact().catch((error) => {
  console.error(error);
  process.exit(1);
});
