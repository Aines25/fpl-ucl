<script setup lang="ts">
import { ArrowDown, ArrowUp, ChevronDown, Minus } from '@lucide/vue'
import { activeCompetitionIds } from '../../lib/engine/qualification'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const { league, status } = useLeague()
const { snapshot } = useCompetition()

const expandedEntryId = ref<number | null>(null)
const gameweek = computed(() => snapshot.value?.currentGameweek ?? 1)
const { squad, loading, error } = useEntrySquad(expandedEntryId, gameweek)
const stillInUcl = computed(() => {
  if (!snapshot.value) return new Set<number>()
  return activeCompetitionIds(snapshot.value.standings, snapshot.value.knockout)
})

useHead({
  title: 'League · Champions League',
})

useSeoMeta({
  ogTitle: () => league.value?.name ?? 'Classic league',
  ogDescription: 'Overall FPL mini-league standings, including managers outside the Champions League groups.',
})

function movement(rank: number, lastRank: number | null) {
  if (!lastRank) return 0
  return lastRank - rank
}

function isStillInUcl(playerId: number | null) {
  return Boolean(playerId && stillInUcl.value.has(playerId))
}

function toggleRow(entryId: number) {
  if (expandedEntryId.value === entryId) {
    expandedEntryId.value = null
    return
  }
  expandedEntryId.value = entryId
}

function onRowKeydown(event: KeyboardEvent, entryId: number) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    toggleRow(entryId)
  }
}
</script>

<template>
  <div>
    <SectionHeading
      kicker="Fantasy Premier League"
      :title="league?.name ?? 'Classic league'"
    />

    <p class="mb-6 max-w-2xl text-silver">
      The overall mini-league. Separate from the Champions League groups, every manager appears here, including those not in the tournament. Click a row to open their squad, transfers and pitch without leaving the table.
    </p>

    <p v-if="status === 'pending' && !league" class="font-stats text-silver uppercase tracking-kicker">
      Loading league…
    </p>

    <template v-else>
      <p class="mb-3 flex items-center gap-2 font-stats text-kicker tracking-kicker text-silver uppercase">
        <span class="inline-block size-3 rounded-sm bg-star/30 ring-1 ring-star/40" />
        Gold rows are still in the Champions League
      </p>

      <div class="overflow-hidden rounded-md border border-cyan/20 bg-navy-800/80 shadow-card">
        <Table class="font-stats text-label">
          <TableHeader>
            <TableRow class="border-cyan/15 hover:bg-transparent">
              <TableHead class="w-10 text-silver">#</TableHead>
              <TableHead class="w-8 text-silver" />
              <TableHead class="text-silver">Manager</TableHead>
              <TableHead class="hidden text-silver sm:table-cell">Team</TableHead>
              <TableHead class="text-silver">Captains</TableHead>
              <TableHead class="text-right text-silver">Transfers</TableHead>
              <TableHead class="text-right text-silver">GW</TableHead>
              <TableHead class="text-right text-silver">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <template v-for="row in league?.standings ?? []" :key="row.entryId">
              <TableRow
                :class="[
                  'cursor-pointer border-cyan/10',
                  isStillInUcl(row.competitionPlayerId) ? 'bg-star/8' : '',
                  expandedEntryId === row.entryId ? 'bg-cyan/10' : '',
                ]"
                role="button"
                tabindex="0"
                :aria-expanded="expandedEntryId === row.entryId"
                @click="toggleRow(row.entryId)"
                @keydown="onRowKeydown($event, row.entryId)"
              >
                <TableCell class="text-silver">{{ row.rank }}</TableCell>
                <TableCell class="text-center">
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
                <TableCell class="font-medium text-white">
                  <span class="inline-flex items-center gap-2">
                    {{ row.playerName }}
                    <ChevronDown
                      class="size-3.5 text-silver-dim transition-transform"
                      :class="expandedEntryId === row.entryId ? 'rotate-180 text-cyan' : ''"
                    />
                  </span>
                </TableCell>
                <TableCell class="hidden text-silver sm:table-cell">
                  {{ row.entryName }}
                </TableCell>
                <TableCell class="whitespace-normal text-white">
                  <p>
                    {{ row.captain ?? '—' }}
                    <span class="ml-1 font-stats text-kicker tracking-kicker text-cyan uppercase">C</span>
                  </p>
                  <p class="text-silver">
                    {{ row.viceCaptain ?? '—' }}
                    <span class="ml-1 font-stats text-kicker tracking-kicker text-silver-dim uppercase">V</span>
                  </p>
                </TableCell>
                <TableCell class="text-right text-white">
                  {{ row.transfers ?? '—' }}
                </TableCell>
                <TableCell class="text-right text-white">{{ row.eventTotal }}</TableCell>
                <TableCell class="text-right text-star">{{ row.total }}</TableCell>
              </TableRow>
              <TableRow
                v-if="expandedEntryId === row.entryId"
                class="border-cyan/10 hover:bg-transparent"
              >
                <TableCell colspan="8" class="whitespace-normal p-0 align-top">
                  <div class="animate-in fade-in slide-in-from-top-2 space-y-3 bg-navy-900/60 p-4 duration-200">
                    <TeamPitchPanel
                      :squad="squad"
                      :loading="loading"
                      :error="error"
                      scoring="official"
                      layout="split"
                      size="sm"
                    />
                    <NuxtLink
                      v-if="row.competitionPlayerId"
                      :to="`/team/${row.competitionPlayerId}`"
                      class="inline-flex font-stats text-kicker tracking-kicker text-cyan uppercase hover:text-white"
                      @click.stop
                    >
                      Open team page
                    </NuxtLink>
                  </div>
                </TableCell>
              </TableRow>
            </template>
          </TableBody>
        </Table>
      </div>
    </template>
  </div>
</template>
