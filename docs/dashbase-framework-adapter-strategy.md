# Dashbase Framework Adapter Strategy (Without a Behavior DSL)

Dashbase should be able to produce React, Svelte, Vue, and Solid adapters
without hand-maintaining four drifting component libraries.

This document describes a path that does **not** require making every behavior
shim expressible in a DSL, and does **not** require deciding a custom adapter
strategy for every new component.

---

## Core Position

Dashbase should treat:

- semantic HTML structure
- component CSS
- vanilla behavior shims

as the canonical implementation surface.

Framework adapters should be generated from **component contracts**, with the
existing browser behavior shim as the default implementation path.

Framework-specific overrides should be optional, not mandatory.

This matters because many Dashbase behaviors are already more expressive than a
small declarative DSL would comfortably allow:

- keyboard models
- focus management
- anchored positioning
- multi-element coordination
- accessibility state syncing

Trying to force all of that into a DSL would either:

1. make the DSL too weak to be useful, or
2. make the DSL so powerful that it becomes a worse programming language than
   JavaScript.

---

## Default Strategy

Dashbase should adopt one default rule:

- every component contract must be translatable to every supported target
- the generated adapter should use the existing Dashbase behavior shim by default
- target-specific overrides are purely opt-in

That removes the need to make a design decision for every component up front.

The question becomes:

- "Does this component need a target override?"

instead of:

- "Which adapter strategy should this component use?"

Most components should not need an override initially.

---

## The Better Split

Dashbase should separate three concerns:

1. **Core Source**
   - HTML examples define structure and anatomy
   - CSS defines visual behavior
   - vanilla JS defines platform-level interaction

2. **Machine-Readable Contracts**
   - each component exposes the structure and behavior surface a wrapper needs
   - this is not a full behavior language
   - it is a stable contract for generators
   - it must be sufficient to build a shim-backed adapter automatically

3. **Optional Overrides / Shared Controllers**
   - complex interactive components may later expose small framework-neutral
     controller/state modules
   - framework wrappers can bind those controllers into React/Svelte/Vue/Solid
   - or a specific target can ship a native override
   - vanilla behavior shims remain the default implementation path unless an
     override exists

The important thing is that overrides are exceptions, not the baseline model.

---

## What The Contract Needs To Describe

A component contract should capture:

- canonical root element
- anatomy elements and their parent-child rules
- allowed variants and modifiers
- state attributes and ARIA expectations
- emitted events
- required CSS and optional JS imports
- slot or child-content regions
- whether an override exists for any target
- whether the default adapter path is shim-backed

It should **not** try to describe every algorithmic behavior as declarative
logic.

---

## Contract Shape

An adapter contract can stay simple.

Example shape:

```ts
type ComponentContract = {
  name: string;
  category: "presentational" | "interactive";
  root: {
    tag: string;
    role?: string;
    class?: string[];
  };
  anatomy: Array<{
    name: string;
    selector: string;
    required: boolean;
    children?: string[];
  }>;
  variants?: Array<{
    name: string;
    type: "class" | "attribute";
    values?: string[];
  }>;
  props?: Array<{
    name: string;
    mapsTo: "attribute" | "class" | "text" | "event";
    target?: string;
    type: string;
  }>;
  events?: Array<{
    name: string;
    source: string;
    detail?: string;
  }>;
  behavior?: {
    shim?: string;
    defaultMode: "none" | "shim-backed";
    overrides?: Partial<Record<"react" | "svelte" | "vue" | "solid", {
      mode: "native" | "controller-backed";
      entry: string;
    }>>;
    controller?: string;
  };
  imports: {
    css: string[];
    js?: string[];
  };
};
```

This is a contract format, not a user-facing DSL.

---

## Example: Tabs

Tabs are a good example of a component that should be translatable by default
without needing a framework-specific rewrite.

```ts
const tabsContract = {
  name: "Tabs",
  category: "interactive",
  root: {
    tag: "ui-tabs",
  },
  anatomy: [
    {
      name: "list",
      selector: "tab-list[role='tablist']",
      required: true,
      children: ["tab"],
    },
    {
      name: "tab",
      selector: "[role='tab']",
      required: true,
    },
    {
      name: "panel",
      selector: "tab-panel[role='tabpanel']",
      required: true,
    },
  ],
  variants: [
    {
      name: "orientation",
      type: "attribute",
      values: ["horizontal", "vertical"],
    },
  ],
  props: [
    { name: "orientation", mapsTo: "attribute", target: "tab-list", type: "\"horizontal\" | \"vertical\"" },
    { name: "value", mapsTo: "attribute", target: "tab", type: "string" },
    { name: "defaultValue", mapsTo: "attribute", target: "tab", type: "string" },
  ],
  events: [
    { name: "change", source: "tab-list" },
  ],
  behavior: {
    shim: "dist/behaviors/tabs.js",
    defaultMode: "shim-backed",
  },
  imports: {
    css: ["dist/components/tabs.css"],
    js: ["dist/behaviors/tabs.js"],
  },
} satisfies ComponentContract;
```

### React Wrapper Shape

