# Dashbase — Color System Specification

> Companion document to `dashbase-prd.md`, `dashbase-dsl-architecture.md`, and `dashbase-implementation-guidance.md`

---

## Philosophy

Dashbase's color system has three governing principles:

1. **One required input.** A user defines `--color-primary`. Everything else derives from it automatically.
2. **No numeric scales.** There is no `--color-primary-500`. Tokens are named by semantic intent, not position on a scale. Numeric scales exist for static systems that define colors manually — Dashbase derives colors dynamically and doesn't need them.
3. **Generative, not declarative.** Tokens are live CSS expressions using relative color syntax and `color-mix()`. Change one base variable and the entire system responds at runtime — no build step, no preprocessor, no static snapshots.

---

## Technology

The color system is built on three modern CSS features with broad baseline coverage:

### oklch()

oklch is a perceptually uniform color space. Equal numeric steps in lightness produce equal *perceived* steps in brightness — unlike hex, RGB, or HSL where the same numeric delta looks different at different hues. This means algorithmically derived palettes look intentional rather than accidental.

```css
--color-primary: oklch(55% 0.2 250);
/*                      L    C   H   */
/*               lightness chroma hue */
```

- `L` — 0% (black) to 100% (white)
- `C` — 0 (gray) to ~0.4 (maximum saturation, varies by hue)
- `H` — 0–360 (hue angle)

### Relative Color Syntax

Derives new colors from existing ones, inheriting channels selectively:

```css
/* Inherit hue from --color-primary, override lightness and chroma */
oklch(from var(--color-primary) 95% 0.04 h)
```

The `h` keyword means "use the hue from the origin color." This is what makes the entire palette generative — hue is always inherited, only lightness and chroma are adjusted per semantic role.

### color-mix()

Derives interaction states (hover, active) by blending toward black or white:

```css
color-mix(in oklch, var(--color-primary) 88%, black)
```

---

## Required User Input

```css
:root {
  --color-primary: oklch(55% 0.2 250);
}
```

This is the only variable a user must define. A complete, harmonious color system derives from it automatically.

---

## Derived Color Roles

### Secondary and Neutral

```css
:root {
  /* Secondary — 60° hue rotation, analogous harmony */
  --color-secondary: oklch(from var(--color-primary) l c calc(h + 60));

  /* Neutral — same hue as primary, near-zero chroma */
  /* Results in grays that are subtly warm or cool, harmonising with primary */
  --color-neutral: oklch(from var(--color-primary) l 0.02 h);
}
```

Both are automatically harmonious with `--color-primary`. Both can be overridden:

```css
:root {
  --color-primary:   oklch(55% 0.2 250);
  --color-secondary: oklch(55% 0.2 320);  /* explicit override */
  --color-neutral:   oklch(55% 0.00 0);   /* pure gray override */
}
```

### Semantic Role Colors

These are fixed defaults, not derived from primary. They represent universal meaning (danger = red, success = green) that should not shift with the primary hue. Users can override them.

```css
:root {
  --color-danger:  oklch(55% 0.22 25);
  --color-success: oklch(55% 0.18 145);
  --color-warning: oklch(72% 0.18 80);
  --color-info:    oklch(55% 0.18 220);
}
```

---

## Semantic Token Vocabulary

Every color role exposes five semantic tokens. Components consume these tokens — never the base variables directly.

| Token suffix | Purpose | Example usage |
|---|---|---|
| `-subtle` | Background fills, tinted surfaces | Alert background, badge fill |
| `-muted` | Borders, dividers, secondary fills | Input border, card border |
| `-default` | The base color | Button background |
| `-emphasis` | Strong text or borders on light surface | Heading in an alert, strong border |
| `-fg` | Text or icons placed on top of `-default` | Button label, icon inside filled badge |

### Primary Tokens

```css
:root {
  --color-primary-subtle:   oklch(from var(--color-primary) 95% 0.04 h);
  --color-primary-muted:    oklch(from var(--color-primary) 85% 0.08 h);
  --color-primary-default:  var(--color-primary);
  --color-primary-emphasis: oklch(from var(--color-primary) 35% 0.18 h);
  --color-primary-fg:       oklch(from var(--color-primary) 98% 0.01 h);

  /* Interaction states */
  --color-primary-hover:    color-mix(in oklch, var(--color-primary) 88%, black);
  --color-primary-active:   color-mix(in oklch, var(--color-primary) 75%, black);
}
```

### Secondary Tokens

```css
:root {
  --color-secondary-subtle:   oklch(from var(--color-secondary) 95% 0.04 h);
  --color-secondary-muted:    oklch(from var(--color-secondary) 85% 0.08 h);
  --color-secondary-default:  var(--color-secondary);
  --color-secondary-emphasis: oklch(from var(--color-secondary) 35% 0.18 h);
  --color-secondary-fg:       oklch(from var(--color-secondary) 98% 0.01 h);

  --color-secondary-hover:    color-mix(in oklch, var(--color-secondary) 88%, black);
  --color-secondary-active:   color-mix(in oklch, var(--color-secondary) 75%, black);
}
```

