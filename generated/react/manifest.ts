import type { DashbaseAssetManifest } from "./runtime";

export const dashbaseReactPocManifest = {
  button: {
    css: [
    "dist/components/button/button.css"
],
    js: [],
  },
  carousel: {
    css: [
    "dist/components/carousel/carousel.css"
],
    js: [
    "dist/components/carousel/carousel.js"
],
  },
  combobox: {
    css: [
    "dist/components/input/input.css",
    "dist/components/popover/popover.css",
    "dist/components/combobox/combobox.css"
],
    js: [
    "dist/components/combobox/combobox.js"
],
  },
  popover: {
    css: [
    "dist/components/panel/panel.css",
    "dist/components/popover/popover.css"
],
    js: [
    "dist/components/popover/popover.js"
],
  },
  tabs: {
    css: [
    "dist/components/tabs/tabs.css"
],
    js: [
    "dist/components/tabs/tabs.js"
],
  },
} as const satisfies Record<string, DashbaseAssetManifest>;
