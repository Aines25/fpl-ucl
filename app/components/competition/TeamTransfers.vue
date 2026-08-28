<script setup lang="ts">
import { ArrowRight } from '@lucide/vue'
import type { FplSquadView } from '../../../lib/types/squad'

const props = defineProps<{
  squad: FplSquadView
}>()

const moves = computed(() => props.squad.moves ?? [])
</script>

<template>
  <div class="rounded-md border border-cyan/20 bg-navy-800/80 p-4 shadow-card">
    <p class="font-stats text-kicker tracking-kicker text-silver uppercase">
      Transfers · GW {{ squad.gameweek }}
    </p>

    <p v-if="squad.previewFromGameweek" class="mt-2 font-stats text-label text-silver">
      Transfers for this gameweek aren’t set yet.
    </p>
    <p v-else-if="!moves.length" class="mt-2 font-stats text-label text-silver">
      No transfers this gameweek
    </p>

    <ul v-else class="mt-3 divide-y divide-cyan/10">
      <li
        v-for="move in moves"
        :key="`${move.outId}-${move.inId}`"
        class="flex items-center justify-between gap-3 py-2 font-stats text-label"
      >
        <p class="min-w-0 truncate text-live">
          {{ move.outName }}
        </p>
        <ArrowRight class="size-3.5 shrink-0 text-silver-dim" />
        <p class="min-w-0 truncate text-right text-final">
          {{ move.inName }}
        </p>
      </li>
    </ul>
  </div>
</template>
