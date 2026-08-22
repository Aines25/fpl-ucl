<script setup lang="ts">
import { ArrowLeft } from '@lucide/vue'
import { fixtures } from '../../../data'
import { getPlayer } from '../../../data/players'
import { compareSquads } from '../../../lib/engine/differentials'

const route = useRoute()
const fixtureId = String(route.params.id ?? '')
const fixture = fixtures.find((entry) => entry.id === fixtureId)

if (!fixture) {
  throw createError({ statusCode: 404, statusMessage: 'Fixture not found' })
}

const home = getPlayer(fixture.homeId)
const away = getPlayer(fixture.awayId)
const gameweek = fixture.fplGameweek

const { squad: homeSquad, loading: homeLoading } = useSquad(fixture.homeId, gameweek)
const { squad: awaySquad, loading: awayLoading } = useSquad(fixture.awayId, gameweek)
const { resultById } = useFixtures()
const result = computed(() => resultById.value.get(fixture.id))
const differentials = computed(() => compareSquads(homeSquad.value, awaySquad.value))

const homeScore = computed(() => result.value?.homeScore ?? homeSquad.value?.netPoints ?? null)
const awayScore = computed(() => result.value?.awayScore ?? awaySquad.value?.netPoints ?? null)
const scoreLine = computed(() => {
  const left = homeScore.value === null ? '–' : String(homeScore.value)
  const right = awayScore.value === null ? '–' : String(awayScore.value)
  return `${home.name} ${left}–${right} ${away.name}`
})

useHead({
  title: `${home.name} vs ${away.name} · Champions League`,
})

useSeoMeta({
  ogTitle: `${home.name} vs ${away.name}`,
  ogDescription: scoreLine,
  twitterTitle: `${home.name} vs ${away.name}`,
  twitterDescription: scoreLine,
})
</script>

<template>
  <div>
    <NuxtLink
      to="/"
      class="mb-4 inline-flex items-center gap-2 font-stats text-kicker tracking-kicker text-silver uppercase hover:text-cyan"
    >
      <ArrowLeft class="size-4" />
      Back
    </NuxtLink>

    <SectionHeading
      :kicker="`${fixture.group ? `Group ${fixture.group}` : fixture.stage.replaceAll('-', ' ')} · GW ${gameweek}`"
      :title="`${home.name} vs ${away.name}`"
    />

    <div class="mb-6 flex items-center justify-center gap-4">
      <ScoreDisplay :value="homeScore" :winner="result?.winnerId === fixture.homeId" size="lg" />
      <span class="font-stats text-kicker tracking-kicker text-silver uppercase">v</span>
      <ScoreDisplay :value="awayScore" :winner="result?.winnerId === fixture.awayId" size="lg" />
      <StatusBadge :status="result?.status ?? 'scheduled'" />
    </div>

    <ShareCard
      class="mb-6"
      :fixture="fixture"
      :result="result"
      :home-score="homeScore"
      :away-score="awayScore"
    />

    <DifferentialsPanel
      v-if="differentials"
      class="mb-6"
      :home-name="home.name"
      :away-name="away.name"
      :summary="differentials"
    />

    <div class="grid gap-6 lg:grid-cols-2">
      <TeamPitchPanel
        :squad="homeSquad"
        :loading="homeLoading"
        size="sm"
      />
      <TeamPitchPanel
        :squad="awaySquad"
        :loading="awayLoading"
        size="sm"
      />
    </div>
  </div>
</template>
