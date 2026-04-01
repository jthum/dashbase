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

State hooks follow this priority order:

1. Native selectors first: `:checked`, `[disabled]`, `[open]`, `:user-invalid`, `:focus-visible`
2. ARIA attributes second when HTML has no native equivalent: `[aria-expanded="true"]`, `[aria-selected="true"]`, `[aria-pressed="true"]`, `[aria-current]`
3. `data-*` attributes only as a last resort for implementation details that have no semantic platform hook

If a component looks open, selected, or pressed, it should report that state semantically as well.
States do NOT use classes (no `.is-invalid`, `.is-disabled`).

### 9. Naming Custom Elements

If a native element doesn't exist for your component, use an unregistered custom element to build a semantic vocabulary.

Before introducing a new custom element into the vocabulary, it must pass this **Definition Boundary Rubric**:
1. What is its semantic role?
2. What ARIA treatment does it need?
3. Is it interactive or static?
4. What content does it accept?

If a proposed element has distinct answers to these four questions, it earns its own name. If not, it is merely a variant class of an existing element.

If it passes the rubric, follow this strict naming law:

- **Structural Elements (Descriptive):** For containers that describe relationships between children, use plain descriptive names: `<form-field>`, `<input-group>`, `<tab-list>`.
- **Presentational Elements (`ui-*`):** For visual patterns that have no semantic document meaning (painted rectangles), explicitly mark them as UI polyfills: `<ui-badge>` (numerical counts), `<ui-status>` (live state labels), `<ui-tag>` (taxonomy categories).

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

### 12. Inline custom properties are the official escape hatch

When a product team needs a one-off adjustment, prefer component-scoped custom properties over new variants, global overrides, or `!important`.

```html
<button class="primary" style="--btn-bg: var(--color-danger)">
  Delete
</button>
```

This keeps the override local, legible, and aligned with the variable-driven architecture.

### 13. Use `@scope` sparingly

Dashbase respects the cascade. Prefer semantic wrappers, direct-child selectors, and explicit structure first.

Use `@scope` only when a composite component needs to style generic descendants while stopping at nested component boundaries.
Good candidates are future content-bearing composites like cards, dialogs, tabs, menus, or accordions.

Do not use `@scope` as a default replacement for normal component selectors, and do not put it in Baseline.

### 14. Use one overlay model

Overlay-like components must follow the shared architecture:

- `<dialog>` for dialog semantics
- `<popover-panel popover>` for non-dialog anchored surfaces
- `<popover-panel popover role="menu">` for action menus

Do not create parallel dropdown, popover, and menu implementations that each solve anchoring differently.

If the trigger exposes `aria-expanded`, it must be synced from actual open/close state.

Prefer shared surface anatomy where needed:

- `<panel-header>`
- `<panel-content>`
- `<panel-footer>`

See `docs/dashbase-overlay-architecture.md` for the full model.

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
