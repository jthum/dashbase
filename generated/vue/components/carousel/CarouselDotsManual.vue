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
  <carousel-dots
    v-bind="omitClass(attrs)"
    :class="cx(attrs.class)"
  >
    <slot />
  </carousel-dots>
</template>
