<script lang="ts">
  import type { Snippet } from "svelte";
  import { cx, type DashbaseCustomElementProps } from "../../runtime.ts";

  interface Props extends DashbaseCustomElementProps {
    children?: Snippet;
    wide?: boolean;
    alignEnd?: boolean;
    above?: boolean;
    submenu?: boolean;
    contextMenu?: boolean;
  }

  let { class: className = "", children, wide = false, alignEnd = false, above = false, submenu = false, contextMenu = false, ...rest }: Props = $props();
</script>

<popover-panel
  popover
  role={role}
  {...rest}
  class={cx(className, wide && "wide", alignEnd && "align-end", above && "above", submenu && "submenu", contextMenu && "context-menu")}
>
  {@render children?.()}
</popover-panel>
