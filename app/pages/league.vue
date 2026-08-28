<script setup lang="ts">
import { activeCompetitionIds } from '../../lib/engine/qualification'
import { leagueShareImageParts } from '../../lib/engine/share-cards'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const { league, status } = useLeague()
const { snapshot, isLive } = useCompetition()

const tab = ref<'official' | 'live' | 'ownership' | 'prices' | 'chips'>('official')
const { live, feed, status: liveStatus } = useLiveLeague(computed(() => tab.value === 'live' || isLive.value))
const insightsOn = computed(() => tab.value === 'ownership' || tab.value === 'prices')
const requestUrl = useRequestURL()

type ExpandedSource = 'official' | 'live'
type LiveMobileView = 'points' | 'picks' | 'feed'
const expandedEntryId = ref<number | null>(null)
const expandedSource = ref<ExpandedSource>('official')
const liveMobileView = ref<LiveMobileView>('points')
const liveTableColumns = computed(() => liveMobileView.value === 'feed' ? 'points' : liveMobileView.value)

const gameweek = computed(() => snapshot.value?.currentGameweek ?? 1)
const { insights, status: insightsStatus } = useLeagueInsights(gameweek, insightsOn)
const templateSquad = computed(() => {
  const xi = insights.value?.templateXi ?? []
  if (!xi.length) return undefined
  return {
    managerId: 0,
    fplId: 0,
    name: 'Template XI',
    teamName: `${insights.value?.managerCount ?? 0} managers`,
    gameweek: gameweek.value,
    available: true,
    points: 0,
    officialPoints: 0,
    transferCost: 0,
    netPoints: 0,
    officialNetPoints: 0,
    transfers: 0,
    moves: [],
    overallRank: null,
    eventRank: null,
    totalPoints: null,
    teamValue: null,
    bank: null,
    chip: null,
    chipLabel: null,
    chipsUsed: [],
    chipsRemaining: [],
    formation: insights.value?.templateFormation ?? '–',
    starters: xi,
    bench: [],
  }
})
const { squad, loading, error } = useEntrySquad(expandedEntryId, gameweek)
const stillInUcl = computed(() => {
  if (!snapshot.value?.standings) return new Set<number>()
  return activeCompetitionIds(snapshot.value.standings, snapshot.value.knockout ?? [])
})
const leagueImageParts = leagueShareImageParts()
const captainsIncomplete = computed(() =>
  (league.value?.standings ?? []).some((row) => row.entryId > 0 && row.transfers == null),
)
const chipsIncomplete = computed(() =>
  (league.value?.standings ?? []).some((row) => row.entryId > 0 && row.freeTransfers == null),
)

useHead({
  title: 'League · Champions League',
})

useSeoMeta({
  ogTitle: () => league.value?.name ?? 'Classic league',
  ogDescription: 'Overall FPL mini-league standings, including managers outside the Champions League groups.',
  ogImage: () => `${requestUrl.origin}/api/og/league?part=1`,
  twitterCard: 'summary_large_image',
  twitterImage: () => `${requestUrl.origin}/api/og/league?part=1`,
})

function toggleRow(entryId: number, source: ExpandedSource) {
  if (expandedEntryId.value === entryId && expandedSource.value === source) {
    expandedEntryId.value = null
    return
  }
  expandedEntryId.value = entryId
  expandedSource.value = source
}

watch(tab, () => {
  expandedEntryId.value = null
})
</script>

