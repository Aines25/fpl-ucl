<script setup lang="ts">
withDefaults(defineProps<{
  class?: string
}>(), {
  class: '',
})
</script>

<template>
  <div
    :class="['h-px w-full bg-linear-to-r from-transparent via-cyan/70 to-transparent', $props.class]"
    aria-hidden="true"
  />
</template>
