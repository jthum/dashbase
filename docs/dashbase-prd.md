# Dashbase — Product Requirements & Implementation Plan

> A semantic-first CSS component library for web applications.  
> Version 0.1 — Working Document

---

## Table of Contents

1. [Philosophy & Origin](#1-philosophy--origin)
2. [What Dashbase Is](#2-what-dashbase-is)
3. [What Dashbase Is Not](#3-what-dashbase-is-not)
4. [Core Design Decisions & Why](#4-core-design-decisions--why)
5. [Architecture](#5-architecture)
6. [Theming System](#6-theming-system)
7. [Modern CSS Feature Set](#7-modern-css-feature-set)
8. [Component Inventory](#8-component-inventory)
9. [Custom Element Naming Convention](#9-custom-element-naming-convention)
10. [Build Pipeline](#10-build-pipeline)
11. [File & Folder Structure](#11-file--folder-structure)
12. [Implementation Phases](#12-implementation-phases)
13. [Authoring Guidelines for Implementors](#13-authoring-guidelines-for-implementors)
14. [Open Questions & Future Work](#14-open-questions--future-work)

---

## 1. Philosophy & Origin

### The Problem

Modern frontend HTML has become unreadable. View-source on any React or Tailwind project and you see:

```html
<div class="inline-flex items-center justify-center rounded-md text-sm font-medium
            ring-offset-background transition-colors focus-visible:outline-none
            focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
            disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground
            hover:bg-primary/90 h-10 px-4 py-2">
  Click me
</div>
```

This is a button. HTML has `<button>`. This is a regression.

HTML was designed with XML roots — it was meant to encode the **structure and meaning of content**, not carry styling instructions as class names. `<button>`, `<dialog>`, `<input>`, `<fieldset>` exist because someone thought carefully about semantics. When we route around them, we lose:

- Native browser accessibility behaviour (keyboard nav, focus management, ARIA roles)
- System integration (mobile keyboards, OS-level form autofill, date pickers)
- Institutional knowledge baked into browser engines by accessibility teams
- Legibility — humans can no longer read the source

### The Insight

The root cause isn't Tailwind — Tailwind is a fine tool for what it does. The root cause is that existing component libraries force an all-or-nothing choice:

- **Utility-first (Tailwind/shadcn):** Maximum control, zero readability, enormous class soup.
- **Classless (Pico, Water.css):** Readable HTML, but no variant system, no ecosystem, no Tailwind interop.
- **Class-based (DaisyUI, Bootstrap):** Better than utility-first, but still requires `.btn`, `.card` — you can't just write `<button>`.

Dashbase occupies the genuine gap: **style HTML elements directly**, embrace browser defaults, use CSS variables for theming, and remain composable with the Tailwind ecosystem when needed.

### The Bet

The modern web platform is good enough. Browsers have earned more trust than the ecosystem gives them. CSS has become powerful enough that the JS-for-everything era is ending. The readability of HTML is a first-class concern worth designing around.

---

## 2. What Dashbase Is

- A **CSS component library** for **web applications** (not universal/marketing sites)
- Styles **semantic HTML elements directly**: `<button>`, `<input>`, `<dialog>`, etc.
- Uses **named custom elements** (not web components) as readable structural containers where no semantic HTML equivalent exists: `<form-field>`, `<input-group>`, `<tab-panel>`
- **Themeable via CSS custom properties** — from zero overrides (pure browser defaults) to a fully opinionated design system
- **Compiled to pure CSS** — no runtime dependency on Tailwind or any framework
- **Optionally composable with Tailwind** — import Dashbase alongside Tailwind for utility overrides
- **Modular** — import `base.css` + only the component files you use
- Authored using **`@apply`** against Tailwind during development; output is vanilla CSS
- Targets the **three major browser engines**: Blink (Chrome/Edge), Gecko (Firefox), WebKit (Safari) — and welcomes Ladybird as a future target

---

## 3. What Dashbase Is Not

- **Not a universal CSS library.** It assumes you own the HTML. Global element targeting is intentional and acceptable in a web application context.
- **Not pixel-perfect across browsers.** Browser rendering differences are embraced, not fought. What matters is functional consistency, not visual identity across renderers.
- **Not a CSS reset library.** Dashbase does not zero out browser defaults. It refines them.
- **Not a JavaScript component library.** Core styling requires no JS. Progressive enhancement via minimal vanilla JS is acceptable and documented per component.
- **Not a web component library.** Named custom elements are plain HTML unknowns — no shadow DOM, no registration, no framework.
- **Not a Tailwind replacement.** It complements Tailwind by handling the semantic layer. Tailwind handles exceptions.

---

## 4. Core Design Decisions & Why

### 4.1 Global Element Targeting

**Decision:** Style `<button>`, `<input>`, `<select>` etc. at the element level, not via opt-in classes.

**Why:** In a web application, you own the HTML. There is no third-party content that will accidentally inherit styles. Opt-in via class (`.btn`) means every element requires ceremony. Opt-out is dramatically less friction. The few exceptions (icon buttons, reset buttons) use a modifier class or attribute to override.

---

### 4.2 No CSS Reset (or Minimum Reset)

**Decision:** Do not use a CSS reset. Do not use normalize.css. Apply only surgical fixes for genuinely broken cross-browser behaviour (e.g., `box-sizing: border-box`).

**Why:** Browser defaults exist because accessibility and platform teams thought about them. A reset discards focus rings, form element behaviour, touch target sizes, and system integration — all of which then need to be rebuilt in JS at worse quality. Browsers have largely converged since the normalize era. Most of what normalize "fixed" no longer needs fixing.

**Minimum reset (the only globally applied rules):**

```css
@layer dashbase.reset {
  *, *::before, *::after {
    box-sizing: border-box;
  }
}
```

That's it unless a specific, documented cross-browser bug requires more.

---

### 4.3 CSS Custom Properties for Theming (Spectrum Model)

**Decision:** All visual opinions are expressed as CSS custom properties with browser-native fallbacks. Components read from variables; variables are optional.

**Why:** This creates a natural theming spectrum:

| Level | What's defined | Result |
|---|---|---|
| **None** | Nothing | Pure browser defaults. Fully native. |
| **Minimal** | `--color-primary`, `--radius` | Tinted native. Still feels system-native. |
| **Full** | Entire token set | Fully designed product. Opinionated. Still not pixel-perfect — and that's fine. |

The same component CSS works across all three levels. Undefined variables fall back to browser values. This is intentional graceful degradation toward the platform, not error handling.

---

### 4.4 Named Custom Elements (Not Web Components)

**Decision:** Use named custom HTML elements — `<form-field>`, `<input-group>`, `<tab-panel>` — as structural wrappers where no semantic HTML equivalent exists. These are **not** web components. They require no registration, no shadow DOM, no JavaScript.

**Why:** The HTML spec permits unknown elements. They parse as `HTMLUnknownElement`, render as block elements (like `<div>`), and are fully styleable via CSS. An anonymous `<div class="form-field">` carries no meaning to a reader. `<form-field>` is self-documenting. This restores readability to structural markup without inventing a parallel component system.

**The rule is strict:**
- If a semantic HTML element exists → use it (`<fieldset>`, `<dialog>`, `<details>`, `<output>`)
- If no semantic equivalent exists → use a named custom element
- Never use `<div>` as a container if either of the above applies

---

### 4.5 `@layer` as the Foundation

**Decision:** All Dashbase styles live in named `@layer` blocks. Layer order is declared in `base.css`.

**Why:** Layers make Dashbase composable without specificity conflicts. Dashbase styles live below utilities. Tailwind utilities land above and can override without `!important`. Teams can add their own layers. Nothing fights.

```css
@layer dashbase.reset, dashbase.tokens, dashbase.base, dashbase.components, utilities;
```

---

### 4.6 Tailwind as Build-Time Vocabulary, Not Runtime Dependency

**Decision:** Author component CSS using `@apply` against Tailwind's utility classes. Compile to plain CSS. Ship no Tailwind dependency in the output.

**Why:** Tailwind's design tokens (spacing scale, color system, shadow values, easing curves) represent years of considered defaults. `@apply` lets us consume that vocabulary at build time without coupling consumers to Tailwind. Teams that want Tailwind get it. Teams that don't are unaffected.

**Future direction:** A planned sister project, **Baseline CSS**, will replace even the `@apply`/Tailwind compiler dependency with a standalone token vocabulary, making Dashbase fully self-contained.

---

### 4.7 Modularity Model

**Decision:** `base.css` is always required and must remain small (tokens + layer declarations only). All component files are optional and independently importable.

**Why:** shadcn demonstrated that per-component delivery is the right model for larger projects. Unlike shadcn, Dashbase doesn't require copy-paste ceremony — it's just CSS file imports. Small projects import everything; large projects import what they use.

```html
<!-- Always -->
<link rel="stylesheet" href="dashbase/base.css">

<!-- Only what you need -->
<link rel="stylesheet" href="dashbase/components/button.css">
<link rel="stylesheet" href="dashbase/components/dialog.css">
```

---

### 4.8 Progressive Enhancement for JS-Dependent Behaviour

**Decision:** Core styling requires zero JavaScript. Components that require behaviour (dialog open/close, tab switching, dropdown) use the most native available HTML/CSS mechanism first, then add a minimal vanilla JS progressive enhancement layer where unavoidable. No framework dependency.

**JS-free components (CSS/HTML only):**
`<button>`, `<input>`, `<textarea>`, `<select>`, `<checkbox>`, `<radio>`, `<fieldset>`, `<input-group>`, `<card>`, `<badge>`, `<alert>`, `<avatar>`, `<table>`, `<details>` (accordion)

**Components requiring minimal progressive enhancement:**
- `<dialog>` — Use Popover API (`popovertarget`) for panels; use Invoker Commands (`invoketarget="showModal"`) for modal dialogs. Chrome 135+ supports invoker commands natively; a small shim handles the gap.
- `tabs` — No native HTML element exists. Use `role="tablist"` / `role="tab"` / `aria-selected` + a small JS snippet for keyboard navigation and panel switching.
- `dropdown` — Custom content dropdowns use the Popover API. `<select>` is used where native semantics apply.

---

## 5. Architecture

### Layer Stack

```
┌─────────────────────────────────────┐
│  utilities          (Tailwind / user overrides)  │  highest specificity
├─────────────────────────────────────┤
│  dashbase.components                │
├─────────────────────────────────────┤
│  dashbase.base                      │
├─────────────────────────────────────┤
│  dashbase.tokens                    │
├─────────────────────────────────────┤
│  dashbase.reset     (box-sizing only)│
├─────────────────────────────────────┤
│  browser defaults                   │  lowest — load-bearing, not discarded
└─────────────────────────────────────┘
```

### Token Dependency Rule

`base.css` must be loaded before any component. Component files have no dependencies on each other. This means any subset of components can be imported in any order after `base.css`.

### State Management via CSS

Prefer CSS-native state selectors over JS class toggling wherever possible:

```css
/* Invalid state — no JS needed */
form-field:has(input:invalid) label { color: var(--color-danger); }

/* Focus styling the container — no JS needed */
form-field:has(input:focus-visible) { outline: ...; }

/* Disabled — use the attribute, not a class */
button[disabled] { ... }

/* Checked — native attribute */
input[type="checkbox"]:checked { ... }

/* ARIA states for JS-managed components */
[aria-selected="true"] { ... }
[aria-expanded="true"] { ... }
[aria-invalid="true"] { ... }
```

---

## 6. Theming System

### Token Categories

All tokens are CSS custom properties defined in `base.css` under `@layer dashbase.tokens`. All have fallbacks to browser system values or sensible minimums.

```css
@layer dashbase.tokens {
  :root {
    /* Color — oklch for perceptual uniformity */
    --color-primary: oklch(55% 0.2 250);
    --color-primary-fg: oklch(98% 0 0);
    --color-danger: oklch(55% 0.22 25);
    --color-success: oklch(55% 0.18 145);
    --color-warning: oklch(75% 0.18 80);
    --color-neutral: oklch(50% 0.01 270);
    --color-surface: oklch(98% 0 0);
    --color-border: oklch(85% 0.01 270);

    /* Derived states via color-mix — no separate hover tokens needed */
    --color-primary-hover: color-mix(in oklch, var(--color-primary) 85%, black);
    --color-primary-subtle: color-mix(in oklch, var(--color-primary) 15%, white);

    /* Typography */
    --font-sans: system-ui, sans-serif;
    --font-mono: ui-monospace, monospace;
    --text-sm: clamp(0.75rem, 1.5vw, 0.875rem);
    --text-base: clamp(0.875rem, 2vw, 1rem);
    --text-lg: clamp(1rem, 2.5vw, 1.125rem);

    /* Spacing */
    --space-1: 0.25rem;
    --space-2: 0.5rem;
    --space-3: 0.75rem;
    --space-4: 1rem;
    --space-6: 1.5rem;
    --space-8: 2rem;

    /* Radius */
    --radius-sm: 0.25rem;
    --radius-md: 0.375rem;
    --radius-lg: 0.5rem;
    --radius-full: 9999px;

    /* Shadows */
    --shadow-sm: 0 1px 2px oklch(0% 0 0 / 0.05);
    --shadow-md: 0 4px 6px oklch(0% 0 0 / 0.07);

    /* Transitions */
    --duration-fast: 100ms;
    --duration-base: 150ms;
    --easing-default: ease;

    /* Color scheme */
    color-scheme: light dark;
  }

  @media (prefers-color-scheme: dark) {
    :root {
      --color-surface: oklch(15% 0.01 270);
      --color-border: oklch(30% 0.01 270);
      /* primary, danger etc. adjust automatically via oklch */
    }
  }
}
```

### color-mix() Pattern

Dashbase uses `color-mix(in oklch, ...)` throughout to derive hover, active, subtle, and disabled states from a single base token. This means a minimal theme needs to define very few variables — derived states come for free.

---

## 7. Modern CSS Feature Set

Dashbase targets the **Baseline: Widely Available** tier or better for most features. Newly available features are used where the enhancement is significant and the fallback is graceful. The list below is the explicit target — implementors should default to these over older equivalents and should continue adopting new platform features as they reach adequate coverage.

### Required (use everywhere)

| Feature | Usage |
|---|---|
| `@layer` | Entire cascade architecture |
| CSS Custom Properties | All theming and tokens |
| CSS Nesting | Component state and variant styles |
| `:is()` / `:where()` | Selector grouping without specificity cost |
| `:has()` | Parent/sibling state styling, eliminates JS class toggling |
| Enhanced `:not()` | Complex exclusion selectors |
| `oklch()` colors | Perceptually uniform color system |
| `color-mix()` | Derived state colors from base tokens |
| `color-scheme` | Native light/dark integration |
| Logical properties | `margin-inline`, `padding-block` — RTL free |
| `clamp()` / `min()` / `max()` | Fluid typography and spacing |
| `aspect-ratio` | Media and avatar sizing |
| `fit-content` | Intrinsic sizing |
| Grid layout | All two-dimensional layouts |
| `gap` | Spacing in flex and grid |
| Individual transform properties | `translate`, `rotate`, `scale` |
| Media query range syntax | `@media (width >= 768px)` |

### Use where applicable

| Feature | Usage |
|---|---|
| Container size queries | Components that respond to their container, not the viewport |
| `:nth-child(n of selector)` | Filtered child selection |
| `@property` | Typed custom properties, animatable variables |
| Popover API (HTML + CSS) | Dialog, dropdown, tooltip without JS |
| Invoker Commands | `invoketarget` / `invokeaction` for dialog triggers |
| `field-sizing: content` | Auto-growing textarea |
| `text-wrap: balance` / `pretty` | Typographic refinement |
| `interpolate-size` | Animating to/from `auto` dimensions |
| `anchor-positioning` | Tooltip and popover placement (when baseline improves) |
| `appearance: base-select` | Native select styling (Chrome flag → watch for release) |
| `@starting-style` | Entry animations without JS |
| View Transitions API | Page and component transitions |
| Subgrid | Alignment across nested grid components |

### Guiding principle

> If a modern CSS feature eliminates a JavaScript dependency, use it. If it eliminates a wrapper `<div>`, use it. If it makes the HTML more readable, use it. Browser support concerns are secondary to platform progress — graceful degradation is acceptable; blocking on legacy browsers is not.

---

## 8. Component Inventory

### Phase 1 — Form Elements (pure CSS, no JS)

| Component | HTML Element | Notes |
|---|---|---|
| Button | `<button>` | Variants: `.primary`, `.danger`, `.ghost`, `.outline`, `.link`. Sizes: `.sm`, `.lg` |
| Input | `<input>` | All relevant types: `text`, `email`, `password`, `number`, `search`, `url`, `tel` |
| Textarea | `<textarea>` | Auto-grow via `field-sizing: content` with JS fallback |
| Select | `<select>` | Native; `appearance: base-select` opt-in when available |
| Checkbox | `<input type="checkbox">` | Custom mark via CSS, no `<div>` wrapper |
| Radio | `<input type="radio">` | Custom mark via CSS |
| Form Field | `<form-field>` (custom element) | Wraps label + input + hint + error. State via `:has()` |
| Input Group | `<input-group>` (custom element) | Prefix/suffix slots using CSS grid |
| Fieldset | `<fieldset>` / `<legend>` | Group of related fields |

### Phase 2 — Layout & Content (pure CSS)

| Component | HTML Element | Notes |
|---|---|---|
| Card | `<article>` or `<section>` | With `<card-header>`, `<card-body>`, `<card-footer>` custom children |
| Badge | `<mark>` or `<span>` with role | Inline, no wrapper needed |
| Alert | `<output>` or `<aside>` with `role="alert"` | Variants: info, success, warning, danger |
| Avatar | `<img>` or `<abbr>` (initials fallback) | With `<avatar-group>` for stacks |
| Table | `<table>` | Full semantic table with `<thead>`, `<tbody>`, etc. |

### Phase 3 — Interactive (JS progressive enhancement)

| Component | HTML Basis | JS Requirement |
|---|---|---|
| Dialog / Modal | `<dialog>` | Popover API for panels; Invoker Commands for `.showModal()`. Shim for gap. |
| Accordion | `<details>` / `<summary>` | Zero JS — native open/close. Animation via `@starting-style` + `interpolate-size`. |
| Tabs | `<tab-list>`, `<tab-panel>` custom elements | Small JS for `aria-selected` + keyboard nav (arrow keys, Home, End) |
| Dropdown | `<details>` or Popover API | Pure CSS/HTML for simple cases. JS for complex menus. |
| Tooltip | `<[popover]>` + `anchor-positioning` | Minimal JS for trigger wiring until anchor-positioning is baseline |

### Phase 4 — Ecosystem Reach (post-MVP)

Combobox, Date Picker, Command Palette, Toast/Notification, Data Grid. These are explicitly behaviour-first and will require JS. Architecture TBD in a separate spec.

---

## 9. Custom Element Naming Convention

### Rules

1. Names must be hyphenated (HTML spec requirement for custom elements)
2. Names must be self-documenting — a developer should understand the element's role without a glossary
3. Use only where no semantic HTML equivalent exists
4. Never use for elements that carry interaction meaning — those must be real HTML elements

### Approved Custom Elements (v1)

```html
<form-field>       <!-- label + input + hint + error unit -->
<input-group>      <!-- prefix + input + suffix -->
<card-header>      <!-- heading area of a card -->
<card-body>        <!-- content area of a card -->
<card-footer>      <!-- action area of a card -->
<tab-list>         <!-- container for tab triggers -->
<tab-panel>        <!-- content panel for a tab -->
<avatar-group>     <!-- stacked avatar container -->
<badge-group>      <!-- inline cluster of badges -->
<page-header>      <!-- top-level app header region -->
<page-sidebar>     <!-- lateral navigation region -->
<page-main>        <!-- primary content region -->
<page-footer>      <!-- bottom region -->
```

### Anti-patterns

```html
<!-- ❌ Too generic — use real HTML -->
<container>
<wrapper>
<box>
<stack>

<!-- ❌ Has a real HTML equivalent — use it -->
<nav-bar>         <!-- use <nav> -->
<form-group>      <!-- use <fieldset> -->
<section-header>  <!-- use <hgroup> or <header> -->
<modal>           <!-- use <dialog> -->
<accordion>       <!-- use <details>/<summary> -->
```

---

## 10. Build Pipeline

### Development

```
src/
  tokens/
    base.css          ← @layer declarations + tokens
  components/
    button.css        ← authored with @apply
    input.css
    ...
tailwind.config.js    ← configured to scan src/ for @apply
```

### Compilation

```bash
# Tailwind CLI compiles @apply → vanilla CSS
npx tailwindcss -i src/base.css -o dist/base.css
npx tailwindcss -i src/components/button.css -o dist/components/button.css
# ... per component, or via a build script
```

### Output (`dist/`)

```
dist/
  base.css                  ← tokens + layer declarations (always required)
  dashbase.css              ← all components bundled (convenience)
  components/
    button.css
    input.css
    textarea.css
    select.css
    checkbox.css
    radio.css
    form-field.css
    input-group.css
    fieldset.css
    card.css
    badge.css
    alert.css
    avatar.css
    table.css
    dialog.css
    accordion.css
    tabs.css
    dropdown.css
```

### Output Properties

- Zero runtime JavaScript
- Zero Tailwind dependency
- Zero framework dependency
- Plain CSS, importable anywhere
- `base.css` target size: < 5kb uncompressed

### Optional Tailwind Interop

Teams using Tailwind include Dashbase `dist/` files before Tailwind's stylesheet. The `@layer` ordering ensures Tailwind utilities override Dashbase component styles without specificity conflicts.

---

## 11. File & Folder Structure

### Source Repository

```
dashbase/
├── src/
│   ├── base.css                  ← layer declarations, tokens
│   ├── reset.css                 ← box-sizing only
│   └── components/
│       ├── button.css
│       ├── input.css
│       ├── textarea.css
│       ├── select.css
│       ├── checkbox.css
│       ├── radio.css
│       ├── form-field.css
│       ├── input-group.css
│       ├── fieldset.css
│       ├── card.css
│       ├── badge.css
│       ├── alert.css
│       ├── avatar.css
│       ├── table.css
│       ├── dialog.css
│       ├── accordion.css
│       ├── tabs.css
│       └── dropdown.css
├── dist/                         ← compiled output (git-ignored or published)
├── themes/
│   ├── minimal.css               ← ~5 variables, near-native look
│   └── default.css               ← full token set, opinionated design
├── js/
│   ├── tabs.js                   ← progressive enhancement only
│   ├── dialog.js                 ← invoker command shim
│   └── dropdown.js
├── docs/                         ← examples and usage docs
├── tailwind.config.js
├── package.json
└── README.md
```

---

## 12. Implementation Phases

### Phase 0 — Foundation (before any components)

**Goal:** Establish the token system, layer architecture, and build pipeline. Nothing visual yet.

Tasks:
- [ ] Set up build pipeline: Tailwind CLI, per-file compilation, `dist/` output
- [ ] Author `base.css`: `@layer` declarations in correct order
- [ ] Define full token set in `dashbase.tokens` layer
- [ ] Implement `color-mix(in oklch)` derived state tokens
- [ ] Implement `color-scheme` light/dark token variants
- [ ] Write `reset.css` (box-sizing only — resist scope creep)
- [ ] Create `themes/minimal.css` and `themes/default.css`
- [ ] Verify `base.css` compiled size is under 5kb

**Exit criteria:** Import `base.css` into a blank HTML file. Open in Chrome, Firefox, Safari. Browser renders native elements with no visual regression. Token variables are inspectable in DevTools.

---

### Phase 1 — Form Elements

**Goal:** The most day-to-day components. Prove the concept where the "view source" problem is worst.

Order: `button` → `input` → `textarea` → `checkbox` → `radio` → `select` → `form-field` → `input-group` → `fieldset`

For each component:
- [ ] Author `src/components/{name}.css` using `@apply`
- [ ] Compile to `dist/components/{name}.css`
- [ ] Write a minimal HTML test page using only semantic elements
- [ ] Verify: renders reasonably in Chrome, Firefox, Safari (not pixel-perfect — functionally consistent)
- [ ] Verify: keyboard navigation works without JS
- [ ] Verify: disabled, invalid, focus states via native attributes only
- [ ] Document any variant classes used (`.primary`, `.danger`, `.sm`, `.lg`)

**Button specifics:**
```css
@layer dashbase.components {
  button {
    /* Only override what matters — let browser set font, cursor, etc. */
    background-color: var(--color-neutral, ButtonFace);
    color: var(--color-neutral-fg, ButtonText);
    border-radius: var(--radius-md);
    padding-block: var(--space-2);
    padding-inline: var(--space-4);
    transition: background-color var(--duration-fast) var(--easing-default);

    &:hover:not([disabled]) {
      background-color: color-mix(in oklch, var(--color-neutral) 85%, black);
    }

    &[disabled] {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &.primary {
      background-color: var(--color-primary);
      color: var(--color-primary-fg);
    }

    &.danger {
      background-color: var(--color-danger);
      color: white;
    }
  }
}
```

**form-field specifics (uses `:has()`):**
```css
@layer dashbase.components {
  form-field {
    display: grid;
    gap: var(--space-1);

    & label { ... }
    & [data-hint] { font-size: var(--text-sm); color: var(--color-neutral); }
    & [data-error] { display: none; color: var(--color-danger); }

    /* Parent responds to child state — zero JS */
    &:has(input:invalid) {
      & [data-error] { display: block; }
      & label { color: var(--color-danger); }
      & input { border-color: var(--color-danger); }
    }

    &:has(input:focus-visible) label {
      color: var(--color-primary);
    }
  }
}
```

---

### Phase 2 — Layout & Content Components

Order: `card` → `badge` → `alert` → `avatar` → `table`

Key decisions:
- `<card>` uses `<article>` by default (semantically: a self-contained composition). Where `<article>` is inappropriate (e.g., a settings panel), `<section>` is used.
- `<card-header>`, `<card-body>`, `<card-footer>` are custom elements — no semantic HTML equivalent for card sub-regions.
- `<badge>` uses `<mark>` for inline highlighted content; `<span role="status">` for dynamic badges.
- `<alert>` uses `<output role="alert">` for live regions; `<aside>` for static contextual alerts.
- Avatar stack uses `<avatar-group>` with CSS `margin-inline-start: -var(--space-2)` via `:not(:first-child)`.

---

### Phase 3 — Interactive Components

Order: `accordion` → `dialog` → `tabs` → `dropdown`

**Accordion (zero JS):**

```html
<details>
  <summary>Section title</summary>
  <p>Content here</p>
</details>
```

Animation via `@starting-style` + `interpolate-size: allow-keywords`:

```css
details[open] > :not(summary) {
  animation: slide-down var(--duration-base) ease;
}

@starting-style {
  details[open] > :not(summary) {
    opacity: 0;
    translate: 0 -0.5rem;
  }
}
```

**Dialog:**

```html
<!-- Panel (Popover API — zero JS) -->
<button popovertarget="settings-panel">Open Settings</button>
<dialog id="settings-panel" popover>...</dialog>

<!-- Modal (Invoker Commands — shim for non-Chrome) -->
<button invoketarget="confirm-modal" invokeaction="showModal">Confirm</button>
<dialog id="confirm-modal">...</dialog>
```

JS shim (`js/dialog.js`, ~10 lines) for browsers without invoker command support:
```js
document.querySelectorAll('[invoketarget]').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = document.getElementById(btn.getAttribute('invoketarget'));
    const action = btn.getAttribute('invokeaction');
    if (target && action === 'showModal') target.showModal();
    if (target && action === 'close') target.close();
  });
});
```

**Tabs:**

```html
<tab-list role="tablist">
  <button role="tab" aria-selected="true" aria-controls="panel-1">One</button>
  <button role="tab" aria-selected="false" aria-controls="panel-2">Two</button>
</tab-list>
<tab-panel id="panel-1" role="tabpanel">...</tab-panel>
<tab-panel id="panel-2" role="tabpanel" hidden>...</tab-panel>
```

JS (`js/tabs.js`, ~30 lines): manages `aria-selected`, `hidden`, keyboard navigation (ArrowLeft/Right, Home, End).

---

### Phase 4 — Theme Verification

- [ ] Test all components with no theme (pure browser defaults, no Dashbase tokens)
- [ ] Test all components with `themes/minimal.css`
- [ ] Test all components with `themes/default.css`
- [ ] Test all components in dark mode (automatic via `color-scheme`)
- [ ] Verify `base.css` + all components < 20kb uncompressed total
- [ ] Verify all components in Chrome, Firefox, Safari — document any intentional rendering differences

---

## 13. Authoring Guidelines for Implementors

### Do

- **Style the element, not a wrapper.** `button { }` not `.button { }`.
- **Use native attributes for state.** `[disabled]`, `[aria-invalid]`, `:checked`, `:focus-visible`.
- **Use `:has()` for parent state.** Eliminate JS class toggling wherever CSS can do it.
- **Use `color-mix(in oklch)` for derived colors.** Never define separate hover/active tokens.
- **Use logical properties.** `padding-inline` not `padding-left/right`. `margin-block` not `margin-top/bottom`.
- **Use `clamp()` for fluid sizing.** Avoid fixed px values for typography and spacing where fluid behaviour makes sense.
- **Use CSS nesting for variants and states.** Keep component CSS self-contained.
- **Use `@layer dashbase.components` for all component rules.** No naked rules outside layers.
- **Fallback to browser/system values.** `var(--color-primary, ButtonFace)` — the fallback is load-bearing.
- **Minimise what you set.** Every property you set that the browser would've set the same way is maintenance debt.

### Don't

- **Don't reset browser defaults** unless a specific documented cross-browser bug requires it.
- **Don't use `!important`.** If you're reaching for it, the layer architecture is wrong.
- **Don't use `<div>` as a container** when a semantic HTML element or a named custom element is appropriate.
- **Don't add class names for styling state** that CSS can detect via attributes or `:has()`.
- **Don't define both a base token and a hover token** if `color-mix()` can derive the hover.
- **Don't pixel-perfect across browsers.** Test for functional consistency, not visual identity.
- **Don't add JavaScript** if the HTML/CSS platform can handle it. If JS is needed, keep it under 50 lines per component and document why.
- **Don't use vendor prefixes** unless required by a specific, documented browser bug.
- **Don't use `em` for spacing** — prefer `rem` for predictability or logical properties.

---

## 14. Open Questions & Future Work

### Open Questions

1. **`<select>` styling** — `appearance: base-select` is Chrome-only behind a flag. Decision needed: accept limited styling for now, or provide a custom select built on the Popover API? Recommendation: ship native `<select>` with modest styling for Phase 1; track `base-select` and upgrade when widely available.

2. **Dark mode token strategy** — Should dark mode tokens be defined in `base.css` via `@media (prefers-color-scheme: dark)`, or should a `data-theme="dark"` attribute be supported for manual override? Recommendation: both — `prefers-color-scheme` by default, `[data-theme="dark"]` override for apps with a theme toggle.

3. **Icon button pattern** — A bare `<button>` with only an icon needs a different shape (square, smaller padding). Convention: `<button class="icon" aria-label="Close">` or detect via `:has(svg:only-child)`. Prefer `:has()` approach.

4. **Anchor positioning** — Currently limited browser support. Tooltips and floating dropdowns will need a JS fallback. Track `@property anchor-name` / `position-anchor` and upgrade when baseline improves.

### Future Work

- **Baseline CSS** — A standalone token vocabulary project that replaces the `@apply`/Tailwind compiler dependency entirely. Makes Dashbase fully self-contained.
- **ReUI-style patterns** — Once shadcn-parity is reached for the semantic layer, evolve with composition patterns inspired by ReUI.
- **Phase 4 components** — Combobox, Date Picker, Toast, Command Palette. Behaviour-first; separate JS architecture spec needed.
- **Design tokens export** — Export tokens in Style Dictionary format for Figma / design tool integration.
- **View Transitions** — Page-level and component-level transitions using the View Transitions API once cross-browser support improves.
- **Ladybird compatibility** — Track the Ladybird browser engine and add to the test matrix when available.

---

## Appendix: Principles Summary

> 1. The browser is an ally, not a bug to be worked around.
> 2. HTML should be readable by a human without tooling.
> 3. Native elements carry semantics, accessibility, and platform integration for free — never discard that for styling convenience.
> 4. Where HTML has a gap, named custom elements fill it readably.
> 5. CSS custom properties + `@layer` + `:has()` have made most JavaScript UI glue obsolete.
> 6. Pixel-perfect across browsers is the wrong goal. Functionally consistent is the right one.
> 7. Minimise what you set. Browser defaults are load-bearing until proven otherwise.
> 8. Every property you define is maintenance. Every class you require is ceremony.

---

*Document prepared for implementation handoff. Pass to implementing model alongside any additional context on the current state of the token system or component specs.*
