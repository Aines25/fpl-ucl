<script setup lang="ts">
import { X } from '@lucide/vue'
import { onKeyStroke, useMediaQuery } from '@vueuse/core'
import { playerById, playersInGroup } from '../../../data/players'
import { formatFixtureKickoff } from '../../../lib/engine/club-fixtures'
import { competitionMultiplier } from '../../../lib/engine/differentials'
import {
  breakdownLineLabel,
  signedPointsLabel,
  splitOwners,
} from '../../../lib/engine/live'
import { elementTypeLabel } from '../../../lib/engine/squad'
import type { LeagueOwnership } from '../../../lib/types/league'
import type { SquadSlot } from '../../../lib/types/squad'

const props = withDefaults(defineProps<{
  player: SquadSlot | null
  ownership?: LeagueOwnership
  ownershipPending?: boolean
  currentManagerId?: number | null
  currentEntryId?: number | null
  nextOpponentId?: number | null
  chip?: string | null
  scoring?: 'competition' | 'official'
}>(), {
  ownership: undefined,
  ownershipPending: false,
  currentManagerId: null,
  currentEntryId: null,
  nextOpponentId: null,
  chip: null,
  scoring: 'competition',
})

const emit = defineEmits<{
  close: []
}>()

const isDesktop = useMediaQuery('(min-width: 640px)')

onKeyStroke('Escape', () => {
  if (props.player) emit('close')
})

const src = ref('')
watch(
  () => [props.player?.photoUrl, props.player?.shirtUrl],
  () => {
    src.value = props.player?.photoUrl || props.player?.shirtUrl || ''
  },
  { immediate: true },
)

function onError() {
  if (src.value && src.value === props.player?.photoUrl && props.player?.shirtUrl) {
    src.value = props.player.shirtUrl
    return
  }
  src.value = ''
}

const owners = computed(() => {
  if (!props.player || !props.ownership) return []
  return props.ownership.ownersByPlayer[props.player.elementId] ?? []
})

const manager = computed(() => {
  if (!props.currentManagerId) return undefined
  return playerById.get(props.currentManagerId)
})

const grouped = computed(() => splitOwners(owners.value, {
  currentManagerId: props.currentManagerId,
  currentEntryId: props.currentEntryId,
  groupMateIds: manager.value ? playersInGroup(manager.value.group).map((entry) => entry.id) : [],
}))

const nextOpponent = computed(() => {
  if (!props.nextOpponentId) return null
  return playerById.get(props.nextOpponentId) ?? null
})

const nextOpponentOwner = computed(() =>
  owners.value.find((owner) => owner.competitionPlayerId === props.nextOpponentId) ?? null,
)

const otherCount = computed(() => owners.value.length - (grouped.value.thisTeam ? 1 : 0))
const uclOwnerCount = computed(() => owners.value.filter((owner) => owner.competitionPlayerId).length)

const competitionPoints = computed(() => {
  if (!props.player) return 0
  return props.player.rawPoints * competitionMultiplier(props.player, props.chip)
})

const roleLabel = computed(() => {
  if (!props.player) return ''
  if (props.player.isCaptain && props.player.multiplier >= 3) return 'Triple captain'
  if (props.player.isCaptain) return 'Captain'
  if (props.player.isViceCaptain) return 'Vice-captain'
  if (props.player.pickPosition > 11) return 'Substitute'
  return 'Starter'
})

const fixtureLine = computed(() => {
  const fixture = props.player?.fixture
  if (!fixture) return 'No fixture this GW'
  const when = formatFixtureKickoff(fixture.kickoff)
  if (!fixture.started) return when ? `vs ${fixture.opponent} · ${when}` : `vs ${fixture.opponent}`
  if (fixture.finished) return `vs ${fixture.opponent} · FT`
  return `vs ${fixture.opponent} · Live`
})

const houseRule = computed(() => {
  if (props.scoring !== 'competition' || !props.player) return null
  if (props.chip === 'bboost' && props.player.pickPosition > 11) {
    return 'Bench Boost points do not count in the Champions League.'
  }
  if (props.chip === '3xc' && props.player.multiplier >= 3) {
    return 'Triple Captain is scored as 2× here.'
  }
  return null
})

const ownerListProps = computed(() => ({
  currentManagerId: props.currentManagerId,
  currentEntryId: props.currentEntryId,
  nextOpponentId: props.nextOpponentId,
}))
</script>

