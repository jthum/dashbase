
# Baseline CSS — Specification
Version: 0.1

Purpose: Define the design token vocabulary, primitive layers, and authoring rules for Baseline CSS.

Baseline CSS is a **platform-native design system foundation** intended to support Dashbase and other
component libraries while remaining framework-agnostic and dependency-free.

---

# 1. Philosophy

Baseline CSS follows the original architecture of the web platform:

HTML → Structure  
CSS → Presentation  
JS → Behavior

Baseline focuses purely on **presentation primitives**.

It provides:

- design tokens
- layout primitives
- control primitives
- surface primitives
- typography primitives
- minimal base element styles

Baseline does **not include UI components**.

---

# 2. Architectural Layers

Recommended cascade layer order:

```
reset
tokens
primitives
base
components
utilities
```

Baseline CSS implements:

```
reset
tokens
primitives
base
```

Component systems (e.g., Dashbase) implement:

```
components
```

Consumers may add:

```
utilities
```

Example:

```css
@layer reset, tokens, primitives, base, components, utilities;
```

---

# 3. Design Token Categories

Baseline tokens must follow consistent prefixes.

| Category | Prefix |
|--------|--------|
Color | `--color-*` |
Surface | `--surface-*` |
Typography scale | `--text-*` |
Spacing | `--space-*` |
Radius | `--radius-*` |
Shadow | `--shadow-*` |
Motion | `--duration-*`, `--easing-*` |
Z-index | `--z-*` |
Control tokens | `--control-*` |

---

# 4. Core Color Tokens

Baseline defines semantic colors rather than palette colors.

Example:

```css
--color-primary
--color-primary-fg

--color-neutral
--color-neutral-fg

--color-danger
--color-danger-fg

--color-border
```

States should be derived using `color-mix()` rather than separate tokens.

Example:

```css
color-mix(in oklch, var(--color-primary) 85%, black)
```

---

# 5. Surface Tokens

Surface tokens represent UI elevation layers.

Example:

```css
--surface-base
--surface-raised
--surface-overlay
```

Typical usage:

| Surface | Example |
|------|------|
base | page background |
raised | cards |
overlay | popovers, modals |

---

# 6. Typography Tokens

Typography tokens define a type scale.

Example:

```css
--font-sans
--font-mono

--text-xs
--text-sm
--text-base
--text-lg
--text-xl
--leading-tight
--leading-normal
--tracking-tight
--tracking-wide
```

Fluid sizing using `clamp()` is recommended.

Example:

```css
--text-base: clamp(0.875rem, 2vw, 1rem);
```

---

# 7. Spacing Scale

Spacing follows a 4px grid.

Example:

```css
--space-1: 0.25rem
--space-2: 0.5rem
--space-3: 0.75rem
--space-4: 1rem
--space-6: 1.5rem
--space-8: 2rem
```

Spacing tokens should power:

- margin
- padding
- gaps
- layout spacing

---

# 8. Radius Tokens

Border radius scale:

```css
--radius-sm
--radius-md
--radius-lg
--radius-xl
--radius-full
```

---

# 9. Shadow Tokens

Elevation scale:

```css
--shadow-xs
--shadow-sm
--shadow-md
--shadow-lg
```

---

# 10. Motion Tokens

Animation durations:

```css
--duration-fast
--duration-base
--duration-slow
```

Easing tokens:

```css
--easing-default
--easing-emphasized
```

---

# 11. Z-index Tokens

Layering tokens prevent magic numbers.

Example:

```css
--z-dropdown
--z-sticky
--z-overlay
--z-modal
--z-toast
```

---

# 12. Control Tokens

Control tokens define geometry for interactive elements.

Example:

```css
--control-padding-inline
--control-padding-block
--control-radius
--control-height
--border-control
```

These apply to:

- button
- input
- select
- textarea

---

# 13. Primitive Layer

Baseline introduces a primitive layer between tokens and components.

Architecture:

```
tokens → primitives → components
```

---

# 14. Control Primitives

Example primitive rule:

```css
:where(button, input, select, textarea) {
  padding-inline: var(--control-padding-inline);
  padding-block: var(--control-padding-block);
  border-radius: var(--control-radius);
}
```

Components override only what is unique.

---

# 15. Layout Primitives

Structural containers:

Example:

```css
form-field {
  display: grid;
  gap: var(--space-2);
}

input-group {
  display: grid;
  grid-auto-flow: column;
  gap: var(--space-1);
}
```

---

# 16. Surface Primitives

Shared UI surfaces:

Example:

```css
.surface-raised {
  background: var(--surface-raised);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}
```

---

# 17. Typography Primitives

Semantic text roles:

Example:

```css
.text-body { font-size: var(--text-base); }
.text-label { font-size: var(--text-sm); }
.text-heading { font-size: var(--text-xl); }
```

---

# 18. Base Layer

The base layer should provide minimal global styles.

Example:

```css
body {
  font-family: var(--font-sans);
  font-size: var(--text-base);
}
```

Avoid aggressive resets or heavy opinionated styling.

---

# 19. Theming

Themes should override tokens only.

Example:

```css
:root[data-theme="dark"] {
  --color-surface: oklch(18% 0.02 260);
}
```

Components automatically adapt because they reference tokens.

---

# 20. Authoring Rules

Baseline CSS rules:

1. Tokens must represent meaning, not palette values.
2. Components must never hardcode color or spacing values.
3. State colors should be derived via `color-mix()`.
4. Primitives must remain framework-agnostic.
5. Baseline must remain dependency-free.

---

# 21. Relationship to Dashbase

Baseline CSS = design system foundation.

Dashbase = semantic component layer built on top.

Architecture:

```
Baseline CSS
   ↓
Dashbase components
   ↓
contracts + framework adapters
```
