<script setup lang="ts">
import { ArrowDown, ArrowUp, Minus } from '@lucide/vue'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const { league, status } = useLeague()

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
</script>

<template>
  <div>
    <SectionHeading
      kicker="Fantasy Premier League"
      :title="league?.name ?? 'Classic league'"
    />

    <p class="mb-6 max-w-2xl text-silver">
      The overall mini-league. Separate from the Champions League groups, every manager appears here, including those not in the tournament.
    </p>

    <p v-if="status === 'pending' && !league" class="font-stats text-silver uppercase tracking-kicker">
      Loading league…
    </p>

    <div v-else class="overflow-hidden rounded-md border border-cyan/20 bg-navy-800/80 shadow-card">
      <Table class="font-stats text-label">
        <TableHeader>
          <TableRow class="border-cyan/15 hover:bg-transparent">
            <TableHead class="w-10 text-silver">#</TableHead>
            <TableHead class="w-8 text-silver" />
            <TableHead class="text-silver">Manager</TableHead>
            <TableHead class="hidden text-silver sm:table-cell">Team</TableHead>
            <TableHead class="text-right text-silver">GW</TableHead>
            <TableHead class="text-right text-silver">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow
            v-for="row in league?.standings ?? []"
            :key="row.entryId"
            :class="[
              'border-cyan/10',
              row.competitionPlayerId ? 'bg-star/8' : '',
            ]"
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
              <NuxtLink
                v-if="row.competitionPlayerId"
                :to="`/team/${row.competitionPlayerId}`"
                class="hover:text-cyan"
              >
                {{ row.playerName }}
              </NuxtLink>
              <span v-else>{{ row.playerName }}</span>
              <span
                v-if="row.competitionPlayerId"
                class="ml-2 rounded-sm border border-star/40 bg-star/15 px-1.5 py-0.5 font-stats text-kicker tracking-kicker text-star uppercase"
              >
                UCL
              </span>
            </TableCell>
            <TableCell class="hidden text-silver sm:table-cell">
              {{ row.entryName }}
            </TableCell>
            <TableCell class="text-right text-white">{{ row.eventTotal }}</TableCell>
            <TableCell class="text-right text-star">{{ row.total }}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </div>
</template>
