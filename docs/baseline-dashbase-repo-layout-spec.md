
# Baseline CSS + Dashbase — Repository Layout Specification
Version: 0.1

Purpose: Define the recommended repository structure separating the **Baseline CSS design system**
from the **Dashbase component library**.

This layout ensures a clean architectural boundary between:

- **Baseline** → tokens, primitives, foundational styling
- **Dashbase** → semantic components, patterns, and behaviors

The structure is intentionally simple so it can be implemented by agents with minimal tooling.

---

# 1. High-Level Architecture

```
baseline/
    ↓
dashbase/
    ↓
generators/
```

Baseline provides the **design vocabulary**.

Dashbase provides **semantic UI components**.

Generators produce **framework adapters**.

---

# 2. Recommended Repository Layout

```
/baseline
    /src
        reset.css
        tokens.css
        primitives.css
        base.css
    /themes
        dark.css
        high-contrast.css
    baseline.css
    README.md

/dashbase
    /src
        /components
            /button
                button.css
                button.contract.json
            /dialog
                dialog.css
                dialog.js
                dialog.contract.json
            /tabs
                tabs.css
                tabs.js
                tabs.contract.json
        /patterns
            ...
    README.md

/scripts
    /targets

/generated
    /react
    /svelte
    /vue
```

---

# 3. Baseline CSS Structure

Baseline is split into logical layers matching the cascade order.

```
reset → tokens → primitives → base
```

### Directory

```
baseline/src/
```

### Files

#### reset.css

Contains minimal cross-browser normalization.

Example:

```
*,
*::before,
*::after {
  box-sizing: border-box;
}
```

Avoid heavy opinionated resets.

---

#### tokens.css

Defines all design tokens.

Example categories:

```
color tokens
surface tokens
typography tokens
spacing tokens
radius tokens
shadow tokens
motion tokens
z-index tokens
control tokens
```

Tokens must follow naming conventions:

```
--color-*
--surface-*
--text-*
--space-*
--radius-*
--shadow-*
--duration-*
--easing-*
--z-*
--control-*
```

---

#### primitives.css

Defines reusable structural primitives.

Examples:

Control primitives:

```
:where(button, input, select, textarea) {
  padding-inline: var(--control-padding-inline);
  padding-block: var(--control-padding-block);
}
```

Layout primitives:

```
form-field {
  display: grid;
  gap: var(--space-2);
}
```

Surface primitives:

```
.surface-raised {
  background: var(--surface-raised);
  box-shadow: var(--shadow-md);
}
```

Typography primitives:

```
.text-body { font-size: var(--text-base); }
```

---

#### base.css

Contains minimal global element styling.

Example:

```
body {
  font-family: var(--font-sans);
  font-size: var(--text-base);
}
```

Base styles should remain conservative.

Avoid heavy opinionated styling.

---

#### baseline.css

The entry file that composes all layers.

Example:

```
@layer reset, tokens, primitives, base;

@import "./src/reset.css";
@import "./src/tokens.css";
@import "./src/primitives.css";
@import "./src/base.css";
```

This is the file consumers import.

---

# 4. Dashbase Structure

Dashbase sits on top of Baseline.

It implements the **components layer**.

```
tokens → primitives → base → components
```

### Directory

```
dashbase/components/
```

Each component has its own CSS file.

Example:

```
button.css
dialog.css
tabs.css
input.css
```

Components must:

- use Baseline tokens
- use primitives where possible
- avoid hardcoding values

---

# 5. Dashbase Patterns

Patterns are higher-level compositions of components.

Examples:

```
dashbase/patterns/
    dashboard.css
    auth.css
    settings.css
```

Patterns may combine multiple components.

---

# 6. Dashbase Behaviors

Progressive enhancement JavaScript.

Directory:

```
dashbase/behaviors/
```

Examples:

```
dialog.js
tabs.js
popover.js
```

Guidelines:

- small modules
- framework-agnostic
- minimal runtime logic

---

# 7. Component Contracts

Located in:

```
src/components/{component-name}/
```

Each component has a colocated component contract.

Example:

```
button/button.contract.json
dialog/dialog.contract.json
tabs/tabs.contract.json
```

The contract describes:

- props
- slots
- events
- variants

It does **not describe styling**.

---

# 8. Generators

Generators produce framework adapters.

Directory:

```
scripts/targets/
```

Example outputs:

```
@dashbase/react
@dashbase/svelte
@dashbase/vue
```

Generators must be deterministic.

---

# 9. Contract Inference Prompt

Instead of a build tool, contract inference may be implemented as a prompt.

Directory:

```
docs/ or prompts/
```

Example:

```
contract_inference.md
```

Workflow:

```
component source
    ↓
inference prompt
    ↓
candidate contract
    ↓
human review
    ↓
commit contract
```

---

# 10. File Size Expectations

Baseline should remain very small.

Expected sizes:

```
tokens.css      ~3–4 KB
primitives.css  ~2–3 KB
base.css        ~1 KB
```

Total Baseline:

```
<10 KB
```

Dashbase components will scale independently.

---

# 11. Guiding Principles

Baseline:

- stable
- minimal
- framework-agnostic

Dashbase:

- semantic
- composable
- opt-in components

---

# 12. Final Architecture

```
browser defaults
↓
baseline/reset
↓
baseline/tokens
↓
baseline/primitives
↓
baseline/base
↓
dashbase/components
↓
utilities
```

This architecture keeps the platform-first philosophy intact while supporting
modern component development.
