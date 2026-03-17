
# Dashbase Button Component — Refactoring Guidance
Version: 0.1

Purpose: Provide guidance for simplifying the Dashbase button component CSS by
removing repeated patterns and introducing a variable‑driven architecture.

This document summarizes recommendations after reviewing the current button.css
implementation.

---

# 1. Current Situation

The current implementation is already clean and readable. However, several
patterns repeat across variants and sizes.

Most duplication occurs in:

• variant blocks (primary, danger, outline)
• hover/active rules
• size padding declarations

Example pattern:

.primary {
  background-color: var(--color-primary);
  color: var(--color-primary-fg);
  border-color: var(--color-primary);

  &:hover:not([disabled]) {
    background-color: var(--color-primary-hover);
  }

  &:active:not([disabled]) {
    background-color: var(--color-primary-active);
  }
}

The same structure appears in multiple variants.
The only difference is token values.

---

# 2. Core Idea: Move Differences Into Variables

Instead of repeating the same CSS rules for every variant, define component
variables once and let variants assign those variables.

Example variables:

--btn-bg
--btn-fg
--btn-border
--btn-bg-hover
--btn-bg-active
--btn-px
--btn-py

This makes the base component responsible for layout and interaction logic,
while variants simply configure values.

---

# 3. Base Button Rule

The base rule defines layout and interaction behavior once.

Example:

button,
[role="button"] {

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);

  font-weight: 500;
  line-height: var(--leading-tight);
  text-decoration: none;
  white-space: nowrap;

  cursor: pointer;

  background: var(--btn-bg, transparent);
  color: var(--btn-fg, inherit);
  border-color: var(--btn-border, transparent);

  padding-inline: var(--btn-px, var(--space-md));
  padding-block: var(--btn-py, var(--space-xs));
}

---

# 4. Shared Interaction Rules

Hover and active behavior should exist once.

button:hover:not(:disabled) {
  background: var(--btn-bg-hover, var(--btn-bg));
}

button:active:not(:disabled) {
  background: var(--btn-bg-active, var(--btn-bg-hover));
}

This removes duplicated hover rules in every variant.

---

# 5. Variant Definitions

Variants should only set variables.

Example: Primary

.primary {
  --btn-bg: var(--color-primary);
  --btn-fg: var(--color-primary-fg);
  --btn-border: var(--color-primary);

  --btn-bg-hover: var(--color-primary-hover);
  --btn-bg-active: var(--color-primary-active);
}

Example: Danger

.danger {
  --btn-bg: var(--color-danger);
  --btn-fg: var(--color-danger-fg);
  --btn-border: var(--color-danger);

  --btn-bg-hover: var(--color-danger-hover);
  --btn-bg-active: var(--color-danger-active);
}

Example: Ghost

.ghost {
  --btn-bg: transparent;
  --btn-border: transparent;

  --btn-bg-hover: var(--color-neutral-subtle);
  --btn-bg-active:
    color-mix(in oklch, var(--color-neutral-subtle) 80%, var(--color-neutral));
}

---

# 6. Size Variants

Sizes should modify variables instead of redefining padding rules.

.xs {
  --btn-px: var(--space-sm);
  --btn-py: var(--space-xs);
  font-size: var(--text-xs);
  border-radius: var(--radius-sm);
}

.small {
  --btn-px: var(--space-md);
  --btn-py: var(--space-xs);
}

.large {
  --btn-px: var(--space-xl);
  --btn-py: var(--space-md);
  font-size: var(--text-base);
}

.xl {
  --btn-px: var(--space-xl);
  --btn-py: var(--space-lg);
  font-size: var(--text-lg);
}

---

# 7. Icon Button

The icon button should reuse the same padding variables.

.icon {
  aspect-ratio: 1;
  --btn-px: var(--space-sm);
  --btn-py: var(--space-sm);
}

---

# 8. SVG Sizing

Shared icon sizing rules should exist once.

button svg,
button img {
  width: 1em;
  height: 1em;
  flex-shrink: 0;
}

---

# 9. Benefits of This Architecture

Advantages:

• eliminates repeated hover/active rules
• variants become extremely small
• easier to add new variants
• smaller CSS footprint
• clearer separation between structure and configuration

Typical reduction:

~40–60% less CSS for component variants.

---

# 10. Long-Term Impact

As Dashbase grows to dozens of components, this pattern ensures:

• consistent interaction logic
• predictable variant design
• minimal component files
• easier theming

Components focus on structure, while tokens and variables provide visual configuration.
