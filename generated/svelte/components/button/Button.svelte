<script module lang="ts">
  import "../../../../dist/components/button/button.css";
</script>

<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";
  import { cx, type DashbaseCustomElementProps } from "../../runtime.ts";

  interface Props extends Omit<HTMLButtonAttributes, "children"> {
    children?: Snippet;
    variant?: "primary" | "danger" | "ghost" | "outline" | "link";
    size?: "xs" | "sm" | "lg" | "xl" | "icon";
  }

  let { class: className = "", children, variant, size, ...rest }: Props = $props();
</script>

<button
  {...rest}
  class={cx(className, variant && {"primary":"primary","danger":"danger","ghost":"ghost","outline":"outline","link":"link"}[variant], size && {"xs":"xs","sm":"small","lg":"large","xl":"xl","icon":"icon"}[size])}
>
  {@render children?.()}
</button>
