<script setup lang="ts">
import { fixtures, groupIds, knockoutTies, matchdays } from '../../data'
import type { GroupId } from '../../lib/types/competition'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const { snapshot, status } = useCompetition()
const { resultById } = useFixtures()
const requestUrl = useRequestURL()

const knockoutDrawn = knockoutTies.some((tie) => tie.playerOneId != null && tie.playerTwoId != null)
const view = ref<'knockouts' | 'groups'>(knockoutDrawn ? 'knockouts' : 'groups')

const groupMatchday = computed(() => {
  const current = snapshot.value?.currentMatchday ?? 1
  const currentMap = matchdays.find((entry) => entry.matchday === current)
  if (currentMap?.stage === 'group') return current
  return matchdays.filter((entry) => entry.stage === 'group').at(-1)?.matchday ?? 1
})

const groupFixtures = computed(() =>
  fixtures.filter((fixture) => fixture.matchday === groupMatchday.value && fixture.stage === 'group'),
)

const knockoutRound = computed(() => {
  const playable = matchdays.filter((entry) =>
    entry.stage !== 'group' && fixtures.some((fixture) => fixture.matchday === entry.matchday),
  )
  const open = playable.find((entry) =>
    fixtures
      .filter((fixture) => fixture.matchday === entry.matchday)
      .some((fixture) => (resultById.value.get(fixture.id)?.status ?? 'scheduled') !== 'final'),
  )
  return open ?? playable.at(-1)
})

const knockoutFixtures = computed(() => {
  const round = knockoutRound.value
  if (!round) return []
  return fixtures.filter((fixture) => fixture.matchday === round.matchday)
})

const kicker = computed(() => {
  if (view.value === 'groups') return 'Group stage'
  return knockoutRound.value?.label ?? 'Knockout stage'
})

useSeoMeta({
  ogTitle: 'Champions League · 2026/27',
  ogDescription: 'Private FPL Champions League — groups, fixtures, and the overall league table.',
  ogImage: () => {
    const round = knockoutRound.value
    if (knockoutDrawn && round) {
      return `${requestUrl.origin}/api/og/matchday/${round.matchday}?size=square`
    }
    return `${requestUrl.origin}/api/og/groups?md=${snapshot.value?.currentMatchday ?? 1}`
  },
  twitterCard: 'summary_large_image',
})

function fixturesForGroup(group: GroupId) {
  return groupFixtures.value.filter((fixture) => fixture.group === group)
}

const tabClass = 'rounded-sm border-transparent px-3 py-1.5 font-stats text-kicker tracking-kicker text-silver uppercase data-[state=active]:bg-cyan/20 data-[state=active]:text-white data-[state=active]:shadow-none'
</script>

<template>
  <div>
    <SectionHeading
      :kicker="kicker"
      title="Overview"
    />

    <DeadlineBar class="mb-4" />

    <p
      v-if="snapshot && snapshot.linkedManagers < snapshot.totalManagers"
      class="mb-6 rounded-md border border-star/30 bg-star/10 px-4 py-3 font-stats text-label text-star"
    >
      {{ snapshot.linkedManagers }} of {{ snapshot.totalManagers }} managers have FPL IDs.
      Add the real roster in <code class="text-white">data/players.ts</code>
      and Matchday 1 pairings in <code class="text-white">data/matchday1.ts</code>,
      then run <code class="text-white">npm run generate:fixtures</code>.
    </p>

    <p v-if="status === 'pending'" class="mb-4 font-stats text-silver uppercase tracking-kicker">
      Loading scores…
    </p>

    <Tabs v-model="view" class="gap-4">
      <TabsList class="h-auto w-full grid grid-cols-2 gap-1 rounded-md border border-cyan/20 bg-navy-900/80 p-1 sm:w-fit">
        <TabsTrigger value="knockouts" :class="tabClass">
          Knockouts
        </TabsTrigger>
        <TabsTrigger value="groups" :class="tabClass">
          Groups
        </TabsTrigger>
      </TabsList>

      <TabsContent value="knockouts" class="space-y-4">
        <MatchdayDigest
          v-if="knockoutRound"
          :matchday="knockoutRound.matchday"
          shares="matchday"
        />
        <p v-if="knockoutRound" class="font-stats text-label text-silver">
          {{ knockoutRound.label }} · FPL Gameweek {{ knockoutRound.fplGameweek }}
        </p>
        <p v-if="!knockoutFixtures.length" class="max-w-2xl font-sans text-sm leading-6 text-silver">
          The Round of 16 appears here once the draw is committed.
        </p>
        <div v-else class="grid gap-3 lg:grid-cols-2">
          <FixtureCard
            v-for="fixture in knockoutFixtures"
            :key="fixture.id"
            :fixture="fixture"
            :result="resultById.get(fixture.id)"
          />
        </div>
      </TabsContent>

      <TabsContent value="groups" class="space-y-4">
        <MatchdayDigest :matchday="groupMatchday" shares="tables" />
        <div class="space-y-8">
          <section v-for="group in groupIds" :key="group" class="space-y-3">
            <h3 class="font-stats text-kicker tracking-kicker text-cyan uppercase">
              Group {{ group }}
            </h3>
            <div v-if="fixturesForGroup(group).length" class="grid gap-3 lg:grid-cols-2">
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
      </TabsContent>
    </Tabs>
  </div>
</template>
