<script setup lang="ts">
defineProps<{
  kicker?: string
  title: string
}>()
</script>

<template>
  <div class="mb-6">
    <p v-if="kicker" class="font-stats text-kicker tracking-kicker text-cyan uppercase">
      {{ kicker }}
    </p>
    <h2 class="font-display text-display tracking-display text-white uppercase">
      {{ title }}
    </h2>
    <PrismRule class="mt-3" />
  </div>
</template>
