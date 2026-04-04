# Dashbase — Product Requirements & Implementation Plan

> A semantic-first CSS component library for web applications.  
> Version 0.2 — Current Direction

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

Dashbase exists because modern frontend HTML often becomes unreadable long before it becomes powerful. The library starts from a simple belief: the web platform is already strong enough to carry much more of the UI layer than most projects let it.

Dashbase restores a clearer contract:

- HTML expresses structure and meaning
- CSS expresses presentation and theming
- JS is only introduced when the platform has a genuine behavioral gap

This is not nostalgia. It is a deliberate product decision aimed at application UI, where teams usually own the HTML and can benefit from styling semantic elements directly instead of wrapping everything in utility classes or framework-only abstractions.

---

## 2. What Dashbase Is

- A **semantic-first CSS component library** for **web applications**
- A **browser-native design system** built on modern CSS, CSS custom properties, and small progressive-enhancement shims
- A **component-first source tree** where each component owns its CSS, optional behavior, examples, and contract metadata
- A **pattern system** for higher-level native HTML compositions such as form fields, login boxes, and dashboard shells
- A **contract-first generator pipeline** that can emit framework targets such as React, Svelte, and Vue from the same source of truth
- A **modular distribution**: baseline layers, per-component assets, optional bundles, generated adapters, and a lightweight preview tree

---

## 3. What Dashbase Is Not

- **Not a classless website stylesheet.** Dashbase targets app UIs, not arbitrary third-party content.
- **Not a utility-first library.** Utilities can sit on top, but they are not the primary authoring model.
- **Not a JS framework.** Behavior shims exist, but they are intentionally small and browser-oriented.
- **Not a web component system.** Named custom elements are plain HTML tags without registration or shadow DOM.
- **Not a pixel-perfect renderer.** Cross-browser functional consistency matters more than visual identity down to the last pixel.
- **Not a universal behavior DSL.** The source of truth is plain HTML, CSS, minimal JS, and explicit contracts.

---

## 4. Core Design Decisions & Why

### 4.1 Style Semantic Elements Directly

Dashbase styles real HTML elements like `<button>`, `<input>`, `<dialog>`, and `<details>` directly. This keeps authored markup readable and preserves platform semantics.

### 4.2 Use Named Custom Elements Only Where Semantics Run Out

When HTML has no honest structural equivalent, Dashbase prefers readable custom element names such as `<form-field>`, `<tab-list>`, `<popover-panel>`, or `<ui-carousel>` instead of anonymous `<div>` wrappers.

### 4.3 Keep the Reset Minimal

Browser defaults are load-bearing. Dashbase uses only a light reset and then layers tokens, primitives, base rules, and components above the browser rather than erasing the platform and rebuilding it.

### 4.4 Use CSS Variables Across the Whole Spectrum

Dashbase should work across a theming spectrum:

- no overrides: near-native browser look
- minimal overrides: lightly branded
- full token set: fully designed product UI

Components read from tokens and derived values rather than hardcoded visual constants.

### 4.5 Prefer Native State and Native Behavior

Dashbase uses native states and selectors whenever possible:

- `:has()`
- `[open]`
- `[disabled]`
- `[aria-selected="true"]`
- `[aria-expanded="true"]`
- `details[name]`

If the platform can already do the job, Dashbase should not replace it with extra wrappers or JS.

### 4.6 Keep Shims Small and Browser-Focused

Behavior shims exist for things like tabs, popovers, comboboxes, and carousels. They should stay lean and serve plain HTML first. Framework adapters can add their own lifecycle or event-bridging glue on top.

### 4.7 Make Contracts Explicit

Dashbase does not infer everything from source. Each component or pattern can carry an explicit contract that describes the public anatomy, variants, states, docs examples, and adapter-facing metadata. This keeps generated targets and docs from silently drifting.

### 4.8 Patterns Are First-Class

App builders reach for patterns before primitives. Dashbase therefore treats native HTML patterns as a formal layer, with composition references, contracts, manifests, and future registry potential.

---

## 5. Architecture

### Layer Stack

```
browser defaults
  -> reset
  -> tokens
  -> primitives
  -> base
  -> components
  -> utilities
```

Dashbase currently uses that explicit order in baseline CSS and in the authored component files.

### Source of Truth

Dashbase source is organized around three parallel concerns:

- **components**: primitive UI building blocks
- **patterns**: higher-level compositions built from components and other patterns
- **contracts**: explicit machine-readable descriptions used for validation and generation

### Distribution Model

Build output currently includes:

- `dist/baseline.css` and `dist/baseline.min.css`
- `dist/components/<name>/<name>.css|js` and matching `.min.*`
- `dist/bundles/dashbase.css` and `.min.css`
- `dist/preview/index.html` and a lightweight preview tree
- generated framework targets under `generated/`

### Generated Targets

Dashbase does not maintain fully separate hand-authored React, Svelte, and Vue libraries as the primary path. Instead:

- the core library remains HTML/CSS/JS
- contracts define the adapter surface
- generators emit shim-backed targets by default
- per-target overrides remain opt-in

---

## 6. Theming System

Dashbase theming is token-driven.

### Token Layers

- foundation tokens live in `src/baseline/tokens.css`
- primitives and base rules sit above them
- themes override tokens rather than restyling every component from scratch

### Theme Modes

