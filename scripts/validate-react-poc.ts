import { rm } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const GENERATED_ENTRY = join(ROOT, "generated/react/index.ts");
const TMP_DIR = join(ROOT, ".tmp/react-poc");

async function validateReactPoc() {
  const result = await Bun.build({
    entrypoints: [GENERATED_ENTRY],
    external: ["react", "react/jsx-runtime"],
    outdir: TMP_DIR,
    target: "browser",
  });

  await rm(TMP_DIR, { recursive: true, force: true });

  if (!result.success) {
    throw new AggregateError(result.logs, "React proof-of-concept generation failed syntax validation.");
  }

  console.log("Validated generated React proof-of-concept wrappers.");
}

validateReactPoc().catch((error) => {
  console.error(error);
  process.exit(1);
});
