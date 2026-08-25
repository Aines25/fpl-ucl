<script setup lang="ts">
import { ChevronLeft, ChevronRight } from '@lucide/vue'
import { matchdays } from '../../../data/matchdays'

const props = defineProps<{
  gameweek: number
  maxGameweek: number
}>()

const emit = defineEmits<{
  update: [gameweek: number]
}>()

const label = computed(() => {
  const mapped = matchdays.find((entry) => entry.fplGameweek === props.gameweek)
  return mapped ? `GW ${props.gameweek} · ${mapped.label}` : `GW ${props.gameweek}`
})

const atStart = computed(() => props.gameweek <= 1)
const atEnd = computed(() => props.gameweek >= props.maxGameweek)
</script>

<template>
  <div class="mb-6 flex items-center justify-between gap-3 rounded-md border border-cyan/20 bg-navy-800/80 px-3 py-2">
    <button
      type="button"
      class="inline-flex items-center gap-1 px-2 py-1.5 font-stats text-kicker tracking-kicker uppercase disabled:opacity-30"
      :class="atStart ? 'text-silver-dim' : 'text-cyan hover:text-white'"
      :disabled="atStart"
      @click="emit('update', gameweek - 1)"
    >
      <ChevronLeft class="size-4" />
      Prev
    </button>
    <p class="text-center font-stats text-label tracking-kicker text-white uppercase">
      {{ label }}
    </p>
    <button
      type="button"
      class="inline-flex items-center gap-1 px-2 py-1.5 font-stats text-kicker tracking-kicker uppercase disabled:opacity-30"
      :class="atEnd ? 'text-silver-dim' : 'text-cyan hover:text-white'"
      :disabled="atEnd"
      @click="emit('update', gameweek + 1)"
    >
      Next
      <ChevronRight class="size-4" />
    </button>
  </div>
</template>
