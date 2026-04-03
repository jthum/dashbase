<script module lang="ts">
  import "../../../../dist/components/input/input.css";
  import "../../../../dist/components/popover/popover.css";
  import "../../../../dist/components/combobox/combobox.css";
  import "../../../../dist/components/combobox/combobox.js";
</script>

<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLInputAttributes } from "svelte/elements";
  import { cx, type DashbaseCustomElementProps } from "../../runtime.ts";

  interface Props extends Omit<HTMLInputAttributes, "children"> {
    children?: Snippet;
  }

  let { class: className = "", children, ...rest }: Props = $props();
</script>

<input
  role="combobox"
  {...rest}
  class={cx(className)} />