- `themes/minimal.css`: near-native, very light touch
- `themes/default.css`: richer opinionated token set

### Desired Property

Any component should remain usable even when only a partial token set is present. Missing visual opinions should degrade toward the browser, not toward broken UI.

---

## 7. Modern CSS Feature Set

Dashbase should continue leaning on the platform aggressively, as long as fallback behavior remains graceful.

### Foundational Features

- `@layer`
- CSS custom properties
- CSS nesting
- logical properties
- `:is()`, `:where()`, `:has()`
- `oklch()` and `color-mix()`
- `@starting-style`
- `aspect-ratio`
- grid / flex / gap

### Features to Use Opportunistically

- container queries where the component truly responds to container size
- `details[name]` for native exclusive disclosure groups
- `transition-behavior: allow-discrete` when it improves open/close polish without a JS fallback
- `interpolate-size` when it provides meaningful animation and unsupported browsers still behave correctly
- subgrid where pattern-level alignment benefits from it
- CSS math functions when they simplify real layout logic rather than merely looking clever

### Guiding Principle

If a modern CSS feature removes JS, removes wrapper markup, or makes authored HTML clearer, it is a good candidate for Dashbase. Unsupported browsers should still get a working component, even if they miss the enhancement.

---

## 8. Component Inventory

Dashbase now has broad component coverage across:

- form controls
- content and layout primitives
- overlays
- navigation
- data display
- interactive composites

Representative shipped areas include:

- buttons, inputs, selects, labels, switches, sliders, form fields
- cards, tables, badges, avatars, separators, breadcrumbs, pagination
- dialogs, drawers, popovers, menus, tooltips, hover cards, toast
- tabs, command palette, combobox, calendar, date picker
- resizable layouts, scroll areas, carousel, charts, data tables

Patterns are now a separate layer above these components and should keep growing.

---

## 9. Custom Element Naming Convention

### Rules

1. Names must be hyphenated.
2. Prefer native HTML first.
3. Use custom element names only when they genuinely improve readability.
4. Keep names structural and honest.

### Good Examples

```html
<form-field>
<input-group>
<tab-list>
<tab-panel>
<popover-panel>
<ui-carousel>
<control-bar>
```

### Bad Examples

```html
<box>
<wrapper>
<container>
<carousel>
<item>
```

The naming rule is not cosmetic. Invalid or vague names weaken both readability and generated-target stability.

---

## 10. Build Pipeline

### Current Build Responsibilities

The build currently:

1. validates examples and docs snippets against component and pattern contracts
2. generates the pattern manifest
3. mirrors component assets into `dist/`
4. emits readable and minified outputs side by side
5. emits an optional full CSS bundle
6. generates a lightweight preview tree and preview index

### Current Generator Responsibilities

The target generators currently:

- read explicit contracts
- emit package-shaped React, Svelte, and Vue outputs
- generate component docs and selected examples
- default to shim-backed adapters
- reserve opt-in target overrides for later

### Design Goal

Keep the pipeline simple, inspectable, and portable. The long-term shape should still be compatible with a leaner custom build tool if Bun-specific conveniences become limiting.

---

## 11. File & Folder Structure

### Current High-Level Layout

```text
src/
  baseline/
  components/<component>/
  patterns/<category>/<family>/<variant>/
  examples/
themes/
scripts/
  build/
  contracts/
  patterns/
  targets/
generated/
dist/
docs/
```

### Component Folder Principle

Each component folder should be the obvious home for:

- CSS
- optional behavior shim
- example page(s)
- contract file(s)
- future target overrides or additional metadata

### Pattern Folder Principle

Each pattern folder should be the obvious home for:

- canonical native HTML source
- pattern contract
- author-time composition references
- future assets or target-specific overrides

---

## 12. Implementation Phases

The project has already moved beyond the early “prove the concept” phase. The next phases are more about quality, completeness, and tooling.

### Current Focus

- keep docs aligned with the real repo
- expand contract coverage beyond the current pilot set
- keep generated targets honest and deterministic
- expand pattern coverage and composition ergonomics
- improve discoverability and preview tooling
- add stronger accessibility, visual, and browser-level validation

### Near-Term Priorities

1. contract rollout across more components
2. better preview and docs surface
3. stronger SSR/client-hosting rules in generated adapters
4. testing and parity verification across targets
5. more native platform wins where they clearly reduce JS or markup

---

## 13. Authoring Guidelines for Implementors

- Prefer semantic HTML first.
- Prefer native behavior first.
- Keep CSS layered and readable.
- Keep behavior shims narrowly scoped.
- Use contracts to describe public structure, not every implementation detail.
- Treat examples as product assets, not throwaway demos.
- When adding pattern composition, keep the authored source expressive and the built output plain.
- Only add contract fields when generation, validation, or docs genuinely need them.

---

## 14. Open Questions & Future Work

- How far should contract coverage go before adapter generation becomes a default expectation?
- Which components should remain shim-backed long term, and which should graduate to controller-backed or framework-native overrides?
- How should future registries for components and patterns be indexed and distributed?
- What is the smallest practical testing stack that still catches visual, accessibility, and parity regressions?
- Which modern platform features should be adopted next as graceful enhancements?

Dashbase should continue moving toward a contract-first, source-readable, browser-native system without collapsing into a mini framework of its own.
