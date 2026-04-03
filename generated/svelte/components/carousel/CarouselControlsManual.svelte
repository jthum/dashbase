<script lang="ts">
  import type { Snippet } from "svelte";
  import { cx, type DashbaseCustomElementProps } from "../../runtime.ts";

  interface Props extends DashbaseCustomElementProps {
    children?: Snippet;
  }

  let { class: className = "", children, ...rest }: Props = $props();
</script>

<control-bar
  {...rest}
  class={cx(className)}
>
  {@render children?.()}
</control-bar>
