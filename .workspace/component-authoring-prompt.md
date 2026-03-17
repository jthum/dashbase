# Dashbase — Component Authoring Prompt

You are building a new CSS component for Dashbase, a semantic-first CSS component library.

## Before writing any code, read these files in order:

### 1. Philosophy & Principles
Read `.workspace/dashbase-implementation-guidance.md`
- Core principles: HTML as stable interface, CSS as source of truth, minimal JS
- Modern CSS features we use: oklch, color-mix, light-dark, :has(), :user-invalid, field-sizing, CSS nesting, @layer

### 2. Architecture
Read `.workspace/baseline-dashbase-architecture-guidance.md`
- Layer stack: reset → tokens → primitives → base → components → utilities
- Baseline CSS (tokens + primitives) vs Dashbase (components) boundary
- Token organization and naming prefixes

### 3. Component Authoring Rules
Read `.workspace/component-authoring-guide.md`
- The 10 rules for writing component CSS
- Variable-driven variant pattern
- Component template
- Naming conventions (full words for variants, t-shirt sizes)

### 4. Token Reference (keep open while coding)
Read `.workspace/baseline-css-specification.md`
- Available tokens: colors, spacing, radius, shadows, motion, z-index
- Control tokens: --control-padding-inline, --control-padding-block, etc.
- Spacing uses --space-unit multiplier with t-shirt names (xs through 4xl)

### 5. File Layout (skim)
Read `.workspace/baseline-dashbase-repo-layout-spec.md`
- Where files go: `src/baseline/` for foundation, `src/components/` for components
- Example pages go in `src/examples/`

## Reference implementation
Read `src/components/button.css` — this is the canonical example of the pattern.

## After reading, you should understand:
- Primitives handle shared control geometry — don't redeclare padding/border/radius/transition
- Components use `--component-*` variables for surfaces, variants reassign them
- Interaction logic (hover/active) is written once with color-mix() fallbacks
- States use native CSS selectors, not classes
- All component CSS goes inside `@layer components { }`
- Build with `bun run build`, verify baseline stays under 8KB and no single component exceeds 4KB
- The goal is full Shadcn component parity — the bundle will grow with components and that's fine

## Do NOT read (not relevant for component work):
- `dashbase-prd.md` — high-level product vision, not actionable
- `dashbase-dsl-architecture.md` — deferred, not relevant yet
- `dashbase-button-refactor-guidance.md` — historical, already captured in authoring guide
