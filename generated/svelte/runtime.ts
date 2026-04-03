import type { Snippet } from "svelte";

export type DashbaseAssetManifest = {
  css: string[];
  js: string[];
};

export type DashbaseCustomElementProps = {
  class?: string;
  children?: Snippet;
  [key: string]: unknown;
};

export function cx(...values: Array<string | false | null | undefined | Record<string, boolean | null | undefined>>) {
  const parts: string[] = [];
  for (const value of values) {
    if (!value) continue;
    if (typeof value === "string") {
      if (value.trim()) parts.push(value);
      continue;
    }
    for (const [key, enabled] of Object.entries(value)) {
      if (enabled && key.trim()) parts.push(key);
    }
  }
  return parts.join(" ");
}
