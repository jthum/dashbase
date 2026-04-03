<script module lang="ts">
  import "../../../../dist/components/panel/panel.css";
  import "../../../../dist/components/popover/popover.css";
  import "../../../../dist/components/popover/popover.js";
</script>

<script lang="ts">
  import type { Snippet } from "svelte";
  import { cx, type DashbaseCustomElementProps } from "../../runtime.ts";

  interface Props extends DashbaseCustomElementProps {
    children?: Snippet;
  }

  let { class: className = "", children, ...rest }: Props = $props();
</script>

<panel-header
  {...rest}
  class={cx(className)}
>
  {@render children?.()}
</panel-header>
