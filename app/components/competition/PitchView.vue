<script setup lang="ts">
import type { FplSquadView, SquadSlot } from '../../../lib/types/squad'
import { groupStartersByLine } from '../../../lib/engine/squad'

const props = withDefaults(defineProps<{
  squad?: FplSquadView
  size?: 'sm' | 'md'
  selectedElementId?: number | null
}>(), {
  size: 'md',
  selectedElementId: null,
})

const emit = defineEmits<{
  select: [player: SquadSlot]
}>()

const lines = computed(() => groupStartersByLine(props.squad?.starters ?? []))
</script>

<template>
  <div class="space-y-2">
    <div
      :class="[
        'relative overflow-hidden rounded-md border border-white/10 shadow-card',
        size === 'sm' ? 'min-h-[22rem] sm:min-h-[26rem]' : 'min-h-[26rem] sm:min-h-[32rem]',
      ]"
    >
      <PitchMarkings />
      <div
        v-if="squad?.starters.length"
        class="relative z-10 flex h-full flex-col justify-between px-2 py-5 sm:px-4 sm:py-6"
        :style="{ minHeight: size === 'sm' ? '22rem' : '26rem' }"
      >
        <div class="flex justify-evenly">
          <PitchPlayer
            v-for="player in lines.fwd"
            :key="player.elementId"
            :player="player"
            :size="size"
            :selected="selectedElementId === player.elementId"
            @select="emit('select', $event)"
          />
        </div>
        <div class="flex justify-evenly">
          <PitchPlayer
            v-for="player in lines.mid"
            :key="player.elementId"
            :player="player"
            :size="size"
            :selected="selectedElementId === player.elementId"
            @select="emit('select', $event)"
          />
        </div>
        <div class="flex justify-evenly">
          <PitchPlayer
            v-for="player in lines.def"
            :key="player.elementId"
            :player="player"
            :size="size"
            :selected="selectedElementId === player.elementId"
            @select="emit('select', $event)"
          />
        </div>
        <div class="flex justify-evenly">
          <PitchPlayer
            v-for="player in lines.gkp"
            :key="player.elementId"
            :player="player"
            :size="size"
            :selected="selectedElementId === player.elementId"
            @select="emit('select', $event)"
          />
        </div>
      </div>
      <p
        v-else
        class="relative z-10 flex min-h-[22rem] items-center justify-center px-4 text-center font-stats text-label tracking-kicker text-silver uppercase"
      >
        Squad not available
      </p>
    </div>

    <div v-if="squad?.bench.length" class="rounded-md border border-cyan/15 bg-navy-800/80 px-3 py-3">
      <p class="mb-2 font-stats text-kicker tracking-kicker text-silver uppercase">
        Substitutes
      </p>
      <div class="flex justify-evenly gap-2">
        <PitchPlayer
          v-for="player in squad.bench"
          :key="player.elementId"
          :player="player"
          :size="size"
          :selected="selectedElementId === player.elementId"
          @select="emit('select', $event)"
        />
      </div>
    </div>
  </div>
</template>
