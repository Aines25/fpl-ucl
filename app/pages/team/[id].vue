<script setup lang="ts">
import { ArrowLeft } from '@lucide/vue'
import { fixtures } from '../../../data'
import { playerById } from '../../../data/players'
import { upcomingFixtureFor } from '../../../lib/engine/upcoming'

const route = useRoute()
const { snapshot } = useCompetition()
const { resultById } = useFixtures()

const playerId = Number(route.params.id)
const player = playerById.get(playerId)

if (!player) {
  throw createError({ statusCode: 404, statusMessage: 'Manager not found' })
}

const gameweek = computed(() => {
  const fromQuery = Number(route.query.gw)
  if (Number.isFinite(fromQuery) && fromQuery >= 1) return fromQuery
  return snapshot.value?.currentGameweek ?? 1
})

const { squad, loading } = useSquad(player.id, gameweek)
const qualification = computed(() => {
  const group = snapshot.value?.scenarios[player.group]
  if (!group?.enumerated) return undefined
  return group.lines.find((line) => line.playerId === player.id)
})
const nextFixture = computed(() =>
  upcomingFixtureFor(player.id, fixtures, snapshot.value?.results ?? []),
)
const nextOpponent = computed(() => {
  const fixture = nextFixture.value
  if (!fixture) return null
  const opponentId = fixture.homeId === player.id ? fixture.awayId : fixture.homeId
  return playerById.get(opponentId) ?? null
})

useHead({
  title: `${player.name} · Champions League`,
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
      :kicker="`Group ${player.group} · GW ${gameweek}`"
      :title="player.name"
    />

    <div
      v-if="qualification || nextFixture"
      class="mb-6 rounded-md border border-cyan/20 bg-navy-800/80 px-4 py-3 font-stats text-label text-silver"
    >
      <p v-if="qualification" class="text-white">
        {{ qualification.message }}
      </p>
      <p v-if="nextFixture && nextOpponent">
        Next:
        <NuxtLink :to="`/match/${nextFixture.id}`" class="text-cyan hover:text-white">
          {{ nextFixture.homeId === player.id ? 'vs' : 'at' }} {{ nextOpponent.name }}
        </NuxtLink>
        · GW {{ nextFixture.fplGameweek }}
        <span v-if="resultById.get(nextFixture.id)?.status === 'live'" class="text-live">
          · Live
        </span>
      </p>
    </div>

    <TeamPitchPanel
      :squad="squad"
      :loading="loading"
    />
  </div>
</template>
