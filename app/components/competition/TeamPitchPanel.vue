<script setup lang="ts">
import type { FplSquadView } from '../../../lib/types/squad'

withDefaults(defineProps<{
  squad?: FplSquadView
  loading?: boolean
  error?: unknown
  size?: 'sm' | 'md'
  scoring?: 'competition' | 'official'
  layout?: 'stack' | 'split'
}>(), {
  loading: false,
  size: 'md',
  scoring: 'competition',
  layout: 'stack',
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
    <p
      v-else-if="error && !squad"
      class="font-stats text-label tracking-kicker text-live uppercase"
    >
      Couldn’t load this squad. Click the row again to retry.
    </p>
    <div
      v-else
      :class="layout === 'split'
        ? 'grid gap-3 lg:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)] lg:items-start'
        : 'space-y-3'"
    >
      <div class="space-y-3">
        <TeamStatsBar v-if="squad" :squad="squad" :scoring="scoring" />
        <TeamTransfers v-if="squad" :squad="squad" />
        <TeamChips v-if="squad" :squad="squad" />
      </div>
      <PitchView :squad="squad" :size="size" />
    </div>
  </div>
</template>
