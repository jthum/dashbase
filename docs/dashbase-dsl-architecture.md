# Dashbase — DSL & Multi-Framework Transpiler Architecture

> Companion document to the Dashbase PRD.  
> This describes the planned toolchain for generating idiomatic framework components from Dashbase's framework-agnostic CSS source.

---

## The Idea

Dashbase produces standalone CSS components with minimal vanilla JS. These are the **source of truth** — readable, framework-agnostic, and built on web standards.

The goal of this toolchain is to take that source and automatically generate idiomatic component packages for React, Vue, Svelte, Solid (and any future framework) — without duplicating design decisions or drifting from the source.

```
Dashbase source (HTML + CSS + vanilla JS)
        ↓
  Component DSL  ←  abstract contracts, zero framework awareness
        ↓
 ┌──────┼──────┬───────┐
React  Vue  Svelte  Solid  ←  transpilers own all framework idioms
        ↓
@dashbase/react   @dashbase/vue   @dashbase/svelte   @dashbase/solid
```

**The CSS is never transpiled.** Every framework package simply imports the compiled Dashbase CSS files directly. The transpiler only handles HTML structure and JS behavior.

---

## The DSL

The DSL is a JSON format that describes **component contracts** — not implementations. It has no knowledge of any framework.

### What it describes

- Element structure and slot positions
- Props and their mapping (to class, attribute, or property)
- State — internal or externally controllable
- Events emitted
- Public methods (programmatic control)
- Inter-component relationships (compound components)
- Which CSS file to import
- Whether a JS behavior module is needed

### Example — Button (structural, no JS)

```json
{
  "name": "Button",
  "element": "button",
  "cssFile": "components/button/button.css",
  "props": [
    { "name": "variant", "type": "enum", "values": ["primary", "danger", "ghost", "outline"], "mapsTo": "class" },
    { "name": "size", "type": "enum", "values": ["sm", "lg"], "mapsTo": "class" },
    { "name": "disabled", "type": "boolean", "mapsTo": "attribute" },
    { "name": "type", "type": "enum", "values": ["button", "submit", "reset"], "mapsTo": "attribute", "default": "button" }
  ],
  "slots": [{ "name": "default" }],
  "events": [{ "name": "click" }]
}
```

### Example — Tabs (stateful, compound, JS-enhanced)

```json
{
  "name": "Tabs",
  "element": "tab-list",
  "cssFile": "components/tabs/tabs.css",
  "jsFile": "components/tabs/tabs.js",
  "state": [
    { "name": "activeIndex", "type": "number", "default": 0, "exposed": true }
  ],
  "events": [
    { "name": "change", "payload": "number" }
  ],
  "methods": [],
  "compoundChildren": ["TabPanel"],
  "sharesStateWith": ["TabPanel"]
}
```

### Example — Dialog (programmatic control)

```json
{
  "name": "Dialog",
  "element": "dialog",
  "cssFile": "components/dialog/dialog.css",
  "jsFile": "components/dialog/dialog.js",
  "props": [
    { "name": "open", "type": "boolean", "mapsTo": "attribute", "exposed": true }
  ],
  "methods": ["showModal", "close"],
  "events": [
    { "name": "close" }
  ],
  "slots": [{ "name": "default" }]
}
```

---

## The Key Design Principle

**The DSL describes abstract concepts. The transpiler decides how to express them in each framework.**

| DSL concept | React | Vue | Svelte | Solid |
|---|---|---|---|---|
| `"exposed": true` on state | `value` + `defaultValue` + `onChange` | `v-model` / `modelValue` | `bind:activeIndex` | signal accessor |
| `"sharesStateWith"` | React Context | `provide` / `inject` | Svelte store | Context API |
| `"methods": ["open"]` | `useImperativeHandle` | `defineExpose` | `bind:this` | `ref` + method |
| `"events": [{ "name": "change" }]` | `onChange` prop | `emit('change')` | `createEventDispatcher` | `onchange` prop |

The DSL never uses the words "context", "emit", "store", or "signal". Those are transpiler concerns.

---

## The Toolchain

### `dashbase-extract`

Reads Dashbase source files (HTML examples, CSS, vanilla JS) and produces the DSL JSON per component. This is the interesting build tool — it parses source to infer the contract.

### `dashbase-gen`

Reads DSL JSON and a framework target, outputs idiomatic component code. For structural components (no state, no JS), this is pure template substitution. For stateful/compound components, the transpiler applies framework-idiomatic patterns.

### Framework packages

Published separately. Import compiled Dashbase CSS, wrap in generated framework components.

```
@dashbase/react
@dashbase/vue
@dashbase/svelte
@dashbase/solid
```

---

## Why This Works for Dashbase Specifically

Most component libraries fail at this abstraction because their JS is complex enough that framework idioms can't be mechanically inferred. Dashbase's philosophy — CSS handles state wherever possible, JS only does what HTML/CSS cannot — keeps the behavioral surface small enough that the DSL can express it fully.

The forcing function is intentional: **if a behavior is too complex to describe as an abstract contract in the DSL, it probably doesn't belong in Dashbase at all.**

The components that need JS in Dashbase are: `dialog` (invoker shim), `tabs` (aria + keyboard nav), `dropdown` (popover positioning). That's a bounded, stable surface — exactly the right size for a generatable abstraction.

---

## Relationship to Existing Tools

- **Mitosis (Builder.io)** — closest prior art. Uses restricted JSX as source, compiles to frameworks. Dashbase inverts this: plain HTML/CSS is source, DSL is the intermediate. Cleaner boundary, no framework concepts leaking into source.
- **Headless UI / Radix / Melt UI** — share behavioral contracts, implement per framework by hand. Dashbase automates what they do manually.
- **Web Components** — solve distribution differently (shadow DOM, custom elements registry). Dashbase uses plain HTML + CSS; no shadow DOM, no registration ceremony.

---

## Status

This toolchain is **planned, not yet built**. The Dashbase CSS source (documented in the PRD) is built first and acts as the specification. The DSL format and transpiler are designed once the component surface is stable and the behavioral patterns are well understood from the vanilla JS implementations.

Contract validation between CSS and DSL should also wait until that stage. Once Dashbase reaches broad component parity and the public surface has settled, strict drift checks become worthwhile and durable.

---

*Read alongside the Dashbase PRD for full context on the source library this toolchain operates on.*
