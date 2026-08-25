<script setup lang="ts">
import type { OwnedPlayerRow } from '../../../lib/types/league'
import { formatOwnershipPercent } from '../../../lib/engine/insights'

const props = defineProps<{
  title: string
  rows: OwnedPlayerRow[]
  countKey?: 'owners' | 'captains'
}>()

function bandClass(band: OwnedPlayerRow['band']) {
  if (band === 'template') return 'text-star'
  if (band === 'popular') return 'text-cyan'
  return 'text-silver'
}
</script>

<template>
  <section class="rounded-md border border-cyan/20 bg-navy-800/80 shadow-card">
    <div class="border-b border-cyan/15 px-4 py-3">
      <p class="font-stats text-kicker tracking-kicker text-cyan uppercase">
        {{ title }}
      </p>
    </div>
    <p v-if="!rows.length" class="px-4 py-6 font-stats text-label text-silver uppercase">
      Picks lock after the deadline.
    </p>
    <ol v-else class="divide-y divide-cyan/10">
      <li
        v-for="(row, index) in rows"
        :key="row.elementId"
        class="flex items-center gap-3 px-4 py-2.5"
      >
        <span class="w-6 font-stats text-label text-silver tabular-nums">{{ index + 1 }}</span>
        <img
          v-if="row.photoUrl"
          :src="row.photoUrl"
          alt=""
          class="h-8 w-6 object-contain object-bottom"
          loading="lazy"
          referrerpolicy="no-referrer"
        >
        <div class="min-w-0 flex-1">
          <p class="truncate font-stats text-label text-white">{{ row.webName }}</p>
          <p class="font-stats text-kicker tracking-kicker uppercase" :class="bandClass(row.band)">
            {{ row.band }} · {{ formatOwnershipPercent(row.percent) }}
          </p>
        </div>
        <p class="font-stats text-label text-star tabular-nums">
          {{ countKey === 'captains' ? row.captains : row.owners }}
        </p>
      </li>
    </ol>
  </section>
</template>
