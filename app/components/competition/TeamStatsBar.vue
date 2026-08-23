<script setup lang="ts">
import type { FplSquadView } from '../../../lib/types/squad'
import { formatTeamValue, formatTransfers } from '../../../lib/engine/squad'

const props = withDefaults(defineProps<{
  squad: FplSquadView
  scoring?: 'competition' | 'official'
}>(), {
  scoring: 'competition',
})

const totalPoints = computed(() => {
  if (!props.squad.available) return '–'
  if (props.scoring === 'official') {
    return props.squad.officialNetPoints ?? props.squad.netPoints
  }
  return props.squad.netPoints
})
</script>

<template>
  <div class="rounded-md border border-cyan/20 bg-navy-800/80 p-4 shadow-card">
    <div class="mb-4 flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="truncate font-display text-sm tracking-wide text-white uppercase sm:text-base">
          {{ squad.name }}
        </p>
        <p v-if="squad.teamName" class="truncate font-stats text-label text-silver">
          {{ squad.teamName }}
        </p>
      </div>
      <div class="flex shrink-0 items-center gap-2">
        <span class="font-stats text-kicker tracking-kicker text-cyan uppercase">
          {{ squad.formation }}
        </span>
        <span
          v-if="squad.chipLabel"
          class="rounded-sm border border-star/40 bg-star/15 px-1.5 py-0.5 font-stats text-kicker tracking-kicker text-star uppercase"
        >
          {{ squad.chipLabel }}
        </span>
      </div>
    </div>

    <dl class="grid grid-cols-3 gap-3">
      <div>
        <dt class="font-stats text-kicker tracking-kicker text-silver uppercase">
          {{ scoring === 'official' ? 'FPL points' : 'Total points' }}
        </dt>
        <dd class="font-stats text-2xl leading-tight text-star tabular-nums">
          {{ totalPoints }}
        </dd>
      </div>
      <div>
        <dt class="font-stats text-kicker tracking-kicker text-silver uppercase">Transfers</dt>
        <dd class="font-stats text-2xl leading-tight text-white tabular-nums">
          {{ squad.available ? formatTransfers(squad.transfers, squad.transferCost) : '–' }}
        </dd>
      </div>
      <div>
        <dt class="font-stats text-kicker tracking-kicker text-silver uppercase">Team value</dt>
        <dd class="font-stats text-2xl leading-tight text-white tabular-nums">
          {{ formatTeamValue(squad.teamValue) }}
        </dd>
      </div>
    </dl>
  </div>
</template>
