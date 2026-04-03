<script setup lang="ts">
  import { useAttrs } from "vue";
  import { cx, omitClass } from "../../runtime.ts";

  defineOptions({ inheritAttrs: false });

  interface Props {
    vertical?: boolean;
  }

  const { vertical = false } = defineProps<Props>();
  defineSlots<{ default?: () => any }>();
  const attrs = useAttrs();
</script>

<template>
  <ui-tabs
    v-bind="omitClass(attrs)"
    :class="cx(attrs.class, vertical && "vertical")"
  >
    <slot />
  </ui-tabs>
</template>
