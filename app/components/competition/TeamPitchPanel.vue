<script setup lang="ts">
import type { FplSquadView, SquadSlot } from '../../../lib/types/squad'
import { playerHasAlert } from '../../../lib/engine/insights'

const props = withDefaults(defineProps<{
  squad?: FplSquadView
  loading?: boolean
  error?: unknown
  size?: 'sm' | 'md'
  scoring?: 'competition' | 'official'
  layout?: 'stack' | 'split'
  nextOpponentId?: number | null
}>(), {
  loading: false,
  size: 'md',
  scoring: 'competition',
  layout: 'stack',
  nextOpponentId: null,
})

const selected = ref<SquadSlot | null>(null)
const gameweek = computed(() => props.squad?.gameweek ?? 0)
const { ownership, status: ownershipStatus } = useLeagueOwnership(gameweek)

const matchedOwnership = computed(() => {
  if (!props.squad || ownership.value?.gameweek !== props.squad.gameweek) return undefined
  return ownership.value
})

watch(
  () => `${props.squad?.managerId ?? ''}:${props.squad?.fplId ?? ''}:${props.squad?.gameweek ?? ''}`,
  () => {
    selected.value = null
  },
)

watch(
  () => props.squad,
  (squad) => {
    if (!selected.value || !squad) return
    const next = [...squad.starters, ...squad.bench]
      .find((slot) => slot.elementId === selected.value?.elementId)
    if (next) selected.value = next
  },
)

function selectPlayer(player: SquadSlot) {
  selected.value = player
}

const flagged = computed(() => {
  if (!props.squad) return []
  return [...props.squad.starters, ...props.squad.bench].filter((slot) => playerHasAlert(slot))
})
</script>

<template>
  <div class="space-y-3">
    <template v-if="loading && !squad">
      <p class="font-stats text-label tracking-kicker text-silver uppercase">
        Loading squad…
      </p>
      <div class="min-h-[22rem] rounded-md border border-white/10 bg-[#0b2f24]/80 sm:min-h-[26rem]" />
    </template>
    <p
      v-else-if="error && !squad"
      class="font-stats text-label tracking-kicker text-live uppercase"
    >
      Couldn’t load this squad. Click the row again to retry.
    </p>
    <div
      v-else
      :class="layout === 'split'
        ? 'grid gap-3 lg:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)] lg:items-start'
        : 'space-y-3'"
    >
      <div class="space-y-3">
        <div
          v-if="flagged.length"
          class="rounded-md border border-live/30 bg-live/10 px-4 py-3"
        >
          <p class="mb-2 font-stats text-kicker tracking-kicker text-live uppercase">
            Flagged this GW
          </p>
          <ul class="space-y-1.5">
            <li v-for="player in flagged" :key="player.elementId">
              <button
                type="button"
                class="w-full text-left font-stats text-label text-white hover:text-cyan"
                @click="selectPlayer(player)"
              >
                {{ player.webName }}
                <span v-if="player.news" class="text-silver"> · {{ player.news }}</span>
                <span v-else-if="player.costChangeEvent" class="text-silver">
                  · price {{ player.costChangeEvent > 0 ? 'up' : 'down' }}
                </span>
              </button>
            </li>
          </ul>
        </div>
        <TeamStatsBar v-if="squad" :squad="squad" :scoring="scoring" />
        <TeamTransfers v-if="squad" :squad="squad" />
        <TeamChips v-if="squad" :squad="squad" />
      </div>
      <PitchView
        :squad="squad"
        :size="size"
        :selected-element-id="selected?.elementId"
        @select="selectPlayer"
      />
    </div>

    <PlayerDetailSheet
      :player="selected"
      :ownership="matchedOwnership"
      :ownership-pending="ownershipStatus === 'pending'"
      :current-manager-id="squad?.managerId ?? null"
      :current-entry-id="squad?.fplId ?? null"
      :next-opponent-id="nextOpponentId"
      :chip="squad?.chip ?? null"
      :scoring="scoring"
      @close="selected = null"
    />
  </div>
</template>
