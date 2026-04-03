# Dashbase Pattern Authoring Prompt

Use this prompt as a starting point when drafting or reviewing Dashbase
patterns.

---

Design and implement a Dashbase pattern that follows the project architecture
exactly.

Requirements:

- Follow [dashbase-pattern-architecture.md](./dashbase-pattern-architecture.md)
- Prefer composing existing Dashbase components before introducing new structure
- Keep the authored pattern semantically honest and readable in plain HTML
- Treat patterns as reusable recipes, not as new primitive components
- Keep pattern-specific CSS minimal and scoped to the pattern folder
- Make dependency metadata explicit so the pattern can be indexed and tracked
- Prefer author-time composition through `<compose-fragment ... />` when copying
  a canonical component or pattern snippet would otherwise create drift

Output expectations:

1. Pattern source under `src/patterns/{category}/{family}/{variant}/`
2. A colocated `pattern.contract.json`
3. A native HTML source file, typically `pattern.html`
4. Optional pattern-local CSS or JS only when composition alone is not enough
5. Clear dependency metadata listing which Dashbase components and patterns are used
6. Short explanation of the pattern's purpose, scope, and intended use cases
7. A canonical `@fragment pattern` block in the source HTML for generators

Naming expectations:

- Never use numbered or vague variants like `LoginBox2`, `Alt`, or `Final`
- Use `category + family + variant`
- Use a human-readable `title` in the contract for docs and registries

Contract expectations:

- Keep the contract as pure data in `.json`
- Use `slug`, `family`, `variant`, `category`, `scope`, and `tags` for indexing
- Declare `dependencies.components` for every composed component
- Declare `dependencies.patterns` if this pattern composes other patterns
- Keep `dependencies.patterns` acyclic; use it only for build-time composition, not for loose "related pattern" cross-links
- Add a `props` block when generated adapters should expose ergonomic string inputs such as titles, helper text, placeholders, button labels, or other copy
- Add a `slots` block when generated adapters should expose richer content regions such as footer notes, banners, or supporting actions
- If `docs.examples` references source snippets, mark them with `<!-- @example name:start -->` and `<!-- @example name:end -->`
- Mark the canonical pattern body with `<!-- @fragment pattern:start -->` and `<!-- @fragment pattern:end -->`
- Mark reusable CSS or HTML fragments with `@fragment` markers, then reference
  them via `<compose-fragment source=\"path/to/file.html#fragment-id\" />`
- Additional attributes on `<compose-fragment>` act as author-time template
  values for `{{token}}` placeholders inside the referenced fragment
- Tokens such as `{{title}}` or `{{footerNote}}` should be declared by the pattern contract; use `props` for simple string substitutions and `slots` for richer content regions
- Give every declared `prop` a sensible default so validation, manifests, and generated adapter docs can resolve the canonical pattern without guessing

The goal is not just to make a pretty demo. The goal is to build a pattern
catalog that can scale, stay searchable, and remain useful to both humans and
agents.