### Neutral Tokens (Surface & Border)

```css
:root {
  --color-surface:        oklch(from var(--color-neutral) 98% 0.01 h);
  --color-surface-raised: oklch(from var(--color-neutral) 96% 0.01 h);
  --color-border:         oklch(from var(--color-neutral) 85% 0.02 h);
  --color-border-strong:  oklch(from var(--color-neutral) 70% 0.02 h);
  --color-text:           oklch(from var(--color-neutral) 15% 0.02 h);
  --color-text-muted:     oklch(from var(--color-neutral) 45% 0.02 h);
}
```

### Semantic Role Tokens (Danger, Success, Warning, Info)

Same five-token pattern for each role:

```css
:root {
  /* Danger */
  --color-danger-subtle:   oklch(from var(--color-danger) 95% 0.05 h);
  --color-danger-muted:    oklch(from var(--color-danger) 85% 0.10 h);
  --color-danger-default:  var(--color-danger);
  --color-danger-emphasis: oklch(from var(--color-danger) 35% 0.20 h);
  --color-danger-fg:       oklch(from var(--color-danger) 98% 0.01 h);
  --color-danger-hover:    color-mix(in oklch, var(--color-danger) 88%, black);
  --color-danger-active:   color-mix(in oklch, var(--color-danger) 75%, black);

  /* Success */
  --color-success-subtle:   oklch(from var(--color-success) 95% 0.04 h);
  --color-success-muted:    oklch(from var(--color-success) 85% 0.09 h);
  --color-success-default:  var(--color-success);
  --color-success-emphasis: oklch(from var(--color-success) 35% 0.17 h);
  --color-success-fg:       oklch(from var(--color-success) 98% 0.01 h);
  --color-success-hover:    color-mix(in oklch, var(--color-success) 88%, black);
  --color-success-active:   color-mix(in oklch, var(--color-success) 75%, black);

  /* Warning */
  --color-warning-subtle:   oklch(from var(--color-warning) 95% 0.05 h);
  --color-warning-muted:    oklch(from var(--color-warning) 85% 0.10 h);
  --color-warning-default:  var(--color-warning);
  --color-warning-emphasis: oklch(from var(--color-warning) 30% 0.18 h);
  --color-warning-fg:       oklch(from var(--color-warning) 15% 0.05 h);
  --color-warning-hover:    color-mix(in oklch, var(--color-warning) 88%, black);
  --color-warning-active:   color-mix(in oklch, var(--color-warning) 75%, black);

  /* Info */
  --color-info-subtle:   oklch(from var(--color-info) 95% 0.04 h);
  --color-info-muted:    oklch(from var(--color-info) 85% 0.09 h);
  --color-info-default:  var(--color-info);
  --color-info-emphasis: oklch(from var(--color-info) 35% 0.17 h);
  --color-info-fg:       oklch(from var(--color-info) 98% 0.01 h);
  --color-info-hover:    color-mix(in oklch, var(--color-info) 88%, black);
  --color-info-active:   color-mix(in oklch, var(--color-info) 75%, black);
}
```

> **Note on `--color-warning-fg`:** Warning backgrounds are inherently light (high lightness). `--color-warning-fg` uses dark text rather than near-white to maintain contrast. This is the one intentional deviation from the pattern — perceptual correctness takes precedence over mechanical consistency.

---

## Dark Mode

Dark mode redefines only the semantic mappings — not the base colors. The derivation logic remains identical; only which end of the lightness axis is "subtle" and which is "emphasis" inverts.

