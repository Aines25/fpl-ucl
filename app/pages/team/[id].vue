<script setup lang="ts">
import { ArrowLeft } from '@lucide/vue'
import { playerById } from '../../../data/players'

const route = useRoute()
const { snapshot } = useCompetition()

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

    <TeamPitchPanel
      :squad="squad"
      :loading="loading"
    />
  </div>
</template>
