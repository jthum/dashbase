<script setup lang="ts">
  import { useAttrs } from "vue";
  import { cx, omitClass } from "../../runtime.ts";

  defineOptions({ inheritAttrs: false });

  interface Props {
    variant?: "primary" | "danger" | "ghost" | "outline" | "link";
    size?: "xs" | "sm" | "lg" | "xl" | "icon";
  }

  const { variant, size } = defineProps<Props>();
  defineSlots<{ default?: () => any }>();
  const attrs = useAttrs();
</script>

<template>
  <button
    v-bind="omitClass(attrs)"
    :class="cx(attrs.class, variant && {"primary":"primary","danger":"danger","ghost":"ghost","outline":"outline","link":"link"}[variant], size && {"xs":"xs","sm":"small","lg":"large","xl":"xl","icon":"icon"}[size])"
  >
    <slot />
  </button>
</template>
