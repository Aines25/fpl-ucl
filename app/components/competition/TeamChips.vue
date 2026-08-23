<script setup lang="ts">
import type { FplSquadView } from '../../../lib/types/squad'

const props = defineProps<{
  squad: FplSquadView
}>()

const used = computed(() => props.squad.chipsUsed ?? [])
const remaining = computed(() => props.squad.chipsRemaining ?? [])
</script>

<template>
  <div class="rounded-md border border-cyan/20 bg-navy-800/80 p-4 shadow-card">
    <p class="font-stats text-kicker tracking-kicker text-silver uppercase">
      Chips
    </p>

    <div class="mt-3 grid gap-4 sm:grid-cols-2">
      <div>
        <p class="font-stats text-kicker tracking-kicker text-cyan uppercase">
          Used
        </p>
        <p v-if="!used.length" class="mt-2 font-stats text-label text-silver">
          None played yet
        </p>
        <ul v-else class="mt-2 divide-y divide-cyan/10">
          <li
            v-for="chip in used"
            :key="`${chip.name}-${chip.event}`"
            class="flex items-center justify-between gap-3 py-1.5 font-stats text-label"
          >
            <p class="min-w-0 truncate text-white">{{ chip.label }}</p>
            <p class="shrink-0 text-silver">GW {{ chip.event }}</p>
          </li>
        </ul>
      </div>

      <div>
        <p class="font-stats text-kicker tracking-kicker text-cyan uppercase">
          Remaining
        </p>
        <p v-if="!remaining.length" class="mt-2 font-stats text-label text-silver">
          None left this half
        </p>
        <ul v-else class="mt-2 divide-y divide-cyan/10">
          <li
            v-for="chip in remaining"
            :key="`${chip.half}-${chip.name}`"
            class="py-1.5 font-stats text-label text-white"
          >
            {{ chip.label }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
