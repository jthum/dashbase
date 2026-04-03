<script module lang="ts">
  import "../../../../dist/components/carousel/carousel.css";
  import "../../../../dist/components/carousel/carousel.js";
</script>

<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";
  import { cx, type DashbaseCustomElementProps } from "../../runtime.ts";

  interface Props extends Omit<HTMLButtonAttributes, "children"> {
    children?: Snippet;
  }

  let { class: className = "", children, ...rest }: Props = $props();
</script>

<button
  {...rest}
  class={cx(className)}
>
  {@render children?.()}
</button>
