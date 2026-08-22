<script setup lang="ts">
defineProps<{
  size?: 'sm' | 'md' | 'lg'
}>()
</script>

<template>
  <img
    src="/logo.png"
    alt=""
    :class="size === 'lg' ? 'h-16' : size === 'sm' ? 'h-12' : 'h-14'"
    class="w-auto shrink-0"
    aria-hidden="true"
  >
</template>
