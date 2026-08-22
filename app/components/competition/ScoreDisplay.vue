<script setup lang="ts">
withDefaults(defineProps<{
  value: number | null
  winner?: boolean
  size?: 'md' | 'lg'
}>(), {
  winner: false,
  size: 'md',
})
</script>

<template>
  <span
    :class="[
      'font-stats leading-none tabular-nums',
      size === 'lg' ? 'text-score' : 'text-[16px] sm:text-3xl',
      winner ? 'text-star' : 'text-white',
    ]"
  >
    {{ value === null ? '–' : value }}
  </span>
</template>
