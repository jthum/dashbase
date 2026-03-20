
# Dashbase — Architectural Context & Implementation Guidance
*Companion document to `dashbase-prd.md` and `dashbase-dsl-architecture.md`*

Version: 0.1  
Purpose: Preserve architectural intent and implementation philosophy for agents and contributors.

---

# 1. Purpose of This Document

The PRD and DSL architecture documents describe **what Dashbase is** and **how it should work**.

This document captures the **design philosophy, constraints, and engineering decisions discussed during planning** that may not be explicit in those documents.

It exists so that:

- Agents implementing Dashbase maintain the **original intent**
- Architectural decisions remain **consistent over time**
- Contributors understand **why certain trade‑offs were made**

This document is **normative guidance for implementation**, not a replacement for the PRD.

---

# 2. Core Architectural Principle

Dashbase follows the **original architecture of the web platform**:

```
HTML → structure
CSS → presentation
JS → behavior
```

Dashbase restores this separation for modern web applications.

Frameworks are treated as **adapters**, not as the foundation of the UI architecture.

The **browser platform is the primary runtime**.

---

# 3. HTML Is the Stable Interface

Dashbase intentionally makes **HTML the long‑term contract**.

Example:

```html
<form-field>
  <label>Email</label>
  <input type="email">
</form-field>
```

This markup remains valid even if:

- Dashbase CSS changes
- frameworks change
- the generator layer evolves
- the project disappears

This property ensures **long-term resilience of the UI layer**.

Framework wrappers are therefore **disposable convenience layers**, not the core API.

---

# 4. CSS Is the Source of Truth

Dashbase treats CSS as the authoritative implementation layer.

The DSL does **not describe styling**.

The DSL only describes:

- component contracts
- props
- slots
- events
- state
- relationships

Example:

```
variant.primary → class="primary"
```

NOT:

```
variant.primary → color: red
```

CSS always remains the **canonical styling implementation**.

---

# 5. The Role of the DSL

The DSL exists **only for development and code generation**.

It is not used in application code.

The DSL enables:

- generation of framework adapters
- consistent component APIs
- automated documentation
- machine-readable contracts for agents

Consumers of Dashbase **never interact with the DSL**.

---

# 6. DSL Is an Internal Contract Layer

The architecture looks like:

```
Dashbase CSS + JS
        ↓
DSL contracts
        ↓
dashbase-gen
        ↓
framework adapters
        ↓
applications
```

The DSL should be treated as **internal infrastructure**.

It may evolve without concern for external compatibility.

---

# 7. dashbase-gen Is Deterministic

The generator (`dashbase-gen`) must be **fully deterministic**.

It performs mechanical transformations only:

```
DSL → framework adapter code
```

It must not perform inference or interpretation.

This ensures:

- reproducible builds
- stable adapters
- predictable tooling

---

# 8. dashbase-extract Is NOT a Tool

Originally conceived as a tool, `dashbase-extract` should instead be treated as:

**an optional inference prompt**.

It exists as a workflow for agents or developers to generate a *candidate DSL contract* from source files.

Example workflow:

```
component source (CSS + JS + HTML examples)
        ↓
inference prompt
        ↓
proposed DSL
        ↓
human review
        ↓
committed DSL contract
```

Important constraints:

- extraction is **advisory**
- extraction is **never part of the build**
- extraction output must be **reviewed**
- DSL remains the **canonical contract**

---

# 9. Minimal Tooling Philosophy

Dashbase intentionally avoids heavy toolchains.

The system should remain lightweight.

Expected tooling footprint:

```
dashbase/
 ├ src/
 │   ├ css/
 │   ├ js/
 │   └ examples/
 │
 ├ dsl/
 │   ├ button.json
 │   ├ dialog.json
 │   └ tabs.json
 │
 ├ tools/
 │   └ dashbase-gen
 │
 └ prompts/
     └ dsl_inference.md
```

The goal is to avoid modern frontend ecosystems that require hundreds of megabytes of dependencies.

---

# 10. Tailwind as a Development Bridge

Dashbase uses Tailwind **only during authoring**.

Example:

```
@apply px-4 py-2 rounded-md shadow-sm
```

Tailwind provides:

- design tokens
- spacing scale
- color palette
- typography defaults

Compiled output is **plain CSS**.

Dashbase does **not depend on Tailwind at runtime**.

---

# 11. Baseline CSS

Baseline CSS is the future token layer for Dashbase.

