export type DashbaseAssetManifest = {
  css: string[];
  js: string[];
};

export function cx(...values: Array<unknown>) {
  const parts: string[] = [];
  for (const value of values) {
    if (!value) continue;
    if (typeof value === "string") {
      if (value.trim()) parts.push(value);
      continue;
    }
    if (Array.isArray(value)) {
      const nested = cx(...value);
      if (nested) parts.push(nested);
      continue;
    }
    if (typeof value !== "object") {
      parts.push(String(value));
      continue;
    }
    for (const [key, enabled] of Object.entries(value)) {
      if (enabled && key.trim()) parts.push(key);
    }
  }
  return parts.join(" ");
}

export function omitClass(source: Record<string, unknown>) {
  const { class: _class, ...rest } = source;
  return rest;
}
