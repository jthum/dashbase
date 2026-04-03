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
