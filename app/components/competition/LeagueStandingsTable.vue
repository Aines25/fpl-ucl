<script setup lang="ts">
import { ArrowDown, ArrowUp, ChevronDown, Minus } from '@lucide/vue'
import { chipLabel } from '../../../lib/engine/squad'
import type { LeagueStandingRow } from '../../../lib/types/league'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type LeagueMobileColumns = 'points' | 'picks'

const props = withDefaults(defineProps<{
  standings: LeagueStandingRow[]
  stillInUcl: Set<number>
  expandedEntryId: number | null
  hideMobileToggle?: boolean
  mobileColumns?: LeagueMobileColumns
}>(), {
  hideMobileToggle: false,
  mobileColumns: undefined,
})

const emit = defineEmits<{
  toggle: [entryId: number]
}>()

const localColumns = ref<LeagueMobileColumns>('points')
const mobileColumns = computed(() => props.mobileColumns ?? localColumns.value)

function movement(rank: number, lastRank: number | null) {
  if (!lastRank) return 0
  return lastRank - rank
}

function isStillInUcl(playerId: number | null) {
  return Boolean(playerId && props.stillInUcl.has(playerId))
}

function onRowKeydown(event: KeyboardEvent, entryId: number) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    emit('toggle', entryId)
  }
}

function mobileCol(view: LeagueMobileColumns) {
  return mobileColumns.value === view ? '' : 'hidden sm:table-cell'
}

function rowChip(chip: string | null) {
  return chipLabel(chip) ?? 'No chip used'
}
</script>

<template>
  <div>
    <div
      v-if="!hideMobileToggle"
      class="mb-3 grid grid-cols-2 gap-1 rounded-md border border-cyan/20 bg-navy-900/80 p-1 sm:hidden"
      role="group"
      aria-label="League columns"
    >
      <button
        type="button"
        class="rounded-sm px-2 py-1.5 font-stats text-kicker tracking-kicker uppercase"
        :class="mobileColumns === 'points' ? 'bg-cyan/20 text-white' : 'text-silver'"
        :aria-pressed="mobileColumns === 'points'"
        @click="localColumns = 'points'"
      >
        GW / Total
      </button>
      <button
        type="button"
        class="rounded-sm px-2 py-1.5 font-stats text-kicker tracking-kicker uppercase"
        :class="mobileColumns === 'picks' ? 'bg-cyan/20 text-white' : 'text-silver'"
        :aria-pressed="mobileColumns === 'picks'"
        @click="localColumns = 'picks'"
      >
        Captains / Transfers
      </button>
    </div>

    <div class="overflow-hidden rounded-md border border-cyan/20 bg-navy-800/80 shadow-card">
      <Table class="font-stats text-label">
        <TableHeader>
          <TableRow class="border-cyan/15 hover:bg-transparent">
            <TableHead class="w-10 text-silver">#</TableHead>
            <TableHead :class="['w-8 text-silver', mobileCol('points')]" />
            <TableHead class="text-silver">Manager</TableHead>
            <TableHead :class="['text-silver', mobileCol('picks')]">Captains</TableHead>
            <TableHead :class="['text-right text-silver', mobileCol('picks')]">Transfers</TableHead>
            <TableHead :class="['text-right text-silver', mobileCol('points')]">GW</TableHead>
            <TableHead :class="['text-right text-silver', mobileCol('points')]">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <template v-for="row in standings" :key="row.entryId">
            <TableRow
              :class="[
                'cursor-pointer border-cyan/10',
                isStillInUcl(row.competitionPlayerId) ? 'bg-star/8' : '',
                expandedEntryId === row.entryId ? 'bg-cyan/10' : '',
              ]"
              role="button"
              tabindex="0"
              :aria-expanded="expandedEntryId === row.entryId"
              @click="emit('toggle', row.entryId)"
              @keydown="onRowKeydown($event, row.entryId)"
            >
              <TableCell class="text-silver">{{ row.rank }}</TableCell>
              <TableCell :class="['text-center', mobileCol('points')]">
                <ArrowUp
                  v-if="movement(row.rank, row.lastRank) > 0"
                  class="mx-auto size-3.5 text-final"
                />
                <ArrowDown
                  v-else-if="movement(row.rank, row.lastRank) < 0"
                  class="mx-auto size-3.5 text-live"
                />
                <Minus v-else class="mx-auto size-3.5 text-silver-dim" />
              </TableCell>
              <TableCell class="max-w-40 min-w-0 whitespace-normal font-medium text-white sm:max-w-none">
                <p class="truncate text-[11px] leading-tight font-normal text-silver">
                  {{ row.entryName }}
                </p>
                <span class="inline-flex items-center gap-2">
                  {{ row.playerName }}
                  <ChevronDown
                    class="size-3.5 text-silver-dim transition-transform"
                    :class="expandedEntryId === row.entryId ? 'rotate-180 text-cyan' : ''"
                  />
                </span>
                <p class="text-[11px] leading-tight font-normal text-silver-dim">
                  {{ rowChip(row.chip) }}
                </p>
              </TableCell>
              <TableCell :class="['whitespace-normal text-white', mobileCol('picks')]">
                <p>
                  {{ row.captain ?? '—' }}
                  <span class="ml-1 font-stats text-kicker tracking-kicker text-cyan uppercase">C</span>
                </p>
                <p class="text-silver">
                  {{ row.viceCaptain ?? '—' }}
                  <span class="ml-1 font-stats text-kicker tracking-kicker text-silver-dim uppercase">V</span>
                </p>
              </TableCell>
              <TableCell :class="['text-right text-white', mobileCol('picks')]">
                {{ row.transfers ?? '—' }}
              </TableCell>
              <TableCell :class="['text-right text-white', mobileCol('points')]">
                {{ row.eventTotal }}
              </TableCell>
              <TableCell :class="['text-right text-star', mobileCol('points')]">
                {{ row.total }}
              </TableCell>
            </TableRow>
            <TableRow
              v-if="expandedEntryId === row.entryId"
              class="border-cyan/10 hover:bg-transparent"
            >
              <TableCell colspan="7" class="whitespace-normal p-0 align-top">
                <div class="animate-in fade-in slide-in-from-top-2 space-y-3 bg-navy-900/60 p-4 duration-200">
                  <slot name="expanded" :row="row" />
                </div>
              </TableCell>
            </TableRow>
          </template>
        </TableBody>
      </Table>
    </div>
  </div>
</template>
