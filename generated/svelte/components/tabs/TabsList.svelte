<script module lang="ts">
  import "../../../../dist/components/tabs/tabs.css";
  import "../../../../dist/components/tabs/tabs.js";
</script>

<script lang="ts">
  import type { Snippet } from "svelte";
  import { cx, type DashbaseCustomElementProps } from "../../runtime.ts";

  interface Props extends DashbaseCustomElementProps {
    children?: Snippet;
    orientation?: "horizontal" | "vertical";
  }

  let { class: className = "", children, orientation, ...rest }: Props = $props();
</script>

<tab-list
  role="tablist"
  aria-orientation={orientation}
  {...rest}
  class={cx(className)}
>
  {@render children?.()}
</tab-list>
