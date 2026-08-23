<script setup lang="ts">
import { fixtures, groupIds } from '../../data'

const { snapshot, status } = useCompetition()
const { resultById } = useFixtures()

useSeoMeta({
  ogTitle: 'Champions League · 2026/27',
  ogDescription: 'Private FPL Champions League — groups, fixtures, and the overall league table.',
})

const currentFixtures = computed(() => {
  const matchday = snapshot.value?.currentMatchday ?? 1
  return fixtures.filter((fixture) => fixture.matchday === matchday && fixture.stage === 'group')
})

function fixturesForGroup(group: string) {
  return currentFixtures.value.filter((fixture) => fixture.group === group)
}
</script>

<template>
  <div>
    <SectionHeading
      :kicker="snapshot?.currentLabel ?? 'Matchday 1'"
      title="Overview"
    />

    <DeadlineBar class="mb-4" />
    <MatchdayDigest class="mb-6" />

    <p
      v-if="snapshot && snapshot.linkedManagers < snapshot.totalManagers"
      class="mb-6 rounded-md border border-star/30 bg-star/10 px-4 py-3 font-stats text-label text-star"
    >
      {{ snapshot.linkedManagers }} of {{ snapshot.totalManagers }} managers have FPL IDs.
      Add the real roster in <code class="text-white">data/players.ts</code>
      and Matchday 1 pairings in <code class="text-white">data/matchday1.ts</code>,
      then run <code class="text-white">npm run generate:fixtures</code>.
    </p>

    <p v-if="status === 'pending'" class="font-stats text-silver uppercase tracking-kicker">
      Loading scores…
    </p>

    <div class="space-y-8">
      <section v-for="group in groupIds" :key="group" class="space-y-3">
        <h3 class="font-stats text-kicker tracking-kicker text-cyan uppercase">
          Group {{ group }}
        </h3>
        <div class="grid gap-3 lg:grid-cols-2">
          <FixtureCard
            v-for="fixture in fixturesForGroup(group)"
            :key="fixture.id"
            :fixture="fixture"
            :result="resultById.get(fixture.id)"
          />
        </div>
        <GroupTable
          v-if="snapshot?.standings?.[group]"
          :group="group"
          :rows="snapshot.standings[group]"
        />
      </section>
    </div>
  </div>
</template>
