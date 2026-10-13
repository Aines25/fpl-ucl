<script setup lang="ts">
import { matchdays } from '../../../data/matchdays'
import type { KnockoutTieConfig, KnockoutTieResult, Stage, TournamentFixture } from '../../../lib/types/competition'
import type { FixtureResult } from '../../../lib/types/competition'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const props = defineProps<{
  ties: KnockoutTieConfig[]
  results: KnockoutTieResult[]
  fixtures: TournamentFixture[]
  fixtureResults: Map<string, FixtureResult>
}>()

const rounds = [
  {
    stage: 'round-of-16',
    title: 'Round of 16',
    pending: 'The Round of 16 is drawn once the group stage is complete.',
  },
  {
    stage: 'quarter-final',
    title: 'Quarter-finals',
    pending: 'The quarter-finals are drawn once the Round of 16 is complete.',
  },
  {
    stage: 'semi-final',
    title: 'Semi-finals',
    pending: 'The semi-finals are drawn once the quarter-finals are complete.',
  },
  {
    stage: 'final',
    title: 'Final',
    pending: 'The final is drawn once the semi-finals are complete.',
  },
] as const

const { snapshot } = useCompetition()
const selected = ref<Stage>('round-of-16')
const pinned = ref(false)

function drawnTies(stage: Stage) {
  return props.ties.filter((tie) => tie.stage === stage && tie.playerOneId != null && tie.playerTwoId != null)
}

function gridClass(stage: Stage) {
  if (stage === 'final') return 'grid grid-cols-1 gap-3'
  return 'grid grid-cols-1 gap-3 md:grid-cols-2'
}

watch(
  () => snapshot.value?.currentGameweek,
  (gameweek) => {
    if (pinned.value || !gameweek) return
    const drawn = matchdays.filter((entry) => entry.stage !== 'group' && drawnTies(entry.stage).length > 0)
    const next = drawn.find((entry) => entry.fplGameweek >= gameweek)
    const stage = (next ?? drawn.at(-1))?.stage
    if (stage) selected.value = stage
  },
  { immediate: true },
)

function choose(value: string | number) {
  pinned.value = true
  selected.value = String(value) as Stage
}

const tabClass = 'rounded-sm border-transparent px-3 py-1.5 font-stats text-kicker tracking-kicker text-silver uppercase data-[state=active]:bg-cyan/20 data-[state=active]:text-white data-[state=active]:shadow-none'
</script>

<template>
  <Tabs :model-value="selected" class="gap-4" @update:model-value="choose">
    <TabsList class="h-auto w-full grid grid-cols-2 gap-1 rounded-md border border-cyan/20 bg-navy-900/80 p-1 sm:grid-cols-4 sm:w-fit">
      <TabsTrigger
        v-for="round in rounds"
        :key="round.stage"
        :value="round.stage"
        :class="tabClass"
      >
        {{ round.title }}
      </TabsTrigger>
    </TabsList>

    <TabsContent
      v-for="round in rounds"
      :key="round.stage"
      :value="round.stage"
    >
      <p
        v-if="!drawnTies(round.stage).length"
        class="max-w-2xl font-sans text-sm leading-6 text-silver"
      >
        {{ round.pending }}
      </p>
      <div v-else :class="gridClass(round.stage)">
        <KnockoutTieCard
          v-for="tie in drawnTies(round.stage)"
          :key="tie.id"
          :tie="tie"
          :result="results.find((item) => item.tieId === tie.id)"
          :fixtures="fixtures"
          :fixture-results="fixtureResults"
        />
      </div>
    </TabsContent>
  </Tabs>
</template>
