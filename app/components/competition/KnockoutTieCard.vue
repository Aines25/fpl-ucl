<script setup lang="ts">
import type { KnockoutTieConfig, KnockoutTieResult, TournamentFixture } from '../../../lib/types/competition'
import { getPlayer } from '../../../data/players'
import { Card, CardContent } from '@/components/ui/card'

const props = defineProps<{
  tie: KnockoutTieConfig
  result?: KnockoutTieResult
  fixtures: TournamentFixture[]
  fixtureResults: Map<string, import('../../../lib/types/competition').FixtureResult>
}>()

function nameFor(id: number | null) {
  if (!id) return 'TBD'
  return getPlayer(id).name
}

const legs = computed(() => {
  return [props.tie.firstLegFixtureId, props.tie.secondLegFixtureId]
    .filter((id): id is string => Boolean(id))
    .map((id) => ({
      fixture: props.fixtures.find((fixture) => fixture.id === id),
      result: props.fixtureResults.get(id),
    }))
})
</script>

<template>
  <Card class="gap-0 overflow-hidden rounded-md border-cyan/20 bg-navy-800/80 py-0 shadow-card">
    <CardContent class="p-4">
      <div class="mb-3 flex items-center justify-between">
        <p class="font-stats text-kicker tracking-kicker text-cyan uppercase">
          {{ tie.stage.replaceAll('-', ' ') }}
        </p>
        <StatusBadge :status="result?.status ?? 'scheduled'" />
      </div>
      <div class="flex items-center justify-between gap-3">
        <p class="font-display text-sm tracking-wide text-white uppercase">
          {{ nameFor(tie.playerOneId) }}
        </p>
        <div class="flex items-center gap-3">
          <ScoreDisplay :value="result?.playerOneAggregate ?? null" :winner="result?.winnerId === tie.playerOneId" />
          <span class="font-stats text-kicker tracking-kicker text-silver uppercase">agg</span>
          <ScoreDisplay :value="result?.playerTwoAggregate ?? null" :winner="result?.winnerId === tie.playerTwoId" />
        </div>
        <p class="font-display text-sm tracking-wide text-white uppercase">
          {{ nameFor(tie.playerTwoId) }}
        </p>
      </div>
      <ul v-if="legs.length" class="mt-3 space-y-1 font-stats text-label text-silver">
        <li v-for="(leg, index) in legs" :key="index">
          Leg {{ index + 1 }}
          <template v-if="leg.result?.homeScore !== null && leg.result?.homeScore !== undefined">
            · {{ leg.result.homeScore }}–{{ leg.result.awayScore }}
          </template>
          <template v-else>
            · GW {{ leg.fixture?.fplGameweek ?? '–' }}
          </template>
        </li>
      </ul>
      <p v-if="result?.decidedByTiebreak" class="mt-2 font-stats text-kicker tracking-kicker text-star uppercase">
        Decided by FPL cup tie-break
      </p>
    </CardContent>
  </Card>
</template>
