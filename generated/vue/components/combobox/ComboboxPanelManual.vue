<script setup lang="ts">
  import { useAttrs } from "vue";
  import { cx, omitClass } from "../../runtime.ts";

  defineOptions({ inheritAttrs: false });

  interface Props {
  }

  defineProps<Props>();
  defineSlots<{ default?: () => any }>();
  const attrs = useAttrs();
</script>

<template>
  <popover-panel
    v-bind="omitClass(attrs)"
    popover
    role="listbox"
    :class="cx(attrs.class)"
  >
    <slot />
  </popover-panel>
</template>
