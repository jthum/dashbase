import { useEffect, type HTMLAttributes, type ReactNode } from "react";

export type DashbaseAssetManifest = {
  css: readonly string[];
  js: readonly string[];
};

export type DashbaseCustomElementProps = HTMLAttributes<HTMLElement> & {
  children?: ReactNode;
  [key: string]: unknown;
};

const loadedStyles = new Set<string>();
const loadedScripts = new Map<string, Promise<void>>();

function ensureStylesheet(href: string) {
  if (typeof document === "undefined" || loadedStyles.has(href)) {
    return;
  }

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  link.dataset.dashbaseGenerated = "true";
  document.head.append(link);
  loadedStyles.add(href);
}

function ensureScript(src: string) {
  if (typeof document === "undefined") {
    return Promise.resolve();
  }

  const existing = loadedScripts.get(src);
  if (existing) {
    return existing;
  }

  const promise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.dataset.dashbaseGenerated = "true";
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)), { once: true });
    document.head.append(script);
  });

  loadedScripts.set(src, promise);
  return promise;
}

export function useDashbaseAssets(assets: DashbaseAssetManifest, enabled = false) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    for (const href of assets.css) {
      ensureStylesheet(href);
    }

    for (const src of assets.js) {
      void ensureScript(src);
    }
  }, [assets, enabled]);
}

export function cx(...tokens: Array<string | false | null | undefined>) {
  return tokens.filter(Boolean).join(" ");
}
