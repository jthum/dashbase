# Dashbase Pattern Architecture

Patterns are reusable compositions of Dashbase components authored in native
HTML.

They cover everything from small field-level assemblies to whole application
shells:

- `Form Field`
- `Login Box`
- `Dashboard Shell`

Dashbase does not need a separate `template` concept. Larger templates are just
patterns with richer metadata.

---

## Core Position

Patterns are:

- composed from existing Dashbase components and semantic HTML
- authored as source-level building blocks
- indexed and searchable through metadata
- eventually consumable through registries and generators

Patterns are not new low-level primitives. They sit above components.

---

## Naming

Pattern naming must scale to hundreds or thousands of entries, so names like
`LoginBox2`, `LoginBoxAlt`, or `DashboardFinal` are not acceptable.

Use three layers instead:

- `category`: broad catalog area such as `auth`, `forms`, `marketing`, `app`
- `family`: the conceptual pattern family such as `login-box` or `dashboard-shell`
- `variant`: the specific flavor such as `minimal`, `split`, `marketing`, `default`

Recommended source layout:

```text
src/patterns/{category}/{family}/{variant}/
```

Examples:

- `src/patterns/auth/login-box/minimal/`
- `src/patterns/auth/login-box/split/`
- `src/patterns/app/dashboard-shell/default/`

Recommended contract metadata:

- `slug`: `auth/login-box/minimal`
- `family`: `login-box`
- `variant`: `minimal`
- `title`: `Login Box / Minimal`

This gives us:

- stable machine ids
- readable human titles
- predictable grouping in docs, registries, and agent tooling

---

## Source Model

Patterns should be authored in native HTML, but they do not have to remain
copy-pasted forever.

The long-term model is:

- authored pattern source may reference components or other patterns at author time
- the build can expand those references into final plain HTML
- shipped or generated output still remains plain HTML

That means composition can stay ergonomic without giving up Dashbase's
HTML-first philosophy.

For the first implementation pass, author-time composition uses
`<compose-fragment ... />` references plus named source markers.

Example:

```html
<compose-fragment
  source="../../../../components/button/button.fragments.html#action-button"
  tone="primary"
  type="button"
  label="Create report"
/>
```

Reusable source fragments should be marked with either HTML or CSS markers:

```html
<!-- @fragment pattern:start -->
...
<!-- @fragment pattern:end -->
```

```css
/* @fragment panel-styles:start */
...
/* @fragment panel-styles:end */
```

Every pattern should expose a canonical `pattern` fragment so generators can
target the actual composition rather than the surrounding demo document.

---

## Drift Risk

If a pattern is written as fully expanded HTML, then it becomes a snapshot of
the component anatomy at the moment it was copied.

If a component changes later, the pattern may become stale.

Dashbase should mitigate that in two ways:

1. dependency metadata
   - every pattern contract declares the components and patterns it depends on
2. author-time composition references
   - over time, patterns should be able to reference canonical component or
     pattern snippets instead of duplicating every structure by hand

In the short term, dependency metadata is mandatory even if the pattern source
is still expanded HTML.

---

## Contract Shape

Pattern contracts should stay small and index-friendly.

They should capture:

- identity: `name`, `title`, `slug`, `family`, `variant`
- classification: `category`, `scope`, `tags`
- summary
- source files
- dependency metadata
- small docs/example metadata
- canonical `pattern` fragment markers in the source HTML

Example shape:

```ts
type PatternContract = {
  schemaVersion: number;
  name: string;
  title: string;
  slug: string;
  category: string;
  family: string;
  variant: string;
  scope: "field" | "section" | "page";
  summary: string;
  tags: string[];
  files: {
    html: string;
    css?: string;
    js?: string;
  };
  dependencies: {
    components: string[];
    patterns?: string[];
  };
  docs?: {
    examples?: Array<{
      id: string;
      title: string;
      source: string;
    }>;
  };
};
```

This is not a runtime DSL. It is search, generation, and registry metadata.

---

## Registry Direction

Patterns should be indexed into a generated manifest so Dashbase can later:

- power documentation catalogs
- support registries
- support agentic discovery and retrieval
- generate framework target wrappers or examples from the same source

The important point is that the pattern catalog should be searchable first, and
optimizable later.
