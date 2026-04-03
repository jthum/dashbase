<script setup lang="ts">
  import { useAttrs } from "vue";
  import { cx, omitClass } from "../../runtime.ts";

  defineOptions({ inheritAttrs: false });

  interface Props {
    orientation?: "horizontal" | "vertical";
  }

  const { orientation } = defineProps<Props>();
  defineSlots<{ default?: () => any }>();
  const attrs = useAttrs();
</script>

<template>
  <tab-list
    v-bind="omitClass(attrs)"
    role="tablist"
    :aria-orientation="orientation"
    :class="cx(attrs.class)"
  >
    <slot />
  </tab-list>
</template>
