# Dashbase Component Authoring Prompt

Use this prompt as a starting point when drafting or reviewing new Dashbase components.

---

Design and implement a Dashbase component that follows the project architecture exactly.

Requirements:

- Follow [component-authoring-guide.md](./component-authoring-guide.md)
- Follow [dashbase-implementation-guidance.md](./dashbase-implementation-guidance.md)
- Follow [dashbase-overlay-architecture.md](./dashbase-overlay-architecture.md) for any overlay, popover, menu, dialog, drawer, or sheet-like surface
- Prefer native elements first
- Use named custom elements only when there is no native semantic equivalent
- Use classes for variants and modifiers on both semantic and custom elements
- Use native and ARIA attributes for state, never `.is-*` state classes
- Use design tokens and existing component variables, never hardcoded colors or spacing
- Keep variants as variable reassignment only unless escaping the pattern is truly necessary
- Keep JavaScript tiny and behavior-focused; never recreate platform behavior without a strong reason

Output expectations:

1. Component CSS in one file under `src/components/`
2. Optional behavior shim under `src/behaviors/` only if the platform has a real behavior gap
3. Example page under `src/examples/`
4. README snippet only if the component is part of the public front-door story
5. Short explanation of semantics, state model, and why the chosen primitive is correct

Overlay-specific rules:

- Use `<dialog>` for true dialog semantics
- Use `<popover-panel popover>` for non-dialog anchored surfaces
- Use `<popover-panel popover role="menu">` for menus
- Reuse `panel-header`, `panel-content`, and `panel-footer` anatomy where appropriate
- If a trigger exposes `aria-expanded`, it must be synced from real state
- Do not introduce a separate overlay implementation if an existing platform primitive already fits

Decision rubric before introducing a new custom element:

1. What semantic role does it serve?
2. Is there a native HTML element that already fits?
3. Is it structural, presentational, or interactive?
4. Does it need a distinct accessible contract?

If a native element fits, use it.
If no native element fits and the structure deserves a name, use a descriptive custom element.

The goal is not just working code. The goal is to strengthen Dashbase’s semantic vocabulary while keeping the browser as the primary runtime.
