<script setup lang="ts">
import type { GroupId, StandingRow } from '../../../lib/types/competition'
import { getPlayer } from '../../../data/players'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

defineProps<{
  group: GroupId
  rows: StandingRow[]
}>()

function signed(value: number) {
  if (value > 0) return `+${value}`
  return String(value)
}
</script>

<template>
  <div class="overflow-hidden rounded-md border border-cyan/20 bg-navy-800/80 shadow-card">
    <div class="flex items-center gap-3 border-b border-cyan/15 px-4 py-3">
      <GroupStripe :group="group" class="h-6" />
      <h3 class="font-display tracking-display text-white uppercase">
        Group {{ group }}
      </h3>
    </div>
    <Table class="font-stats text-label">
      <TableHeader>
        <TableRow class="border-cyan/15 hover:bg-transparent">
          <TableHead class="w-8 text-silver">Pos</TableHead>
          <TableHead class="text-silver">Player</TableHead>
          <TableHead class="text-right text-silver">P</TableHead>
          <TableHead class="hidden text-right text-silver sm:table-cell">W</TableHead>
          <TableHead class="hidden text-right text-silver sm:table-cell">D</TableHead>
          <TableHead class="hidden text-right text-silver sm:table-cell">L</TableHead>
          <TableHead class="hidden text-right text-silver md:table-cell">PF</TableHead>
          <TableHead class="hidden text-right text-silver md:table-cell">PA</TableHead>
          <TableHead class="text-right text-silver">+/-</TableHead>
          <TableHead class="text-right text-silver">Pts</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow
          v-for="row in rows"
          :key="row.playerId"
          :class="[
            'cursor-pointer border-cyan/10',
            row.qualifyingZone ? 'bg-star/8' : '',
            row.eliminated ? 'opacity-50' : '',
          ]"
          @click="navigateTo(`/team/${row.playerId}`)"
        >
          <TableCell class="text-silver">{{ row.position }}</TableCell>
          <TableCell class="font-medium text-white">
            <NuxtLink
              :to="`/team/${row.playerId}`"
              :prefetch="false"
              class="hover:text-cyan"
              @click.stop
            >
              {{ getPlayer(row.playerId).name }}
            </NuxtLink>
          </TableCell>
          <TableCell class="text-right text-white">{{ row.played }}</TableCell>
          <TableCell class="hidden text-right text-white sm:table-cell">{{ row.won }}</TableCell>
          <TableCell class="hidden text-right text-white sm:table-cell">{{ row.drawn }}</TableCell>
          <TableCell class="hidden text-right text-white sm:table-cell">{{ row.lost }}</TableCell>
          <TableCell class="hidden text-right text-white md:table-cell">{{ row.pointsFor }}</TableCell>
          <TableCell class="hidden text-right text-white md:table-cell">{{ row.pointsAgainst }}</TableCell>
          <TableCell class="text-right text-white">{{ signed(row.difference) }}</TableCell>
          <TableCell class="text-right text-star">{{ row.points }}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>
