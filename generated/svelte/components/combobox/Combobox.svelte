<script module lang="ts">
  import "../../../../dist/components/input/input.css";
  import "../../../../dist/components/popover/popover.css";
  import "../../../../dist/components/combobox/combobox.css";
  import "../../../../dist/components/combobox/combobox.js";
</script>

<script lang="ts">
  import type { Snippet } from "svelte";
  import { cx, type DashbaseCustomElementProps } from "../../runtime.ts";

  interface Props extends DashbaseCustomElementProps {
    children?: Snippet;
  }

  let { class: className = "", children, ...rest }: Props = $props();
</script>

<combo-box
  {...rest}
  class={cx(className)}
>
  {@render children?.()}
</combo-box>
