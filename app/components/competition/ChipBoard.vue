<script setup lang="ts">
import { SEASON_CHIPS, chipHalf, chipLabel } from '../../../lib/engine/squad'
import type { LeagueStandingRow } from '../../../lib/types/league'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const props = defineProps<{
  standings: LeagueStandingRow[]
  stillInUcl: Set<number>
  gameweek: number
}>()

const half = computed(() => chipHalf(props.gameweek))
const headings = SEASON_CHIPS.map((name) => ({
  name,
  label: chipLabel(name) ?? name,
}))

function isStillInUcl(playerId: number | null) {
  return Boolean(playerId && props.stillInUcl.has(playerId))
}

function chipCell(row: LeagueStandingRow, name: string) {
  const used = row.chipsUsed.find((chip) => chip.name === name && chipHalf(chip.event) === half.value)
  if (used) return { kind: 'used' as const, label: `GW ${used.event}` }
  if (row.chipsRemaining.some((chip) => chip.name === name)) return { kind: 'left' as const, label: 'Left' }
  return { kind: 'unknown' as const, label: '–' }
}

const board = computed(() => props.standings.map((row) => ({
  row,
  cells: headings.map((chip) => ({ name: chip.name, ...chipCell(row, chip.name) })),
})))
</script>

<template>
  <div class="overflow-x-auto rounded-md border border-cyan/20 bg-navy-800/80 shadow-card">
    <div class="border-b border-cyan/15 px-4 py-3">
      <p class="font-stats text-kicker tracking-kicker text-cyan uppercase">
        {{ half === 'first' ? 'First half' : 'Second half' }} chips
      </p>
      <p class="mt-1 text-sm text-silver">
        Left means still available this half. Used chips show the gameweek they were played.
      </p>
    </div>
    <Table class="font-stats text-label">
      <TableHeader>
        <TableRow class="border-cyan/15 hover:bg-transparent">
          <TableHead class="text-silver">#</TableHead>
          <TableHead class="text-silver">Manager</TableHead>
          <TableHead
            v-for="chip in headings"
            :key="chip.name"
            class="text-center text-silver"
          >
            {{ chip.label }}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow
          v-for="line in board"
          :key="line.row.entryId"
          :class="[
            'border-cyan/10',
            isStillInUcl(line.row.competitionPlayerId) ? 'bg-star/8' : '',
          ]"
        >
          <TableCell class="text-silver">{{ line.row.rank }}</TableCell>
          <TableCell class="font-medium text-white">
            <NuxtLink
              v-if="line.row.competitionPlayerId"
              :to="`/team/${line.row.competitionPlayerId}`"
              class="hover:text-cyan"
            >
              {{ line.row.playerName }}
            </NuxtLink>
            <span v-else>{{ line.row.playerName }}</span>
          </TableCell>
          <TableCell
            v-for="cell in line.cells"
            :key="`${line.row.entryId}-${cell.name}`"
            class="text-center"
          >
            <span
              :class="cell.kind === 'left' ? 'text-cyan' : cell.kind === 'used' ? 'text-silver' : 'text-silver-dim'"
            >
              {{ cell.label }}
            </span>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>
