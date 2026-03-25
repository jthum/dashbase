# Dashbase

> A semantic-first CSS component library for web applications. Restoring the original architecture of the web: HTML for structure, CSS for presentation, and JS for behavior.

---

## 🏗️ Philosophy

Modern frontend development has often led to unreadable HTML "class soup." **Dashbase** is built on the belief that the modern web platform is powerful enough to handle styling and structure without heavy utility layers or complex JavaScript frameworks.

- **Semantic First**: Style HTML elements directly (`<button>`, `<input>`, `<dialog>`).
- **Native Power**: Embrace browser defaults and accessibility behaviors.
- **Readable Markup**: Use named custom elements (e.g., `<form-field>`, `<input-group>`) where no semantic HTML equivalent exists.
- **Graceful Degradation**: Design for functional consistency across browsers, not pixel perfection.

---

## ✨ Key Features

- **Pure CSS**: All styling is authored as vanilla CSS using modern features like `@layer` and CSS custom properties.
- **Zero Runtime Dependencies**: No JavaScript or framework required for core styling.
- **Themeable**: Powered by **Baseline CSS**, a robust token and primitive layer.
- **Modular**: Import only what you need. `base.css` + specific component files.
- **Modern CSS**: Uses `@layer`, `:has()`, `oklch()`, `color-mix()`, and native nesting.

---

## 🎨 Architecture: The Cascade Stack

Dashbase uses a layered architecture to ensure style consistency and easy overrides without specificity conflicts.

1.  **Browser Defaults**: The foundational layer (load-bearing).
2.  **Reset**: Minimal normalization (primarily `box-sizing: border-box`).
3.  **Tokens**: Design vocabulary (colors, spacing, typography) defined in **Baseline CSS**.
4.  **Primitives**: Reusable structural patterns sits between tokens and components.
5.  **Base**: Minimal global element defaults (e.g., body typography).
6.  **Components**: Semantic component styling (the heart of Dashbase).
7.  **Utilities**: Highest-level overrides for app-specific needs.

---

## 📂 Project Structure

- **`/src/baseline`**: The foundational design system (reset, tokens, primitives, base).
- **`/src/components`**: Semantic component styles.
- **`/themes`**: Token overrides for alternate visual systems.
- **`/scripts`**: Build tooling.
- **`/dist`**: Generated output after running the build.
- **`/docs`**: Comprehensive documentation, implementation guidance, and PRDs.

---

## 🚀 Getting Started

Build the distributable CSS first:

```bash
bun run build
```

This generates:

- `dist/baseline.css` for the reset/tokens/primitives/base layers
- `dist/components/*.css` for modular component imports
- `dist/behaviors/*.js` for optional progressive-enhancement shims
- `dist/dashbase.css` for the full bundle

The generated CSS stays readable on purpose. Dashbase ships formatted source with comments intact, and the build reports both raw and gzip sizes so transfer cost stays visible without sacrificing view-source friendliness.

To use Dashbase in your project, include the base stylesheet followed by the components you need.

```html
<!-- Load the foundational design system -->
<link rel="stylesheet" href="dist/baseline.css">

<!-- Load only the components you need -->
<link rel="stylesheet" href="dist/components/button.css">
<link rel="stylesheet" href="dist/components/input.css">
<link rel="stylesheet" href="dist/components/form-field.css">
<link rel="stylesheet" href="dist/components/card.css">
<link rel="stylesheet" href="dist/components/avatar.css">
<link rel="stylesheet" href="dist/components/tooltip.css">

<!-- Load optional behavior shims only when you use them -->
<script src="dist/behaviors/tooltip.js"></script>
```

### Example Usage

```html
<form-field>
  <label for="email">Email Address</label>
  <input type="email" id="email" placeholder="you@example.com">
  <small data-hint>We'll never share your email.</small>
</form-field>

<button class="primary">Sign Up</button>
```

```html
<article class="card">
  <header>
    <h2>Weekly Report</h2>
    <p>Activation rose 12% week-over-week.</p>
  </header>

  <card-content>
    <p>Review the latest product and growth metrics in one place.</p>
  </card-content>

  <footer>
    <button class="primary">Open report</button>
    <button class="ghost">Share</button>
  </footer>
</article>
```

```html
<ui-card class="simple">
  <h3>System Status</h3>
  <p>All services are healthy.</p>
</ui-card>
```

```html
<avatar-group aria-label="Project collaborators">
  <ui-avatar aria-label="Taylor Nguyen">TN</ui-avatar>
  <ui-avatar aria-label="Jordan Brooks">JB</ui-avatar>
  <ui-avatar class="subtle" aria-label="Two more collaborators">+2</ui-avatar>
</avatar-group>
```

```html
<details>
  <summary>Deployment checklist</summary>
  <p>Review the final release checks before shipping.</p>
  <ul>
    <li>Validate examples and docs</li>
    <li>Check light and dark mode</li>
    <li>Verify keyboard and focus behavior</li>
  </ul>
</details>
```

```html
<button type="button" title="Create a reusable checkpoint without publishing it yet.">
  Save draft
</button>
```

```html
<abbr data-tooltip="HyperText Markup Language">HTML</abbr>
```

---

## 🌐 Browser Support

Dashbase targets modern evergreen browsers and uses the platform directly rather than transpiling modern CSS away.

- **Functional first**: semantic HTML remains the foundation. If a browser misses part of the styling surface, the markup should still behave like normal native HTML.
- **Modern CSS baseline**: Dashbase relies on CSS custom properties, `@layer`, logical properties, `color-mix()`, `oklch()`, `light-dark()`, and native nesting.
- **Enhanced states where available**: `:has()` powers parent-aware styling such as `<form-field>` reacting to invalid controls, `:user-invalid` delays error styling until user interaction, and `field-sizing: content` enables textarea auto-growth without JS.
- **Graceful degradation over polyfills**: when a feature is unsupported, Dashbase prefers losing polish over breaking behavior. The browser should fall back to simpler native presentation rather than requiring a heavy compatibility layer.
- **Project-specific compatibility**: if your product has stricter browser requirements, test the specific components you use and add targeted fallbacks in your app layer.

---

## 🛠️ Development & Principles

Dashbase components are authored with a focus on simplicity and platform compatibility.

- **Style the Element**: Prefer `button { }` over `.button { }`.
- **Semantic State Hooks**: Prefer native state selectors like `[disabled]`, `:checked`, `:user-invalid`, and use ARIA attributes when HTML has no native equivalent.
- **Escape Hatches via Variables**: Prefer inline custom properties like `style="--btn-bg: ..."` over one-off variants or `!important`.
- **Use `@scope` Sparingly**: Respect the cascade first. Reach for `@scope` only in composite components that truly need descendant containment.
- **No `!important`**: If you need it, the layer architecture is likely being bypassed.
- **Logical Properties**: Use `padding-inline`, `margin-block`, etc., for RTL-ready layouts.

---

## 📄 License

This project is released under the [MIT License](LICENSE).
