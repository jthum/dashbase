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

- **`/baseline`**: The foundational design system (tokens, primitives, reset).
- **`/dashbase`**: The semantic component library and patterns.
- **`/tools`**: Development tools including generators and DSL contracts.
- **`/docs`**: Comprehensive documentation, implementation guidance, and PRDs.

---

## 🚀 Getting Started

To use Dashbase in your project, include the base stylesheet followed by the components you need.

```html
<!-- Load the foundational design system -->
<link rel="stylesheet" href="baseline/baseline.css">

<!-- Load only the components you need -->
<link rel="stylesheet" href="dashbase/components/button.css">
<link rel="stylesheet" href="dashbase/components/input.css">
<link rel="stylesheet" href="dashbase/components/form-field.css">
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

---

## 🛠️ Development & Principles

Dashbase components are authored with a focus on simplicity and platform compatibility.

- **Style the Element**: Prefer `button { }` over `.button { }`.
- **Native State**: Use attributes like `[disabled]`, `:checked`, and `:invalid` for styling.
- **No `!important`**: If you need it, the layer architecture is likely being bypassed.
- **Logical Properties**: Use `padding-inline`, `margin-block`, etc., for RTL-ready layouts.

---

## 📄 License

[Insert License Information Here]
