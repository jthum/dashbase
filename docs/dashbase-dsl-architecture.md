# Dashbase — Archived DSL Architecture Note

This document is retained only as a stable path for older references.

Dashbase no longer treats a universal behavior DSL as the primary architecture
for framework generation.

The current direction is:

- semantic HTML, component CSS, and vanilla browser shims remain the canonical
  source of truth
- colocated `.contract.json` files describe the machine-readable adapter
  contract for each component or pattern
- framework targets are generated from those explicit contracts
- browser shims are the default implementation path, with target-specific
  overrides remaining opt-in

If you are looking for the current architecture, read these instead:

- [dashbase-framework-adapter-strategy.md](./dashbase-framework-adapter-strategy.md)
- [dashbase-pattern-architecture.md](./dashbase-pattern-architecture.md)
- [component-authoring-prompt.md](./component-authoring-prompt.md)

Why this changed:

- Dashbase behaviors grew beyond what a small declarative DSL could express
  comfortably
- explicit contracts proved more deterministic and easier to validate than
  inferred DSL extraction
- generated React, Svelte, and Vue targets already operate from real contracts
  in the repo today

The old DSL idea is still useful as historical context:

- contracts remain an internal machine-readable layer
- generators should remain deterministic
- framework wrappers are still disposable convenience layers, not the canonical
  API

But the live implementation model is now **contract-first generation**, not
**DSL-first transpilation**.
