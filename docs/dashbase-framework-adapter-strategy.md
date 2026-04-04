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

The same model can extend upward to **patterns**: higher-level native HTML
compositions authored under `src/patterns/` with their own contracts and
dependency metadata. Patterns should remain plain HTML in the shipped output,
but may use author-time composition references in the future so they can stay
linked to canonical component structure. Pattern contracts may also expose a
small adapter-facing `props` and `slots` surface so generated targets can ship
ergonomic wrappers without changing the HTML-first source model.

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
   - contracts live next to the component as `src/components/{name}/{name}.contract.json`
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

## Browser Shims vs Framework Adapters

Dashbase should **not** solve every framework concern by making the vanilla
browser shims much larger.

That would push React/Svelte/Vue/Solid lifecycle and SSR complexity into the
plain HTML runtime, even though plain browser consumers do not need most of it.

The healthier split is:

1. **Browser shims stay optimized for native HTML usage**
   - lightweight auto-boot where appropriate
   - direct DOM coordination
   - minimal assumptions about framework lifecycles

2. **Generated framework adapters take on framework-specific glue**
   - client-only boot for SSR-safe hydration
   - attaching and removing DOM listeners in framework lifecycle hooks
   - translating native custom events into idiomatic adapter events
   - deciding when a shim-backed component is no longer safe enough and needs a
     controller-backed or native override

3. **Only add lifecycle surface to shims when it clearly pays off**
   - `init(root)`
   - `destroy(root)`
   - optional `boot()` for plain browser auto-init

That means the default strategy is **not** “make every shim framework-aware.”
It is “keep browser shims lean, and make the adapters smart enough to host them
correctly.”

Internally the contract may still use `defaultMode: "shim-backed"` for
historical consistency, but generated docs and adapter-facing output should
prefer the friendlier term **browser shim**.

This matters because otherwise every shim would need to grow support for:

- mount/unmount cleanup
- observer teardown
- SSR guards
- re-init safety
- framework-specific event assumptions

That would make the browser implementation heavier than it needs to be.

---

## What The Contract Needs To Describe

A component contract should capture:

- canonical root element
- anatomy elements and their parent-child rules
- allowed variants and modifiers
- adapter-facing props that map to classes or native/ARIA attributes
- state attributes and ARIA expectations
- keyboard, focus, and relationship accessibility invariants that cannot be inferred safely from selectors alone
- emitted events
- required CSS and optional JS imports
- small docs/example metadata for generated adapter docs
- slot or child-content regions
- whether an override exists for any target
- whether the default adapter path is shim-backed
- whether the shim must only boot on the client
- whether the shim exposes lifecycle hooks such as `init` / `destroy`
- whether emitted events need adapter-level remapping
- whether the shim mutates live DOM state in ways that make VDOM desync likely

It should **not** try to describe every algorithmic behavior as declarative
logic.

To keep growth under control, Dashbase should prefer one contract file with
clear internal boundaries rather than many small companion files. In practice,
that means:

- keep core anatomy, props, states, imports, and examples in the stable root
- keep framework-hosting hints small and explicit
- reserve an `adapters` namespace for target-specific metadata when it becomes
  necessary
