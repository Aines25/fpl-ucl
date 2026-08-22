<script setup lang="ts">
import type { FplSquadView } from '../../../lib/types/squad'

withDefaults(defineProps<{
  squad?: FplSquadView
  loading?: boolean
  size?: 'sm' | 'md'
}>(), {
  loading: false,
  size: 'md',
})
</script>

<template>
  <div class="space-y-3">
    <template v-if="loading && !squad">
      <p class="font-stats text-label tracking-kicker text-silver uppercase">
        Loading squad…
      </p>
      <div class="min-h-[22rem] rounded-md border border-white/10 bg-[#0b2f24]/80 sm:min-h-[26rem]" />
    </template>
    <template v-else>
      <TeamStatsBar v-if="squad" :squad="squad" />
      <PitchView :squad="squad" :size="size" />
    </template>
  </div>
</template>
