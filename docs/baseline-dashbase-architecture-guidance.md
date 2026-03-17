
# Dashbase / Baseline CSS Architecture Guidance
Companion document for refining `base.css` and planning the Baseline extraction.

Version: 0.1

---

# 1. Purpose

This document captures recommendations for improving the current `base.css` token system and
introducing a **primitive layer** between tokens and components.

It also proposes a clear boundary between:

- **Baseline CSS** → foundational design tokens and primitives
- **Dashbase** → semantic components and patterns

This document is intended for implementation by agents (e.g., Opus 4.6).

---

# 2. Extract Baseline CSS Immediately

Originally, Baseline CSS was envisioned as a future project replacing Tailwind as the token layer.

However, the current `base.css` already contains a sufficiently mature token system. Therefore
it is advisable to **extract Baseline CSS now** instead of introducing it later.

Recommended architecture:

```
Baseline CSS
   ↓
Dashbase components
   ↓
DSL + framework generators
```

Baseline becomes the **design vocabulary**, while Dashbase provides **semantic UI components**.

---

# 3. Baseline vs Dashbase Responsibilities

## Baseline CSS

Baseline should contain:

### Tokens

Design tokens and scales:

- color tokens
- typography tokens
- spacing scale
- radius scale
- shadow scale
- motion tokens
- focus ring tokens
- z-index scale

### Primitive Layers

Reusable structural patterns:

- control primitives
- layout primitives
- surface primitives
- typography primitives

### Base Element Defaults

Very minimal element styling:

- body typography
- focus ring
- reduced motion handling

Baseline **must not contain UI components**.

---

## Dashbase

Dashbase should contain:

- semantic component CSS
- custom semantic elements
- progressive enhancement JS
- component composition patterns
- DSL definitions

Dashbase components consume **Baseline tokens and primitives**.

---

# 4. Suggested CSS Layer Architecture

To make Baseline reusable across projects, layer names should be **framework-neutral**.

Recommended layer order:

```
reset
tokens
primitives
base
components
utilities
```

Example:

```css
@layer reset, tokens, primitives, base, components, utilities;
```

Then:

Baseline provides:

```
reset
tokens
primitives
base
```

Dashbase provides:

```
components
```

This avoids renaming layers if Baseline is reused outside Dashbase.

---

# 5. Token System Feedback

The current token system is strong and already suitable for Baseline.

Strengths:

- semantic color tokens
- OKLCH color space
- derived states via `color-mix`
- full spacing scale
- typography scale
- motion tokens
- focus ring tokens
- z-index tokens

Approximate token count: ~70 tokens, which is reasonable for a design system.

No reduction is required.

---

# 6. Token Organization Recommendation

Ensure tokens follow a consistent prefix taxonomy.

Recommended prefixes:

```
--color-*     color tokens
--surface-*   surfaces
--text-*      typography scale
--space-*     spacing scale
--radius-*    border radius
--shadow-*    elevation
--duration-*  animation duration
--easing-*    easing curves
--z-*         layering
```

This makes tokens easier for agents to reason about.

---

# 7. Introduce Control Tokens

Define reusable geometry tokens for interactive controls.

Example:

```css
--control-padding-inline: var(--space-4);
--control-padding-block: var(--space-2);
--control-radius: var(--radius-md);
--control-height: 2.5rem;
```

These should drive styling for:

- button
- input
- select
- textarea
- checkbox/radio containers

Benefits:

- consistent control sizing
- easier theming
- simpler component CSS
- easier automated UI generation

---

# 8. Introduce a Primitive Layer

Add a new layer:

```
@layer primitives
```

Primitives sit between tokens and components.

Architecture:

```
tokens → primitives → components
```

---

# 9. Control Primitives

Example primitive rule:

```css
@layer primitives {

  :where(button, input, select, textarea) {
    padding-inline: var(--control-padding-inline);
    padding-block: var(--control-padding-block);
    border-radius: var(--control-radius);
    font-size: var(--text-base);
  }

}
```

Components only define behavior specific to them.

---

# 10. Layout Primitives

Define reusable structural patterns.

Example:

```css
@layer primitives {

  :where(form-field) {
    display: grid;
    gap: var(--space-2);
  }

  :where(input-group) {
    display: grid;
    grid-auto-flow: column;
    gap: var(--space-1);
  }

}
```

Components should avoid redefining layout repeatedly.

---

# 11. Surface Primitives

Many components share surface styling:

- card
- dialog
- dropdown
- popover

Define shared surfaces:

```css
.surface-raised {
  background: var(--color-surface-raised);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}
```

Components can reuse these primitives.

---

# 12. Typography Primitives

Define semantic typography roles.

Example:

```css
.text-body { font-size: var(--text-base); }
.text-label { font-size: var(--text-sm); }
.text-heading { font-size: var(--text-xl); }
```

This prevents components from manually assembling typography.

---

# 13. Derived State Strategy

Current use of `color-mix()` is correct.

Example pattern:

```
hover: 85% base color + black
active: 75% base color + black
subtle: 12% base color + surface
```

Optionally introduce generic mix variables:

```
--color-hover-mix: 85%;
--color-active-mix: 75%;
```

But this is optional.

---

# 14. Design Rule for Components

Component CSS must follow these rules:

1. Only reference tokens or primitives
2. Never hardcode color values
3. Never hardcode spacing values
4. Prefer CSS state selectors over JS class toggling
5. Keep component CSS minimal

---

# 15. Resulting Architecture

Final stack:

```
browser defaults
↓
reset
↓
tokens
↓
primitives
↓
base
↓
components
↓
utilities
```

Baseline provides:

```
reset
tokens
primitives
base
```

Dashbase provides:

```
components
```

---

# 16. Benefits

This architecture provides:

- smaller component CSS
- consistent UI geometry
- easier theming
- reusable primitives
- easier agent reasoning
- clear separation between design system and component library

---
