<script setup lang="ts">
import type { KnockoutTieConfig, KnockoutTieResult, TournamentFixture } from '../../../lib/types/competition'
import type { FixtureResult } from '../../../lib/types/competition'

defineProps<{
  ties: KnockoutTieConfig[]
  results: KnockoutTieResult[]
  fixtures: TournamentFixture[]
  fixtureResults: Map<string, FixtureResult>
}>()

const rounds = [
  { stage: 'round-of-16', title: 'Round of 16' },
  { stage: 'quarter-final', title: 'Quarter-finals' },
  { stage: 'semi-final', title: 'Semi-finals' },
  { stage: 'final', title: 'Final' },
] as const
</script>

<template>
  <div class="grid gap-8 lg:grid-cols-4">
    <section v-for="round in rounds" :key="round.stage" class="space-y-3">
      <h3 class="font-stats text-kicker tracking-kicker text-cyan uppercase">
        {{ round.title }}
      </h3>
      <KnockoutTieCard
        v-for="tie in ties.filter((item) => item.stage === round.stage)"
        :key="tie.id"
        :tie="tie"
        :result="results.find((item) => item.tieId === tie.id)"
        :fixtures="fixtures"
        :fixture-results="fixtureResults"
      />
    </section>
  </div>
</template>