<template>
  <div>
    <SectionHeading
      kicker="Fantasy Premier League"
      :title="league?.name ?? 'Classic league'"
    />

    <p class="mb-6 max-w-2xl text-silver">
      The overall mini-league. Official is FPL’s confirmed table. Live recalculates ranks from live player points while matches are on, and the feed lists every FPL event as it lands.
    </p>

    <div class="mb-6 flex flex-wrap justify-end gap-2">
      <ShareImageButton
        :items="leagueImageParts"
        label="League image"
      />
    </div>

    <p v-if="status === 'pending' && !league" class="font-stats text-silver uppercase tracking-kicker">
      Loading league…
    </p>

    <Tabs v-else v-model="tab" class="gap-4">
      <TabsList class="h-auto w-full grid grid-cols-3 gap-1 rounded-md border border-cyan/20 bg-navy-900/80 p-1 sm:grid-cols-5 sm:w-fit">
        <TabsTrigger
          value="official"
          class="rounded-sm border-transparent px-3 py-1.5 font-stats text-kicker tracking-kicker text-silver uppercase data-[state=active]:bg-cyan/20 data-[state=active]:text-white data-[state=active]:shadow-none"
        >
          Official
        </TabsTrigger>
        <TabsTrigger
          value="live"
          class="rounded-sm border-transparent px-3 py-1.5 font-stats text-kicker tracking-kicker text-silver uppercase data-[state=active]:bg-cyan/20 data-[state=active]:text-white data-[state=active]:shadow-none"
        >
          Live
        </TabsTrigger>
        <TabsTrigger
          value="ownership"
          class="rounded-sm border-transparent px-3 py-1.5 font-stats text-kicker tracking-kicker text-silver uppercase data-[state=active]:bg-cyan/20 data-[state=active]:text-white data-[state=active]:shadow-none"
        >
          Ownership
        </TabsTrigger>
        <TabsTrigger
          value="prices"
          class="rounded-sm border-transparent px-3 py-1.5 font-stats text-kicker tracking-kicker text-silver uppercase data-[state=active]:bg-cyan/20 data-[state=active]:text-white data-[state=active]:shadow-none"
        >
          Prices
        </TabsTrigger>
        <TabsTrigger
          value="chips"
          class="rounded-sm border-transparent px-3 py-1.5 font-stats text-kicker tracking-kicker text-silver uppercase data-[state=active]:bg-cyan/20 data-[state=active]:text-white data-[state=active]:shadow-none"
        >
          Chips
        </TabsTrigger>
      </TabsList>

      <p
        v-if="tab === 'official' || tab === 'live'"
        class="flex items-center gap-2 font-stats text-kicker tracking-kicker text-silver uppercase"
      >
        <span class="inline-block size-3 rounded-sm bg-star/30 ring-1 ring-star/40" />
        Gold rows are still in the Champions League
      </p>

      <TabsContent value="official">
        <p v-if="captainsIncomplete" class="mb-4 text-sm text-silver">
          Still fetching a few squads. Captains and chips will fill in as those picks arrive.
        </p>
        <LeagueStandingsTable
          :standings="league?.standings ?? []"
          :still-in-ucl="stillInUcl"
          :expanded-entry-id="expandedSource === 'official' ? expandedEntryId : null"
          @toggle="toggleRow($event, 'official')"
        >
          <template #expanded="{ row }">
            <TeamPitchPanel
              :squad="squad"
              :loading="loading"
              :error="error"
              scoring="official"
              layout="split"
              size="sm"
            />
            <NuxtLink
              v-if="row.competitionPlayerId"
              :to="`/team/${row.competitionPlayerId}`"
              class="inline-flex font-stats text-kicker tracking-kicker text-cyan uppercase hover:text-white"
              @click.stop
            >
              Open team page
            </NuxtLink>
          </template>
        </LeagueStandingsTable>
      </TabsContent>

      <TabsContent value="live">
        <p v-if="liveStatus === 'pending' && !live" class="mb-4 font-stats text-silver uppercase tracking-kicker">
          Calculating live scores…
        </p>
        <p v-else-if="liveStatus === 'error' && !live" class="mb-4 text-sm text-live">
          Could not load live scores. Try again in a moment.
        </p>
        <p v-else-if="live && !live.picksComplete" class="mb-4 text-sm text-silver">
          Still fetching a few squads. Ranks will settle as those picks arrive.
        </p>
        <p v-else class="mb-4 text-sm text-silver">
          Ranks use live FPL points, including provisional auto-subs. Arrows are movement versus the official table.
        </p>

        <div
          class="mb-3 grid grid-cols-3 gap-1 rounded-md border border-cyan/20 bg-navy-900/80 p-1 lg:hidden"
          role="group"
          aria-label="Live league view"
        >
          <button
            type="button"
            class="rounded-sm px-2 py-1.5 font-stats text-kicker tracking-kicker uppercase"
            :class="liveMobileView === 'points' ? 'bg-cyan/20 text-white' : 'text-silver'"
            :aria-pressed="liveMobileView === 'points'"
            @click="liveMobileView = 'points'"
          >
            GW / Total
          </button>
          <button
            type="button"
            class="rounded-sm px-2 py-1.5 font-stats text-kicker tracking-kicker uppercase"
            :class="liveMobileView === 'picks' ? 'bg-cyan/20 text-white' : 'text-silver'"
            :aria-pressed="liveMobileView === 'picks'"
            @click="liveMobileView = 'picks'"
          >
            Captains
          </button>
          <button
            type="button"
            class="rounded-sm px-2 py-1.5 font-stats text-kicker tracking-kicker uppercase"
            :class="liveMobileView === 'feed' ? 'bg-cyan/20 text-white' : 'text-silver'"
            :aria-pressed="liveMobileView === 'feed'"
            @click="liveMobileView = 'feed'"
          >
            Feed
          </button>
        </div>

        <div v-if="live" class="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <LeagueStandingsTable
            :class="liveMobileView === 'feed' ? 'hidden lg:block' : ''"
            :standings="live?.standings ?? []"
            :still-in-ucl="stillInUcl"
            :expanded-entry-id="expandedSource === 'live' ? expandedEntryId : null"
            hide-mobile-toggle
            :mobile-columns="liveTableColumns"
            @toggle="toggleRow($event, 'live')"
          >
            <template #expanded="{ row }">
              <TeamPitchPanel
                :squad="squad"
                :loading="loading"
                :error="error"
                scoring="official"
                layout="split"
                size="sm"
              />
              <NuxtLink
                v-if="row.competitionPlayerId"
                :to="`/team/${row.competitionPlayerId}`"
                class="inline-flex font-stats text-kicker tracking-kicker text-cyan uppercase hover:text-white"
                @click.stop
              >
                Open team page
              </NuxtLink>
            </template>
          </LeagueStandingsTable>

          <div
            :class="liveMobileView === 'feed' ? '' : 'hidden lg:block'"
            class="lg:sticky lg:top-[calc(var(--spacing-header)+var(--spacing-nav)+1rem)] lg:max-h-[calc(100dvh-var(--spacing-header)-var(--spacing-nav)-2rem)]"
          >
            <LeagueLiveFeed
              :events="feed"
              :owners-by-player="live?.ownersByPlayer ?? {}"
            />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="ownership" class="space-y-6">
        <p v-if="insightsStatus === 'pending' && !insights" class="font-stats text-silver uppercase tracking-kicker">
          Loading ownership…
        </p>
        <p v-else-if="insights && !insights.picksComplete" class="text-sm text-silver">
          Still fetching a few squads. Ownership will settle as those picks arrive.
        </p>
        <p v-else class="text-sm text-silver">
          Mini-league ownership this gameweek. Template is 50%+, popular 25–49%, differential below that. Pitch numbers are owner counts.
        </p>
        <div class="grid gap-4 lg:grid-cols-2">
          <OwnershipList title="Most owned" :rows="insights?.mostOwned ?? []" />
          <OwnershipList title="Most captained" :rows="insights?.mostCaptained ?? []" count-key="captains" />
        </div>
        <div v-if="templateSquad" class="max-w-xl">
          <p class="mb-3 font-stats text-kicker tracking-kicker text-cyan uppercase">
            Template XI · {{ insights?.templateFormation }}
          </p>
          <PitchView :squad="templateSquad" size="sm" />
        </div>
      </TabsContent>

      <TabsContent value="prices" class="space-y-6">
        <p v-if="insightsStatus === 'pending' && !insights" class="font-stats text-silver uppercase tracking-kicker">
          Loading prices…
        </p>
        <p v-else class="text-sm text-silver">
          Overnight FPL price changes for players owned in this mini-league.
        </p>
        <div class="grid gap-4 lg:grid-cols-2">
          <PriceMoversList
            title="Risers"
            :rows="insights?.risers ?? []"
            empty="No owned risers this GW"
          />
          <PriceMoversList
            title="Fallers"
            :rows="insights?.fallers ?? []"
            empty="No owned fallers this GW"
          />
        </div>
      </TabsContent>

      <TabsContent value="chips">
        <p v-if="chipsIncomplete" class="mb-4 text-sm text-silver">
          Still fetching chip history for some managers.
        </p>
        <p v-else class="mb-4 text-sm text-silver">
          Every mini-league manager. Gold rows are still in the Champions League.
        </p>
        <ChipBoard
          :standings="league?.standings ?? []"
          :still-in-ucl="stillInUcl"
          :gameweek="gameweek"
        />
      </TabsContent>
    </Tabs>
  </div>
</template>
