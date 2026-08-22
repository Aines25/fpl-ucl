<script setup lang="ts">
defineProps<{
  compact?: boolean
}>()
</script>

<template>
  <div class="flex items-center gap-4 font-stats text-kicker tracking-kicker uppercase text-silver">
    <span class="flex items-center gap-2">
      <span class="size-2 rounded-sm bg-star" />
      Qualification places
    </span>
    <span v-if="!compact" class="flex items-center gap-2">
      <span class="size-2 rounded-sm bg-eliminated" />
      Eliminated
    </span>
  </div>
</template>
