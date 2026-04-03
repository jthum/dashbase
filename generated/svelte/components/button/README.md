# Button

Styles native button elements with class-based variants, sizes, and icon treatment without requiring a behavior shim.

## Imports

Default entrypoint with automatic CSS and behavior asset imports:

```svelte
<script lang="ts">
  import { Button } from "@dashbase/svelte/button";
</script>
```

Manual entrypoint when you want to control asset loading yourself:

```ts
import { Button, buttonAssets } from "@dashbase/svelte/button/manual";
```

## Adapter Props

- `variant?: "primary" | "danger" | "ghost" | "outline" | "link"`
- `size?: "xs" | "sm" | "lg" | "xl" | "icon"`
