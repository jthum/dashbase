# Popover Panel

Provides the shared anchored overlay primitive for utility popovers and menus, with panel anatomy, menu mode, and a browser-native popover shim.

## Imports

Default entrypoint with automatic CSS and behavior asset imports:

```vue
<script setup lang="ts">
import { PopoverPanel, PopoverHeader, PopoverContent, PopoverFooter } from "@dashbase/vue/popover";
</script>
```

Manual entrypoint when you want to control asset loading yourself:

```ts
import { PopoverPanel, PopoverHeader, PopoverContent, PopoverFooter, popoverAssets } from "@dashbase/vue/popover/manual";
```
