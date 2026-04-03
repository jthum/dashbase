<script setup lang="ts">
  import "../../../../dist/components/panel/panel.css";
  import "../../../../dist/components/popover/popover.css";
  import "../../../../dist/components/popover/popover.js";
  import { useAttrs } from "vue";
  import { cx, omitClass } from "../../runtime.ts";

  defineOptions({ inheritAttrs: false });

  interface Props {
    wide?: boolean;
    alignEnd?: boolean;
    above?: boolean;
    submenu?: boolean;
    contextMenu?: boolean;
  }

  const { wide = false, alignEnd = false, above = false, submenu = false, contextMenu = false } = defineProps<Props>();
  defineSlots<{ default?: () => any }>();
  const attrs = useAttrs();
</script>

<template>
  <popover-panel
    v-bind="omitClass(attrs)"
    popover
    :role="role"
    :class="cx(attrs.class, wide && "wide", alignEnd && "align-end", above && "above", submenu && "submenu", contextMenu && "context-menu")"
  >
    <slot />
  </popover-panel>
</template>
