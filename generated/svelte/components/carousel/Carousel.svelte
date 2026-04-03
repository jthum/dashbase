<script module lang="ts">
  import "../../../../dist/components/carousel/carousel.css";
  import "../../../../dist/components/carousel/carousel.js";
</script>

<script lang="ts">
  import type { Snippet } from "svelte";
  import { cx, type DashbaseCustomElementProps } from "../../runtime.ts";

  interface Props extends DashbaseCustomElementProps {
    children?: Snippet;
    vertical?: boolean;
  }

  let { class: className = "", children, vertical = false, ...rest }: Props = $props();
</script>

<ui-carousel
  {...rest}
  class={cx(className, vertical && "vertical")}
>
  {@render children?.()}
</ui-carousel>
