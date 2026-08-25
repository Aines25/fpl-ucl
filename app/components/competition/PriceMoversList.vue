<script setup lang="ts">
import type { PriceMoverRow } from '../../../lib/types/league'
import { formatPrice, formatPriceChange } from '../../../lib/engine/insights'

const props = defineProps<{
  title: string
  rows: PriceMoverRow[]
  empty: string
}>()
</script>

<template>
  <section class="rounded-md border border-cyan/20 bg-navy-800/80 shadow-card">
    <div class="border-b border-cyan/15 px-4 py-3">
      <p class="font-stats text-kicker tracking-kicker text-cyan uppercase">
        {{ title }}
      </p>
    </div>
    <p v-if="!rows.length" class="px-4 py-6 font-stats text-label text-silver uppercase">
      {{ empty }}
    </p>
    <ol v-else class="divide-y divide-cyan/10">
      <li
        v-for="row in rows"
        :key="row.elementId"
        class="flex items-center gap-3 px-4 py-2.5"
      >
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
          <p class="font-stats text-kicker tracking-kicker text-silver uppercase">
            {{ row.owners }} owned · {{ formatPrice(row.nowCost) }}
          </p>
        </div>
        <p
          class="font-stats text-label tabular-nums"
          :class="row.costChangeEvent > 0 ? 'text-final' : 'text-live'"
        >
          {{ formatPriceChange(row.costChangeEvent) }}
        </p>
      </li>
    </ol>
  </section>
</template>