<template>
  <Teleport to="body">
    <div
      v-if="player"
      class="fixed inset-0 z-50"
    >
      <button
        type="button"
        class="absolute inset-0 cursor-pointer bg-black/80"
        aria-label="Close player details"
        @click="emit('close')"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="player-sheet-title"
        :class="[
          'absolute flex flex-col border-cyan/20 bg-navy-900 text-white shadow-card',
          isDesktop
            ? 'inset-y-0 right-0 w-full border-l sm:max-w-md'
            : 'inset-x-0 bottom-0 max-h-[85dvh] rounded-t-md border-t',
        ]"
      >
        <div class="relative shrink-0 border-b border-cyan/15 px-4 py-4">
          <button
            type="button"
            class="absolute top-3 right-3 rounded-sm p-1 text-silver hover:text-white"
            aria-label="Close"
            @click="emit('close')"
          >
            <X class="size-4" />
          </button>
          <div class="flex items-start gap-3 pr-8">
            <div class="h-16 w-12 shrink-0 overflow-hidden rounded-sm bg-navy-950/60">
              <img
                v-if="src"
                :src="src"
                alt=""
                class="size-full object-contain object-bottom"
                loading="lazy"
                referrerpolicy="no-referrer"
                @error="onError"
              >
              <div
                v-else
                class="flex size-full items-center justify-center font-stats text-kicker text-silver uppercase"
              >
                {{ player.webName.slice(0, 2) }}
              </div>
            </div>
            <div class="min-w-0">
              <h2
                id="player-sheet-title"
                class="font-display text-base tracking-wide text-white uppercase"
              >
                {{ player.webName }}
              </h2>
              <p class="mt-1 font-stats text-kicker tracking-kicker text-silver uppercase">
                {{ elementTypeLabel(player.elementType) }}
                · {{ roleLabel }}
                <template v-if="player.minutes"> · {{ player.minutes }}'</template>
              </p>
              <p class="mt-1 text-sm text-silver">
                {{ fixtureLine }}
              </p>
            </div>
          </div>
        </div>

        <div class="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <section>
            <p class="mb-2 font-stats text-kicker tracking-kicker text-silver uppercase">
              This GW
            </p>
            <p
              class="font-stats text-2xl leading-tight tabular-nums"
              :class="player.rawPoints < 0 ? 'text-live' : 'text-star'"
            >
              {{ player.rawPoints }} pts
            </p>
            <p v-if="player.multiplier > 1 || !player.counting || houseRule" class="mt-1 text-sm text-silver">
              <template v-if="scoring === 'competition' && chip === '3xc' && player.multiplier >= 3">
                {{ competitionPoints }} in this squad. {{ houseRule }}
              </template>
              <template v-else-if="houseRule">
                {{ houseRule }}
              </template>
              <template v-else-if="!player.counting">
                Does not count in this squad.
              </template>
              <template v-else-if="player.multiplier > 1">
                {{ player.points }} in this squad ({{ player.multiplier }}×).
              </template>
            </p>
            <ul v-if="player.breakdown?.length" class="mt-3 space-y-1">
              <li
                v-for="line in player.breakdown"
                :key="line.identifier"
                class="flex items-baseline justify-between gap-3 text-sm"
              >
                <span class="text-silver">{{ breakdownLineLabel(line) }}</span>
                <span
                  class="font-stats text-label"
                  :class="line.points < 0 ? 'text-live' : 'text-final'"
                >
                  {{ signedPointsLabel(line.points) }}
                </span>
              </li>
            </ul>
          </section>

          <section>
            <p class="mb-1 font-stats text-kicker tracking-kicker text-silver uppercase">
              Owned by {{ owners.length }}{{ ownership?.managerCount ? ` of ${ownership.managerCount}` : '' }}
            </p>
            <p v-if="otherCount" class="mb-3 text-sm text-silver">
              {{ otherCount }} {{ otherCount === 1 ? 'other manager' : 'other managers' }}
              <template v-if="grouped.groupMates.length">
                · {{ grouped.groupMates.length }} in Group {{ manager?.group }}
              </template>
              <template v-else-if="uclOwnerCount">
                · {{ uclOwnerCount }} in the Champions League
              </template>
            </p>
            <p
              v-if="nextOpponentOwner && nextOpponent"
              class="mb-3 rounded-sm border border-cyan/20 bg-cyan/10 px-3 py-2 text-sm text-white"
            >
              {{ nextOpponent.name }} also owns him
              <span v-if="nextOpponentOwner.isCaptain" class="font-stats text-kicker tracking-kicker text-cyan uppercase"> · C</span>
              <span v-else-if="nextOpponentOwner.onBench" class="text-silver-dim"> · Bench</span>
            </p>
            <p v-else-if="ownershipPending && !ownership" class="text-sm text-silver-dim">
              Loading owners…
            </p>
            <p v-else-if="!owners.length" class="text-sm text-silver-dim">
              Nobody in this league owns {{ player.webName }}.
            </p>
            <p v-else-if="ownership && !ownership.picksComplete" class="mb-3 text-sm text-silver-dim">
              Still fetching a few squads.
            </p>

            <div v-if="owners.length" class="space-y-4">
              <div v-if="grouped.thisTeam">
                <p class="mb-2 font-stats text-kicker tracking-kicker text-silver-dim uppercase">
                  This squad
                </p>
                <PlayerOwnersList
                  :owners="[grouped.thisTeam]"
                  v-bind="ownerListProps"
                />
              </div>
              <div v-if="grouped.groupMates.length && manager">
                <p class="mb-2 font-stats text-kicker tracking-kicker text-silver-dim uppercase">
                  Group {{ manager.group }}
                </p>
                <PlayerOwnersList
                  :owners="grouped.groupMates"
                  v-bind="ownerListProps"
                />
              </div>
              <div v-if="grouped.ucl.length">
                <p class="mb-2 font-stats text-kicker tracking-kicker text-silver-dim uppercase">
                  Champions League
                </p>
                <PlayerOwnersList
                  :owners="grouped.ucl"
                  v-bind="ownerListProps"
                />
              </div>
              <div v-if="grouped.league.length">
                <p class="mb-2 font-stats text-kicker tracking-kicker text-silver-dim uppercase">
                  Mini-league
                </p>
                <PlayerOwnersList
                  :owners="grouped.league"
                  v-bind="ownerListProps"
                />
              </div>
            </div>
          </section>
        </div>
      </aside>
    </div>
  </Teleport>
</template>
