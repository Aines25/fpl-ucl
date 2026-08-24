<script setup lang="ts">
import {
  FDR_SHORT_WINDOW,
  clampFdr,
  formatFdrAverage,
  formatFdrOpponent,
  sliceFdrGrid,
  sortFdrRows,
} from '../../../lib/engine/fdr'
import type { FdrRating, FdrSort } from '../../../lib/types/fdr'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const { data, status, error } = useFdr()

const horizon = ref<'next' | 'season'>('next')
const sortBy = ref<FdrSort>('easiest')
const legendMid: FdrRating[] = [2, 3, 4]

const grid = computed(() => {
  if (!data.value?.teams.length) return null
  const sliced = horizon.value === 'next'
    ? sliceFdrGrid(data.value, FDR_SHORT_WINDOW)
    : data.value
  return {
    ...sliced,
    teams: sortFdrRows(sliced.teams, sortBy.value),
  }
})

function cellClass(rating: FdrRating) {
  return {
    1: 'bg-fdr-1 text-white',
    2: 'bg-fdr-2 text-navy-950',
    3: 'bg-fdr-3 text-white',
    4: 'bg-fdr-4 text-white',
    5: 'bg-fdr-5 text-white',
  }[rating]
}

function averageClass(average: number | null) {
  if (average == null) return 'bg-fdr-blank text-silver-dim'
  return cellClass(clampFdr(Math.round(average)))
}
</script>

<template>
  <div class="space-y-4">
    <p class="font-stats text-label text-silver">
      Official FPL fixture difficulty for Premier League clubs. 1 is easiest, 5 is hardest.
      Blank gameweeks are a dash; double gameweeks stack in one cell.
    </p>

    <div class="flex flex-wrap items-center gap-3">
      <Tabs :model-value="horizon" @update:model-value="horizon = String($event) === 'season' ? 'season' : 'next'">
        <TabsList class="h-auto rounded-md bg-navy-900 p-1">
          <TabsTrigger
            value="next"
            class="rounded-sm px-3 py-2 font-stats text-kicker tracking-kicker uppercase data-[state=active]:bg-navy-700 data-[state=active]:text-cyan"
          >
            Next {{ FDR_SHORT_WINDOW }}
          </TabsTrigger>
          <TabsTrigger
            value="season"
            class="rounded-sm px-3 py-2 font-stats text-kicker tracking-kicker uppercase data-[state=active]:bg-navy-700 data-[state=active]:text-cyan"
          >
            Remaining
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <Tabs :model-value="sortBy" @update:model-value="sortBy = String($event) === 'name' ? 'name' : 'easiest'">
        <TabsList class="h-auto rounded-md bg-navy-900 p-1">
          <TabsTrigger
            value="easiest"
            class="rounded-sm px-3 py-2 font-stats text-kicker tracking-kicker uppercase data-[state=active]:bg-navy-700 data-[state=active]:text-cyan"
          >
            Easiest
          </TabsTrigger>
          <TabsTrigger
            value="name"
            class="rounded-sm px-3 py-2 font-stats text-kicker tracking-kicker uppercase data-[state=active]:bg-navy-700 data-[state=active]:text-cyan"
          >
            A–Z
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>

    <p v-if="status === 'pending'" class="font-stats uppercase tracking-kicker text-silver">
      Loading FDR…
    </p>
    <p v-else-if="error || !grid" class="font-stats text-label text-silver">
      Fixture difficulty is unavailable right now.
    </p>

    <div
      v-else
      class="overflow-hidden rounded-md border border-cyan/20 bg-navy-800/80 shadow-card"
    >
      <Table class="font-stats text-kicker">
        <TableHeader>
          <TableRow class="border-cyan/15 hover:bg-transparent">
            <TableHead
              class="sticky left-0 z-20 min-w-16 border-r border-cyan/15 bg-navy-800 text-silver"
            >
              Club
            </TableHead>
            <TableHead
              v-for="gameweek in grid.gameweeks"
              :key="gameweek"
              class="min-w-18 bg-navy-800 text-center text-silver"
            >
              GW{{ gameweek }}
            </TableHead>
            <TableHead class="min-w-12 bg-navy-800 text-right text-silver">
              Avg
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow
            v-for="team in grid.teams"
            :key="team.teamId"
            class="border-cyan/10 hover:bg-transparent"
          >
            <TableCell
              class="sticky left-0 z-10 border-r border-cyan/15 bg-navy-800 font-medium text-white"
            >
              {{ team.shortName }}
            </TableCell>
            <TableCell
              v-for="cell in team.cells"
              :key="cell.gameweek"
              class="p-0.5"
            >
              <div
                v-if="!cell.fixtures.length"
                class="flex min-h-10 items-center justify-center bg-fdr-blank text-silver-dim"
              >
                —
              </div>
              <div v-else class="flex min-h-10 flex-col gap-px">
                <div
                  v-for="(fixture, index) in cell.fixtures"
                  :key="`${fixture.opponentId}-${index}`"
                  :class="[
                    'flex flex-1 items-center justify-center px-1 py-1 text-center leading-tight',
                    cellClass(fixture.difficulty),
                  ]"
                  :title="`GW${cell.gameweek} ${formatFdrOpponent(fixture)} · FDR ${fixture.difficulty}`"
                >
                  {{ formatFdrOpponent(fixture) }}
                </div>
              </div>
            </TableCell>
            <TableCell class="p-0.5">
              <div
                :class="[
                  'flex min-h-10 items-center justify-end px-2 tabular-nums',
                  averageClass(team.average),
                ]"
              >
                {{ formatFdrAverage(team.average) }}
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <ul class="flex flex-wrap items-center gap-2 font-stats text-kicker tracking-kicker uppercase text-silver">
      <li class="flex items-center gap-1.5">
        <span class="size-3 rounded-sm bg-fdr-1" />
        Easy
      </li>
      <li v-for="rating in legendMid" :key="rating" class="flex items-center gap-1.5">
        <span :class="['size-3 rounded-sm', cellClass(rating)]" />
        {{ rating }}
      </li>
      <li class="flex items-center gap-1.5">
        <span class="size-3 rounded-sm bg-fdr-5" />
        Hard
      </li>
    </ul>
  </div>
</template>