```tsx
export function Tabs(props: TabsProps) {
  return <ui-tabs>{props.children}</ui-tabs>;
}

export function TabsList(props: TabsListProps) {
  return <tab-list role="tablist" aria-orientation={props.orientation}>{props.children}</tab-list>;
}

export function TabsTrigger(props: TabsTriggerProps) {
  return <button type="button" role="tab" {...props} />;
}

export function TabsContent(props: TabsContentProps) {
  return <tab-panel role="tabpanel" {...props} />;
}
```

For tabs, the wrapper mostly preserves structure and prop typing, then wires the
browser shim by default. If a future target wants a native override, that can
be added later without changing the contract shape.

---

## Example: Combobox

Combobox is more complex, but the default adapter should still be generated
without forcing a special decision at author time.

```ts
const comboboxContract = {
  name: "Combobox",
  category: "interactive",
  root: {
    tag: "combo-box",
  },
  anatomy: [
    {
      name: "input",
      selector: "input[role='combobox']",
      required: true,
    },
    {
      name: "panel",
      selector: "popover-panel[popover][role='listbox']",
      required: true,
      children: ["option", "empty"],
    },
    {
      name: "option",
      selector: "button[role='option']",
      required: true,
    },
    {
      name: "empty",
      selector: "combobox-empty",
      required: false,
    },
  ],
  props: [
    { name: "placeholder", mapsTo: "attribute", target: "input", type: "string" },
    { name: "value", mapsTo: "attribute", target: "input", type: "string" },
    { name: "disabled", mapsTo: "attribute", target: "input", type: "boolean" },
  ],
  events: [
    { name: "change", source: "input", detail: "{ value: string }" },
  ],
  behavior: {
    shim: "dist/behaviors/combobox.js",
    defaultMode: "shim-backed",
    overrides: {
      react: {
        mode: "controller-backed",
        entry: "overrides/react/combobox.tsx",
      },
    },
    controller: "controllers/combobox-controller.ts",
  },
  imports: {
    css: ["dist/components/combobox.css", "dist/components/popover.css"],
    js: ["dist/behaviors/combobox.js"],
  },
} satisfies ComponentContract;
```

### Why Combobox Might Later Want A Controller

The current implementation coordinates:

- filtering
- active option movement
- `aria-activedescendant`
- `aria-expanded`
- selection
- anchored popover positioning
- outside-dismiss and resize/scroll reposition

Those are real interaction rules, not just prop-to-attribute mappings.

The important part is that Dashbase does **not** need to decide that on day one.

The baseline adapter can still be generated against the browser shim.

Only when a specific target proves it needs a better experience should Dashbase
opt into a controller-backed or native override.

---

## Overrides And Controller Layer

If a component eventually needs target-specific optimization, the controller
layer should be:

- framework-neutral
- pure or mostly pure where possible
- small enough to test directly
- focused on interaction logic, not rendering

Examples:

- `tabs-controller.ts`
- `combobox-controller.ts`
- `calendar-controller.ts`
- `popover-menu-controller.ts`

The override wrappers would then:

- render canonical Dashbase anatomy
- bind framework events and refs
- delegate behavior/state transitions to the shared controller

This prevents drift while still letting complex components stay expressive,
without forcing every component to start there.

---

## Generator Responsibilities

The generator should do four things:

1. Read a committed contract
2. Apply a target template
3. Emit wrapper files for a framework package
4. Emit parity tests and example stories from the same source contract

The generator should **not** be responsible for inventing behavior semantics.

Its input should be stable component contracts plus optional override metadata,
not raw HTML scraping alone.

---

## Recommended Output Packages

Dashbase should eventually be able to generate:

- `@dashbase/react`
- `@dashbase/svelte`
- `@dashbase/vue`
- `@dashbase/solid`

Each package should be as thin as possible.

Default generated components:

- render canonical Dashbase anatomy
- map props to classes/attributes
- forward refs and events
- boot or bind the existing behavior shim when needed

Overridden components:

- render canonical anatomy
- use a shared controller package
- keep framework-specific code limited to binding and lifecycle glue

---

## Drift Prevention

To keep wrappers honest, Dashbase should generate or maintain parity checks:

- DOM shape snapshots
- ARIA/state snapshots
- keyboard interaction tests
- emitted event tests
- example-based visual tests where useful

The important idea is that the contract becomes the foundation, not four
manually rewritten libraries.

---

## What This Means For Current Dashbase Work

Dashbase does **not** need to solve adapter generation immediately.

The right near-term move is:

1. keep maturing core HTML/CSS/JS components
2. make component contracts explicit as the surface stabilizes
3. make every contract translatable by default through a shim-backed compiler
4. only add per-target overrides when a component clearly earns them

This avoids locking unstable components into four drifting framework APIs too
early, while also avoiding a high-cognition “pick a strategy for every
component” workflow.

---

## Authoring Implications

When authoring new Dashbase components, think in terms of:

- canonical anatomy
- ARIA/state contract
- emitted events
- behavior hooks
- whether the default shim-backed adapter path is sufficient
- whether any target truly needs an override

That discipline is what will make future adapters generator-friendly, even
without a universal DSL for behaviors.
