# Dashbase — Component Authoring Guide

Rules for writing Dashbase component CSS. All components must follow this pattern.

---

## Architecture Stack

```
Primitives (zero-specificity defaults)
    ↓
Component base rule (structure + --component-* variables)
    ↓
Variant classes (variable reassignment only)
```

---

## Rules

### 1. Don't repeat what primitives provide

`primitives.css` already sets padding, font-size, border, border-radius, colors,
and transitions on all `button, input, select, textarea` via `:where()`.

Components must NOT redeclare these. They inherit them for free.

### 2. Declare surface variables in the base rule

Define component-scoped custom properties with fallback defaults:

```css
.component {
  background-color: var(--cmp-bg, var(--color-surface-raised));
  color: var(--cmp-fg, var(--color-text));
  border-color: var(--cmp-border, var(--color-border));
}
```

The naming convention is `--{short-name}-{property}`:
- `--btn-bg`, `--btn-fg`, `--btn-border`
- `--badge-bg`, `--badge-fg`
- `--alert-bg`, `--alert-fg`, `--alert-border`

### 3. Write interaction logic once

Hover, active, and focus rules reference the same variables.
Use `color-mix()` as the default derivation:

```css
&:hover:not([disabled]) {
  background-color: var(--cmp-bg-hover, color-mix(in oklch, var(--cmp-bg, ...) 85%, black));
}

&:active:not([disabled]) {
  background-color: var(--cmp-bg-active, color-mix(in oklch, var(--cmp-bg, ...) 75%, black));
}
```

Non-interactive components (badge, alert) skip this.

### 4. Variants are pure variable assignments

No property declarations. No nested hover rules.

```css
&.primary {
  --btn-bg: var(--color-primary);
  --btn-fg: var(--color-primary-fg);
  --btn-border: var(--color-primary);
}
```

### 5. Escape the pattern only when necessary

If a variant can't derive hover from `color-mix()` (e.g., ghost goes from
`transparent` to a subtle fill), set `--cmp-bg-hover` explicitly:

```css
&.ghost {
  --btn-bg: transparent;
  --btn-border: transparent;
  --btn-bg-hover: var(--color-neutral-subtle);
}
```

This is the exception, not the norm.

### 6. Sizes override padding and font directly

Don't use size variables. Override the primitive padding directly:

```css
&.small {
  padding-block: var(--space-xs);
  padding-inline: var(--space-md);
  border-radius: var(--radius-sm);
}
```

The size scale is: `xs`, `small`, (default), `large`, `xl`.
Not every component needs all 5. Define only what's useful.

### 7. Use semantic class names

- Variants: full words — `primary`, `danger`, `ghost`, `outline`
- Sizes: `xs`, `small`, `large`, `xl` (conversational abbreviations)
- Modifiers: `icon`, `removable`, `dismissible`

### 8. State changes ≠ variants

Variants are chosen by the developer: `<button class="primary">`.
States are reactions to user interaction: `:user-invalid`, `[disabled]`, `[readonly]`.

States use native CSS selectors and attribute selectors.
States do NOT use classes (no `.is-invalid`, `.is-disabled`).

### 9. Naming Custom Elements

If a native element doesn't exist for your component, use an unregistered custom element to build a semantic vocabulary.
Follow this strict naming law:

- **Structural Elements (Descriptive):** For containers that describe relationships between children, use plain descriptive names: `<form-field>`, `<input-group>`, `<tab-list>`.
- **Presentational Elements (`ui-*`):** For visual patterns that have no semantic document meaning (painted rectangles), explicitly mark them as UI polyfills: `<ui-badge>`, `<ui-alert>`, `<ui-skeleton>`.

### 10. One element, one file

Each component gets its own CSS file in `src/components/`.
The file targets the native element directly or a semantic class.
All rules must be inside `@layer components { }`.

### 11. Token hygiene

- Never hardcode colors — use `--color-*` tokens
- Never hardcode spacing — use `--space-*` tokens
- Never hardcode border width — use `--border-width`
- Never hardcode radii — use `--radius-*` tokens
- Derived colors use `color-mix(in oklch, ...)` rather than new tokens

---

## Component Template

```css
/*
 * Dashbase — [Component Name]
 *
 * [What it styles and how]
 * Primitives handle: [what the component inherits]
 *
 * Variants: [list]
 * Sizes: [list if applicable]
 */

@layer components {
  element-or-selector {
    /* ── Layout ── */
    display: ...;

    /* ── Surface (variant variables) ── */
    background-color: var(--cmp-bg, DEFAULT);
    color: var(--cmp-fg, DEFAULT);

    /* ── Interaction (if interactive) ── */
    &:hover:not([disabled]) { ... }
    &:active:not([disabled]) { ... }
    &:focus-visible { ... }
    &[disabled] { ... }

    /* ═══ Variants ═══ */
    &.variant-name {
      --cmp-bg: ...;
      --cmp-fg: ...;
    }

    /* ═══ Sizes ═══ */
    &.small { ... }
    &.large { ... }
  }
}
```

---

## Reference Implementation

See `src/components/button.css` — it follows all of the above rules.
