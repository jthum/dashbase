<script setup lang="ts">
  import "../../../../dist/components/tabs/tabs.css";
  import "../../../../dist/components/tabs/tabs.js";
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
  <tab-panel
    v-bind="omitClass(attrs)"
    role="tabpanel"
    :class="cx(attrs.class)"
  >
    <slot />
  </tab-panel>
</template>
