import type { DashbaseAssetManifest } from "./runtime.ts";

export const dashbaseVueManifest = {
  "button": {
    css: [
    "dist/components/button/button.css"
],
    js: [],
  },
  "carousel": {
    css: [
    "dist/components/carousel/carousel.css"
],
    js: [
    "dist/components/carousel/carousel.js"
],
  },
  "combobox": {
    css: [
    "dist/components/input/input.css",
    "dist/components/popover/popover.css",
    "dist/components/combobox/combobox.css"
],
    js: [
    "dist/components/combobox/combobox.js"
],
  },
  "popover": {
    css: [
    "dist/components/panel/panel.css",
    "dist/components/popover/popover.css"
],
    js: [
    "dist/components/popover/popover.js"
],
  },
  "tabs": {
    css: [
    "dist/components/tabs/tabs.css"
],
    js: [
    "dist/components/tabs/tabs.js"
],
  },
} as const satisfies Record<string, DashbaseAssetManifest>;

export const dashbaseVuePatternManifest = {
  "app/dashboard-shell/default": {
    css: [
    "./pattern.css",
    "dist/components/badge/badge.css",
    "dist/components/button/button.css",
    "dist/components/card/card.css"
],
    js: [],
  },
  "auth/login-box/minimal": {
    css: [
    "./pattern.css",
    "dist/components/button/button.css",
    "dist/components/card/card.css",
    "dist/components/checkbox/checkbox.css",
    "dist/components/form-field/form-field.css",
    "dist/components/input/input.css",
    "dist/components/label/label.css"
],
    js: [],
  },
  "auth/login-screen/split": {
    css: [
    "./pattern.css",
    "dist/components/button/button.css",
    "dist/components/card/card.css",
    "dist/components/checkbox/checkbox.css",
    "dist/components/form-field/form-field.css",
    "dist/components/input/input.css",
    "dist/components/label/label.css"
],
    js: [],
  },
  "forms/form-field/select-with-helper-error": {
    css: [
    "./pattern.css",
    "dist/components/form-field/form-field.css",
    "dist/components/label/label.css",
    "dist/components/select/select.css"
],
    js: [],
  },
} as const satisfies Record<string, DashbaseAssetManifest>;
