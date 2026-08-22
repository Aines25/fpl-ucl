<script setup lang="ts">
defineProps<{
  size?: 'sm' | 'md' | 'lg'
}>()
</script>

<template>
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    :class="size === 'lg' ? 'size-14' : size === 'sm' ? 'size-7' : 'size-10'"
    aria-hidden="true"
  >
    <circle
      cx="32"
      cy="32"
      r="22"
      class="stroke-cyan/70"
      stroke-width="1.25"
    />
    <circle
      cx="32"
      cy="32"
      r="14"
      class="stroke-star/80"
      stroke-width="0.75"
    />
    <g class="fill-cyan">
      <polygon
        v-for="index in 8"
        :key="index"
        :transform="`rotate(${(index - 1) * 45} 32 32)`"
        points="32,6 34.2,14 32,13 29.8,14"
      />
    </g>
    <circle
      cx="32"
      cy="32"
      r="3.5"
      class="fill-star"
    />
  </svg>
</template>
