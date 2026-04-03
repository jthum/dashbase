<script setup lang="ts">
  import "../../../../dist/components/carousel/carousel.css";
  import "../../../../dist/components/carousel/carousel.js";
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
  <item-group
    v-bind="omitClass(attrs)"
    :class="cx(attrs.class)"
  >
    <slot />
  </item-group>
</template>
