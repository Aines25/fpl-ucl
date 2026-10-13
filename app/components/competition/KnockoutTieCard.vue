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

function side(id: number | null, seed: 1 | 2) {
  if (!id) {
    return { name: 'TBD', mark: '–', role: seed === 1 ? 'Group winner' : 'Runner-up' }
  }
  const player = getPlayer(id)
  return {
    name: player.name,
    mark: `${player.group}${seed}`,
    role: seed === 1 ? 'Group winner' : 'Runner-up',
  }
}

const playerOne = computed(() => side(props.tie.playerOneId, 1))
const playerTwo = computed(() => side(props.tie.playerTwoId, 2))

const legs = computed(() => {
  return [props.tie.firstLegFixtureId, props.tie.secondLegFixtureId]
    .filter((id): id is string => Boolean(id))
    .map((id) => {
      const fixture = props.fixtures.find((item) => item.id === id)
      if (!fixture) return null
      const result = props.fixtureResults.get(id)
      const scored = result?.homeScore != null && result?.awayScore != null
      return {
        fixture,
        result,
        scored,
        home: getPlayer(fixture.homeId).name,
        away: getPlayer(fixture.awayId).name,
      }
    })
    .filter((leg) => leg !== null)
})
</script>

<template>
  <Card class="gap-0 rounded-md border-cyan/20 bg-navy-800/80 py-0 shadow-card">
    <CardContent class="p-4">
      <div class="mb-4 flex items-center justify-between gap-3">
        <p class="font-stats text-kicker tracking-kicker text-cyan uppercase">
          {{ playerOne.mark }} v {{ playerTwo.mark }}
        </p>
        <StatusBadge :status="result?.status ?? 'scheduled'" />
      </div>
      <div class="space-y-3">
        <div class="flex items-center justify-between gap-4">
          <div class="min-w-0">
            <p class="font-display text-base tracking-wide text-white uppercase">
              {{ playerOne.name }}
            </p>
            <p class="font-stats text-kicker tracking-kicker text-silver uppercase">
              {{ playerOne.mark }} · {{ playerOne.role }}
            </p>
          </div>
          <ScoreDisplay
            :value="result?.playerOneAggregate ?? null"
            :winner="result?.winnerId === tie.playerOneId"
          />
        </div>
        <div class="flex items-center justify-between gap-4">
          <div class="min-w-0">
            <p class="font-display text-base tracking-wide text-white uppercase">
              {{ playerTwo.name }}
            </p>
            <p class="font-stats text-kicker tracking-kicker text-silver uppercase">
              {{ playerTwo.mark }} · {{ playerTwo.role }}
            </p>
          </div>
          <ScoreDisplay
            :value="result?.playerTwoAggregate ?? null"
            :winner="result?.winnerId === tie.playerTwoId"
          />
        </div>
      </div>
      <ul v-if="legs.length" class="mt-4 space-y-3 border-t border-cyan/15 pt-3">
        <li v-for="(leg, index) in legs" :key="leg.fixture.id">
          <NuxtLink
            :to="`/match/${leg.fixture.id}`"
            :prefetch="false"
            class="block rounded-sm hover:text-white"
          >
            <p class="font-stats text-kicker tracking-kicker text-silver uppercase">
              Leg {{ index + 1 }} · GW {{ leg.fixture.fplGameweek }}
              <template v-if="leg.scored">
                · {{ leg.result?.homeScore }}–{{ leg.result?.awayScore }}
              </template>
            </p>
            <p class="font-display text-sm tracking-wide text-white uppercase">
              {{ leg.home }}
              <span class="font-stats text-kicker tracking-kicker text-silver"> home</span>
            </p>
            <p class="font-display text-sm tracking-wide text-white uppercase">
              {{ leg.away }}
            </p>
          </NuxtLink>
        </li>
      </ul>
      <p v-if="result?.decidedByTiebreak" class="mt-3 font-stats text-kicker tracking-kicker text-star uppercase">
        Decided by FPL cup tie-break
      </p>
    </CardContent>
  </Card>
</template>