Baseline will provide:

- token system
- design primitives
- default styling vocabulary

Dashbase components will eventually depend on Baseline rather than Tailwind.

However the systems should remain **compatible**.

Possible usage modes:

```
HTML + browser defaults
HTML + Baseline
HTML + Dashbase
HTML + Dashbase + Tailwind utilities
```

---

# 12. Selector Performance Considerations

Dashbase intentionally prioritizes **semantic markup** over selector simplicity.

Example:

```
form-field:has(input:invalid)
```

This is slower than class selectors, but the cost is negligible compared to modern application bottlenecks such as:

- large JavaScript bundles
- hydration
- virtual DOM diffing

The trade-off is considered acceptable for:

- cleaner markup
- reduced JS
- improved semantics

---

# 13. Semantic Custom Elements

Dashbase uses **unregistered custom elements** as structural primitives.

Example:

```
<form-field>
<input-group>
<tab-panel>
```

These provide readable structure without requiring:

- web component registration
- Shadow DOM
- framework integration

---

# 14. Dashbase as a Semantic UI Grammar

Dashbase markup intentionally forms a **structured UI language**.

Example:

```
<form-field>
<input-group>
<button>
```

This improves:

- human readability
- agent reasoning
- automated UI generation

The DSL reinforces this by exposing a machine-readable contract.

---

# 15. Dashbase as a UI Intermediate Representation

The architecture effectively creates a **UI intermediate representation (UI‑IR)**.

```
HTML + CSS source
        ↓
DSL contracts
        ↓
framework adapters
```

This design enables Dashbase to target any framework without rewriting the component library.

---

# 16. Agent-Assisted Development

Dashbase assumes agents will participate in development.

Agents may:

- generate component CSS
- infer DSL contracts
- maintain documentation
- generate framework adapters

The architecture intentionally supports this workflow.

---

# 17. Open-Ended Component Library

Dashbase is designed to grow beyond primitive components.

Inspired by projects like:

- shadcn/ui
- ReUI

The repository may include:

- primitives
- complex components
- compositional patterns

Components remain **opt-in**, so library growth does not create bundle bloat.

---

# 18. Long-Term Vision

Dashbase aims to provide:

- a semantic UI component system
- platform-native architecture
- minimal JS dependencies
- framework portability
- strong compatibility with AI-assisted development

It restores the original web philosophy while leveraging modern CSS capabilities.

---

# 19. Guiding Philosophy

Dashbase follows a simple rule:

> Use the web platform as far as it can go. Introduce abstractions only where the platform genuinely falls short.

---

# 20. State Must Be Expressed Semantically

Dashbase styles state from the platform outward.

State hooks follow this order:

- native selectors first: `:checked`, `[disabled]`, `[open]`, `:user-invalid`, `:focus-visible`
- ARIA attributes second when HTML lacks a native state hook: `[aria-expanded="true"]`, `[aria-selected="true"]`, `[aria-pressed="true"]`, `[aria-current]`
- `data-*` attributes only as a last resort for implementation details with no semantic equivalent

This keeps visual state and accessibility state aligned. If a control looks expanded, selected, or pressed, assistive technology should be able to observe the same truth.

---

# 21. Inline Custom Properties Are the Escape Hatch

Dashbase should not grow a new variant for every edge case.

The preferred one-off override mechanism is an inline or local custom property assignment that targets the component's existing variable surface.

Example:

```html
<button class="primary" style="--btn-bg: var(--color-danger)">
  Delete
</button>
```

This preserves readability, keeps overrides local, and avoids ad hoc selector battles.

---

# 22. Respect the Cascade Before Reaching for `@scope`

Dashbase does not treat local scoping as the default model. The normal cascade, semantic structure, and explicit child selectors remain the first tools.

`@scope` is an advanced containment tool for specific composite components that style generic descendants and need clear stop points at nested component boundaries. It belongs inside component files, not in Baseline.

Likely future use cases include content-bearing composites such as cards, dialogs, tabs, menus, and accordions. It should not be used merely to recreate framework-style local scoping everywhere.

---

# 23. CSS ↔ DSL Validation Comes After Component Parity

Strict validation between component CSS and the future DSL is desirable, but it should arrive after the component surface is broad enough to be worth locking down.

The current priority is reaching stable component parity and letting the CSS and vanilla behavior patterns settle. Once that surface is mature, Dashbase can add automated checks to ensure DSL contracts and CSS modifiers never drift apart.
