<script setup lang="ts">
import type { DifferentialRow, DifferentialSummary } from '../../../lib/engine/differentials'
import { formatUpcomingFixture } from '../../../lib/engine/club-fixtures'

const PREVIEW = 4

const props = defineProps<{
  homeName: string
  awayName: string
  summary: DifferentialSummary
}>()

const expanded = ref(false)

const scoringRows = computed(() => props.summary.rows.filter((row) => row.swing !== 0))
const pendingRows = computed(() =>
  props.summary.rows
    .filter((row) => row.pending && row.swing === 0)
    .sort((left, right) =>
      (left.fixture?.kickoff ?? '').localeCompare(right.fixture?.kickoff ?? '')
      || left.webName.localeCompare(right.webName),
    ),
)
const blankRows = computed(() =>
  props.summary.rows.filter((row) => row.swing === 0 && !row.pending),
)
const hasHits = computed(() =>
  Boolean(props.summary.homeTransferCost || props.summary.awayTransferCost),
)

const visibleScoring = computed(() => {
  if (expanded.value) return scoringRows.value
  return scoringRows.value.slice(0, PREVIEW)
})

const hiddenCount = computed(() =>
  Math.max(0, scoringRows.value.length - PREVIEW) + blankRows.value.length,
)

const empty = computed(() =>
  !scoringRows.value.length && !pendingRows.value.length && !blankRows.value.length && !hasHits.value,
)

const verdict = computed(() => {
  const swing = props.summary.netSwing
  if (swing === 0) return 'Level on differentials'
  if (swing > 0) return `${props.homeName} leads by ${swing}`
  return `${props.awayName} leads by ${Math.abs(swing)}`
})

function helpedBy(swing: number) {
  if (swing > 0) return props.homeName
  if (swing < 0) return props.awayName
  return ''
}

function ownedBy(row: DifferentialRow) {
  if (row.kind === 'home') return props.homeName
  if (row.kind === 'away') return props.awayName
  return ''
}

function magnitude(swing: number) {
  if (swing === 0) return '0'
  return `+${Math.abs(swing)}`
}

function swingClass(swing: number) {
  if (swing > 0) return 'text-star'
  if (swing < 0) return 'text-live'
  return 'text-silver'
}

function rowKey(row: DifferentialRow) {
  return row.elementId
}
</script>

<template>
  <section class="rounded-md border border-cyan/20 bg-navy-800/80 p-4 shadow-card">
    <p class="font-stats text-kicker tracking-kicker text-cyan uppercase">
      Differentials
    </p>
    <h3 class="mt-1 font-display text-sm tracking-wide text-white uppercase sm:text-base">
      {{ verdict }}
    </h3>

    <p v-if="empty" class="mt-3 font-stats text-label text-silver">
      Same counting XI
    </p>

    <ul
      v-else-if="visibleScoring.length || pendingRows.length || hasHits || expanded"
      class="mt-3 divide-y divide-cyan/10"
    >
      <li
        v-for="row in visibleScoring"
        :key="rowKey(row)"
        class="flex items-center justify-between gap-3 py-2 font-stats text-label"
      >
        <p class="min-w-0 truncate text-white">{{ row.webName }}</p>
        <p class="shrink-0 text-right tabular-nums">
          <span :class="swingClass(row.swing)">{{ magnitude(row.swing) }}</span>
          <span v-if="helpedBy(row.swing)" class="ml-2 text-silver">
            {{ helpedBy(row.swing) }}
          </span>
        </p>
      </li>
      <li
        v-for="row in pendingRows"
        :key="`pending-${rowKey(row)}`"
        class="flex items-center justify-between gap-3 py-2 font-stats text-label"
      >
        <p class="min-w-0 truncate text-white">{{ row.webName }}</p>
        <p class="max-w-[65%] text-right text-silver">
          <span>{{ row.fixture ? formatUpcomingFixture(row.fixture) : 'Yet to play' }}</span>
          <span v-if="ownedBy(row)" class="ml-2">{{ ownedBy(row) }}</span>
        </p>
      </li>
      <li
        v-if="hasHits"
        class="flex items-center justify-between gap-3 py-2 font-stats text-label"
      >
        <p class="text-silver">Hits</p>
        <p class="shrink-0 text-right tabular-nums">
          <span :class="swingClass(summary.transferSwing)">
            {{ magnitude(summary.transferSwing) }}
          </span>
          <span v-if="helpedBy(summary.transferSwing)" class="ml-2 text-silver">
            {{ helpedBy(summary.transferSwing) }}
          </span>
        </p>
      </li>
      <li
        v-for="row in expanded ? blankRows : []"
        :key="`blank-${rowKey(row)}`"
        class="flex items-center justify-between gap-3 py-2 font-stats text-label"
      >
        <p class="min-w-0 truncate text-white">{{ row.webName }}</p>
        <p class="shrink-0 text-silver tabular-nums">0</p>
      </li>
    </ul>

    <button
      v-if="hiddenCount"
      type="button"
      class="mt-2 font-stats text-kicker tracking-kicker text-cyan uppercase hover:text-white"
      @click="expanded = !expanded"
    >
      {{ expanded ? 'Show less' : `Show ${hiddenCount} more` }}
    </button>
  </section>
</template>