- add new fields only when generation, parity testing, or documentation
  actually needs them

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
    exportName?: string;
    role?: string;
    class?: string[];
  };
  anatomy: Array<{
    name: string;
    tag?: string;
    exportName?: string;
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
    target: string;
    kind: "class-group" | "attribute";
    values?: Record<string, string> | string[];
    attribute?: string;
  }>;
  events?: Array<{
    name: string;
    source: string;
    detail?: string;
    adapterName?: Partial<Record<"react" | "svelte" | "vue" | "solid", string>>;
  }>;
  accessibility?: {
    focusModel?: "native" | "roving-tabindex" | "active-descendant";
    requiredAttributes?: Array<{
      target: string;
      attributes: string[];
    }>;
    relationships?: Array<{
      from: string;
      attribute: string;
      to: string;
    }>;
    keyboardInteractions?: Array<{
      target: string;
      key: string;
      effect: string;
    }>;
  };
  behavior?: {
    shim?: string;
    defaultMode: "none" | "shim-backed";
    clientOnly?: boolean;
    lifecycle?: {
      init?: string;
      destroy?: string;
      boot?: string;
    };
    domOwnership?: "adapter-safe" | "shim-mutates-live-state";
    overrides?: Partial<Record<"react" | "svelte" | "vue" | "solid", {
      mode: "native" | "controller-backed";
      entry: string;
    }>>;
    controller?: string;
  };
  adapters?: Partial<Record<"react" | "svelte" | "vue" | "solid", {
    mode?: "generated" | "browser-shim" | "controller-backed" | "native";
    clientOnly?: boolean;
    eventMap?: Record<string, string>;
    notes?: string[];
  }>>;
  imports: {
    css: string[];
    js?: string[];
  };
};
```

This is a contract format, not a user-facing DSL.

The current generated React target uses those optional `exportName` and `tag`
fields to generate wrappers into `generated/react/` via
`scripts/targets/react/generate.ts`, with no additional npm dependencies.
It now also uses a small `docs.examples` block plus named example markers in
component HTML files to generate per-component React usage docs and the first
target-specific `examples.tsx` modules.

The contract should gradually grow the minimum metadata needed to host browser
shims safely inside framework runtimes. That does **not** mean encoding every
behavior in declarative form; it means exposing the handful of facts the
adapter runtime needs in order to:

- boot only on the client
- attach and detach listeners safely
- bridge custom events into framework idioms
- identify components that are likely to need controller-backed overrides later

The accessibility block should stay intentionally narrow. Roles and many ARIA
expectations are already implied by anatomy selectors and `states`. The extra
metadata should only capture what generators and parity tests cannot infer
reliably from structure alone:

- authored attributes that must always be present
- keyboard interactions that are part of the public contract
- focus models such as roving tabindex or active descendant
- explicit element-to-element relationships such as `aria-controls`

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
    { name: "orientation", kind: "attribute", target: "list", attribute: "aria-orientation", values: ["horizontal", "vertical"] },
  ],
  events: [
    { name: "change", source: "tab-list" },
  ],
  behavior: {
    shim: "dist/components/tabs/tabs.js",
    defaultMode: "shim-backed",
  },
  imports: {
    css: ["dist/components/tabs/tabs.css"],
    js: ["dist/components/tabs/tabs.js"],
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
    { name: "placeholder", kind: "attribute", target: "input", attribute: "placeholder" },
    { name: "value", kind: "attribute", target: "input", attribute: "value" },
    { name: "disabled", kind: "attribute", target: "input", attribute: "disabled" },
  ],
  events: [
    { name: "change", source: "input", detail: "{ value: string }" },
  ],
  behavior: {
    shim: "dist/components/combobox/combobox.js",
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
    css: ["dist/components/combobox/combobox.css", "dist/components/popover/popover.css"],
    js: ["dist/components/combobox/combobox.js"],
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

### Why Shim-Backed Does Not Mean Naive

Even for shim-backed components, the framework adapter should still be
responsible for:

- mounting the shim only after client hydration
- wiring DOM custom events into `onChange` / `@change` / callback props
- cleaning up any adapter-owned listeners on unmount

That lets the browser shim remain focused on DOM behavior instead of becoming a
full framework runtime.

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

This controller path is especially important for components where a browser shim
mutates live DOM state that a Virtual DOM framework may later overwrite during
an unrelated re-render. Examples include:

- `aria-expanded`
- `aria-activedescendant`
- `hidden`
- selection and active-item attributes

When that mutation pattern becomes too hard to host safely from the outside,
the component should graduate from shim-backed to controller-backed or native.

---

## Known Gotchas

Generated framework adapters should explicitly account for four recurring
problems:

1. **Lifecycle teardown**
   - Shims may attach listeners, observers, or other long-lived resources.
   - Adapters must ensure client-only boot and reliable cleanup on unmount.

2. **Event translation**
   - Native custom events do not automatically feel idiomatic in every
     framework.
   - Adapters should translate contract events into target-appropriate props or
     listeners instead of assuming a framework will pick them up automatically.

3. **Virtual DOM desync**
   - A shim may mutate live DOM state that the framework later overwrites.
   - This is the main trigger for controller-backed or native overrides.

4. **SSR / hydration timing**
   - Shims that touch `document`, `window`, or layout measurement must boot only
     after the client runtime is active.
   - Generated adapters should treat browser shims as client-hosted behavior,
     not as code that runs during server rendering.

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