```css
@media (prefers-color-scheme: dark) {
  :root {
    /* Slightly lighter base in dark mode for better contrast headroom */
    --color-primary: oklch(65% 0.2 250);

    /* Invert the semantic direction */
    --color-primary-subtle:   oklch(from var(--color-primary) 15% 0.04 h);
    --color-primary-muted:    oklch(from var(--color-primary) 25% 0.08 h);
    --color-primary-default:  var(--color-primary);
    --color-primary-emphasis: oklch(from var(--color-primary) 85% 0.12 h);
    --color-primary-fg:       oklch(from var(--color-primary) 10% 0.02 h);
    --color-primary-hover:    color-mix(in oklch, var(--color-primary) 88%, white);
    --color-primary-active:   color-mix(in oklch, var(--color-primary) 75%, white);

    /* Surface and border invert */
    --color-surface:        oklch(from var(--color-neutral) 12% 0.01 h);
    --color-surface-raised: oklch(from var(--color-neutral) 18% 0.01 h);
    --color-border:         oklch(from var(--color-neutral) 28% 0.02 h);
    --color-border-strong:  oklch(from var(--color-neutral) 40% 0.02 h);
    --color-text:           oklch(from var(--color-neutral) 92% 0.01 h);
    --color-text-muted:     oklch(from var(--color-neutral) 65% 0.02 h);

    /* Semantic roles — same inversion pattern */
    --color-danger-subtle:   oklch(from var(--color-danger) 15% 0.06 h);
    --color-danger-muted:    oklch(from var(--color-danger) 25% 0.12 h);
    --color-danger-emphasis: oklch(from var(--color-danger) 85% 0.14 h);
    --color-danger-hover:    color-mix(in oklch, var(--color-danger) 88%, white);
    --color-danger-active:   color-mix(in oklch, var(--color-danger) 75%, white);

    --color-success-subtle:   oklch(from var(--color-success) 15% 0.05 h);
    --color-success-muted:    oklch(from var(--color-success) 25% 0.10 h);
    --color-success-emphasis: oklch(from var(--color-success) 85% 0.12 h);
    --color-success-hover:    color-mix(in oklch, var(--color-success) 88%, white);
    --color-success-active:   color-mix(in oklch, var(--color-success) 75%, white);

    --color-warning-subtle:   oklch(from var(--color-warning) 15% 0.06 h);
    --color-warning-muted:    oklch(from var(--color-warning) 25% 0.11 h);
    --color-warning-emphasis: oklch(from var(--color-warning) 85% 0.15 h);
    --color-warning-fg:       oklch(from var(--color-warning) 92% 0.05 h);
    --color-warning-hover:    color-mix(in oklch, var(--color-warning) 88%, white);
    --color-warning-active:   color-mix(in oklch, var(--color-warning) 75%, white);

    --color-info-subtle:   oklch(from var(--color-info) 15% 0.05 h);
    --color-info-muted:    oklch(from var(--color-info) 25% 0.10 h);
    --color-info-emphasis: oklch(from var(--color-info) 85% 0.12 h);
    --color-info-hover:    color-mix(in oklch, var(--color-info) 88%, white);
    --color-info-active:   color-mix(in oklch, var(--color-info) 75%, white);

    color-scheme: dark;
  }
}

/* Manual dark mode toggle */
[data-theme="dark"] {
  /* Mirror @media (prefers-color-scheme: dark) redefinitions */
  color-scheme: dark;
}

[data-theme="light"] {
  color-scheme: light;
}
```

---

## Component Usage Pattern

Components consume semantic tokens only. Base variables never appear in component CSS.

```css
/* button.css */
button {
  background-color: var(--color-neutral-default, ButtonFace);
  color:            var(--color-text, ButtonText);

  &:hover:not([disabled]) {
    background-color: var(--color-primary-hover);
  }

  &.primary {
    background-color: var(--color-primary-default);
    color:            var(--color-primary-fg);

    &:hover:not([disabled]) {
      background-color: var(--color-primary-hover);
    }
  }

  &.danger {
    background-color: var(--color-danger-default);
    color:            var(--color-danger-fg);

    &:hover:not([disabled]) {
      background-color: var(--color-danger-hover);
    }
  }
}

/* alert.css */
ui-alert {
  background-color: var(--color-info-subtle);
  color:            var(--color-info-emphasis);
  border-color:     var(--color-info-muted);

  &[type="danger"] {
    background-color: var(--color-danger-subtle);
    color:            var(--color-danger-emphasis);
    border-color:     var(--color-danger-muted);
  }

  &[type="success"] {
    background-color: var(--color-success-subtle);
    color:            var(--color-success-emphasis);
    border-color:     var(--color-success-muted);
  }

  &[type="warning"] {
    background-color: var(--color-warning-subtle);
    color:            var(--color-warning-emphasis);
    border-color:     var(--color-warning-muted);
  }
}
```

---

## Theming Levels

| Level | What user defines | Result |
|---|---|---|
| **None** | Nothing | Pure browser defaults, no color opinions |
| **Minimal** | `--color-primary` only | Full harmonious palette auto-derived |
| **Custom secondary** | `--color-primary` + `--color-secondary` | Two-color system, neutral still derived |
| **Full override** | Any subset of semantic tokens | Precise control over specific roles |

The system is additive — users only define what they want to change.

---

## What NOT to Do

- **Do not define numeric scale tokens** (`--color-primary-500`). They are not needed and add bloat.
- **Do not define separate hover/active tokens manually**. Use `color-mix()` — it derives them automatically.
- **Do not use base role variables in components directly** (`var(--color-danger)`). Always use semantic tokens (`var(--color-danger-default)`). This ensures dark mode remapping works correctly.
- **Do not define colors in hex or RGB**. Use oklch throughout for perceptual consistency and relative color syntax compatibility.

---

## Comparison with shadcn

| | shadcn | Dashbase |
|---|---|---|
| Color space | HSL / hex | oklch |
| Palette definition | ~40 manually defined variables per theme | 1 required variable, rest derived |
| Hover/active states | Manually defined per token | Derived via `color-mix()` |
| Dark mode | Separate variable set, manually maintained | Semantic remapping of same derived tokens |
| Runtime theming | Requires redefining all variables | Change `--color-primary`, everything updates |
| Perceptual uniformity | No — HSL steps are uneven | Yes — oklch steps are perceptually consistent |

---

*Read alongside `dashbase-prd.md` for full context. This document supersedes any color-related sections in the PRD.*
