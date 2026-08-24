<script setup lang="ts">
import { fixtures, groupIds, matchdays } from '../../data'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const { snapshot } = useCompetition()
const { resultById } = useFixtures()
const selected = ref(snapshot.value?.currentMatchday ?? 1)
const view = ref<'competition' | 'fdr'>('competition')

watch(
  () => snapshot.value?.currentMatchday,
  (matchday) => {
    if (matchday) selected.value = matchday
  },
)

const visible = computed(() => fixtures.filter((fixture) => fixture.matchday === selected.value))

const grouped = computed(() =>
  groupIds
    .map((group) => ({
      group,
      fixtures: visible.value.filter((fixture) => fixture.group === group),
    }))
    .filter((entry) => entry.fixtures.length),
)

const knockoutVisible = computed(() => visible.value.filter((fixture) => fixture.stage !== 'group'))

const currentMap = computed(() => matchdays.find((entry) => entry.matchday === selected.value))
</script>

<template>
  <div>
    <SectionHeading kicker="Schedule" title="Fixtures" />
    <Tabs
      :model-value="view"
      class="mb-6"
      @update:model-value="view = String($event) === 'fdr' ? 'fdr' : 'competition'"
    >
      <TabsList class="h-auto w-full flex-wrap justify-start rounded-md bg-navy-900 p-1">
        <TabsTrigger
          value="competition"
          class="rounded-sm px-3 py-2 font-stats text-kicker tracking-kicker uppercase data-[state=active]:bg-navy-700 data-[state=active]:text-cyan"
        >
          Matchdays
        </TabsTrigger>
        <TabsTrigger
          value="fdr"
          class="rounded-sm px-3 py-2 font-stats text-kicker tracking-kicker uppercase data-[state=active]:bg-navy-700 data-[state=active]:text-cyan"
        >
          FDR
        </TabsTrigger>
      </TabsList>
      <TabsContent value="competition" class="mt-4 space-y-4">
        <MatchdaySelector v-model="selected" />
        <MatchdayDigest :matchday="selected" />
        <p class="font-stats text-label text-silver">
          {{ currentMap?.label }} · FPL Gameweek {{ currentMap?.fplGameweek }}
        </p>
        <div class="space-y-8">
          <section v-for="entry in grouped" :key="entry.group" class="space-y-3">
            <h3 class="font-stats text-kicker tracking-kicker text-cyan uppercase">
              Group {{ entry.group }}
            </h3>
            <div class="grid gap-3 lg:grid-cols-2">
              <FixtureCard
                v-for="fixture in entry.fixtures"
                :key="fixture.id"
                :fixture="fixture"
                :result="resultById.get(fixture.id)"
              />
            </div>
          </section>
          <section v-if="knockoutVisible.length" class="space-y-3">
            <h3 class="font-stats text-kicker tracking-kicker text-cyan uppercase">
              Knockout
            </h3>
            <div class="grid gap-3 lg:grid-cols-2">
              <FixtureCard
                v-for="fixture in knockoutVisible"
                :key="fixture.id"
                :fixture="fixture"
                :result="resultById.get(fixture.id)"
              />
            </div>
          </section>
        </div>
      </TabsContent>
      <TabsContent value="fdr" class="mt-4">
        <FdrGrid />
      </TabsContent>
    </Tabs>
  </div>
</template>
