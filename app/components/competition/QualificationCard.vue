<script setup lang="ts">
import type { GroupScenarios } from '../../../lib/types/competition'
import { getPlayer } from '../../../data/players'

defineProps<{
  scenarios: GroupScenarios
}>()

function tone(status: GroupScenarios['lines'][number]['status']) {
  if (status === 'qualified') return 'text-star'
  if (status === 'eliminated') return 'text-silver-dim'
  return 'text-cyan'
}
</script>

<template>
  <div class="rounded-md border border-cyan/20 bg-navy-800/60 px-4 py-3">
    <p class="mb-3 font-stats text-kicker tracking-kicker text-silver uppercase">
      Qualification
    </p>
    <p
      v-if="!scenarios.enumerated"
      class="font-stats text-label text-silver"
    >
      {{ scenarios.placeholder ?? 'Too early to call' }}
    </p>
    <ul v-else class="space-y-2">
      <li
        v-for="line in scenarios.lines"
        :key="line.playerId"
        class="flex items-start justify-between gap-3 font-stats text-label"
      >
        <NuxtLink
          :to="`/team/${line.playerId}`"
          class="min-w-0 truncate text-white hover:text-cyan"
        >
          {{ getPlayer(line.playerId).name }}
        </NuxtLink>
        <span :class="['max-w-[60%] text-right', tone(line.status)]">
          {{ line.message }}
        </span>
      </li>
    </ul>
    <p
      v-if="scenarios.enumerated && scenarios.remainingFixtures > 0"
      class="mt-3 font-stats text-kicker tracking-kicker text-silver-dim uppercase"
    >
      Remaining fixtures modelled as 1–0 or 0–0
    </p>
  </div>
</template>
