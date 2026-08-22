<script setup lang="ts">
import type { FixtureResult, TournamentFixture } from '../../../lib/types/competition'
import { getPlayer } from '../../../data/players'
import { Card, CardContent } from '@/components/ui/card'

const props = defineProps<{
  fixture: TournamentFixture
  result?: FixtureResult
}>()

const home = computed(() => getPlayer(props.fixture.homeId))
const away = computed(() => getPlayer(props.fixture.awayId))
const status = computed(() => props.result?.status ?? 'scheduled')
const homeWins = computed(() => props.result?.winnerId === props.fixture.homeId)
const awayWins = computed(() => props.result?.winnerId === props.fixture.awayId)
</script>

<template>
  <Card class="gap-0 overflow-hidden rounded-md border-cyan/20 bg-navy-800/80 py-0 shadow-card">
    <CardContent class="flex gap-0 p-0">
      <GroupStripe v-if="fixture.group" :group="fixture.group" />
      <div class="flex flex-1 flex-col gap-3 p-4">
        <div class="flex items-center justify-between gap-3">
          <p class="font-stats text-kicker tracking-kicker text-silver uppercase">
            {{ fixture.group ? `Group ${fixture.group}` : fixture.stage.replaceAll('-', ' ') }}
            · GW {{ fixture.fplGameweek }}
          </p>
          <StatusBadge :status="status" />
        </div>
        <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div class="min-w-0 text-left">
            <p class="truncate font-display text-sm tracking-wide text-white uppercase">
              {{ home.name }}
            </p>
          </div>
          <div class="flex items-center gap-3">
            <ScoreDisplay :value="result?.homeScore ?? null" :winner="homeWins" />
            <span class="font-stats text-kicker tracking-kicker text-silver uppercase">v</span>
            <ScoreDisplay :value="result?.awayScore ?? null" :winner="awayWins" />
          </div>
          <div class="min-w-0 text-right">
            <p class="truncate font-display text-sm tracking-wide text-white uppercase">
              {{ away.name }}
            </p>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
