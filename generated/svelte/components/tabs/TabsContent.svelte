<script module lang="ts">
  import "../../../../dist/components/tabs/tabs.css";
  import "../../../../dist/components/tabs/tabs.js";
</script>

<script lang="ts">
  import type { Snippet } from "svelte";
  import { cx, type DashbaseCustomElementProps } from "../../runtime.ts";

  interface Props extends DashbaseCustomElementProps {
    children?: Snippet;
  }

  let { class: className = "", children, ...rest }: Props = $props();
</script>

<tab-panel
  role="tabpanel"
  {...rest}
  class={cx(className)}
>
  {@render children?.()}
</tab-panel>
