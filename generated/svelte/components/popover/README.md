# Popover Panel

Provides the shared anchored overlay primitive for utility popovers and menus, with panel anatomy, menu mode, and a browser-native popover shim.

## Imports

Default entrypoint with automatic CSS and behavior asset imports:

```svelte
<script lang="ts">
  import { PopoverPanel, PopoverHeader, PopoverContent, PopoverFooter } from "@dashbase/svelte/popover";
</script>
```

Manual entrypoint when you want to control asset loading yourself:

```ts
import { PopoverPanel, PopoverHeader, PopoverContent, PopoverFooter, popoverAssets } from "@dashbase/svelte/popover/manual";
```

## Behavior Hosting

- Generated adapter mode: `browser-shim`
- The default entrypoint auto-imports a browser behavior shim.
- In SSR runtimes, mount this component from a client boundary or after client hydration.
- The shim mutates live DOM state. If the framework starts fighting those mutations, prefer a controller-backed or native override.
