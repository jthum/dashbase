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
- Make the component contract explicit enough that a future generator could build framework adapters from it

Output expectations:

1. Component CSS in the component's own folder under `src/components/{component-name}/`
2. Optional behavior shim in that same component folder only if the platform has a real behavior gap
3. A colocated `src/components/{component-name}/{component-name}.contract.json` file for adapter generation
4. Example page in that same component folder if it is component-owned, or in `src/examples/` if it is a cross-component demo
5. README snippet only if the component is part of the public front-door story
6. Short explanation of semantics, state model, and why the chosen primitive is correct
7. Identify the adapter-facing contract:
   - root element
   - anatomy elements
   - variant/modifier surface
   - ARIA/state expectations
   - emitted events
   - whether future framework adapters would be thin wrappers or controller-backed

Contract expectations:

- Keep contracts as pure data in `.contract.json`, never executable code
- Colocate the contract with the component's CSS, shim, and example page
- Use relative `files.*` paths for source assets and `dist/...` paths for generated imports
- Include enough anatomy, variant, and state detail that a shim-backed generator can build a working adapter without guessing
- Add a small `docs` block when the component has adapter-facing usage docs or generated examples
- If `docs.examples` references source snippets, mark those snippets in the HTML with `<!-- @example name:start -->` and `<!-- @example name:end -->`
- Keep those marked snippets honest to the component contract; do not rely on undeclared companion components unless the contract explicitly models that dependency

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
