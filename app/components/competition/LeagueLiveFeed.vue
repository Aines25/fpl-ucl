<script setup lang="ts">
import { ChevronDown } from '@lucide/vue'
import { FEED_PAGE_SIZE, formatFeedTime, paginateFeed } from '../../../lib/engine/live'
import type { LiveFeedEvent, LiveOwner } from '../../../lib/types/league'

const props = defineProps<{
  events: LiveFeedEvent[]
  ownersByPlayer: Record<number, LiveOwner[]>
}>()

const expandedEventId = ref<string | null>(null)
const showAll = ref(false)

const page = computed(() => paginateFeed(props.events, showAll.value ? Number.POSITIVE_INFINITY : FEED_PAGE_SIZE))
const visibleEvents = computed(() => page.value.visible)
const remaining = computed(() => page.value.remaining)

function ownersFor(elementId: number) {
  return props.ownersByPlayer[elementId] ?? []
}

function togglePlayer(eventId: string) {
  expandedEventId.value = expandedEventId.value === eventId ? null : eventId
}

function loadAll() {
  showAll.value = true
}

function pointsLabel(points: number) {
  return points > 0 ? `+${points} pts` : `${points} pts`
}
</script>

<template>
  <div class="flex h-full max-h-full flex-col overflow-hidden rounded-md border border-cyan/20 bg-navy-800/80 shadow-card">
    <div class="shrink-0 border-b border-cyan/15 px-4 py-3">
      <p class="font-stats text-kicker tracking-kicker text-live uppercase">
        Live feed
      </p>
      <p class="mt-1 text-sm text-silver">
        Latest events from matches still in play. Click a player to see who owns them.
      </p>
    </div>

    <p v-if="!visibleEvents.length" class="px-4 py-6 font-stats text-label text-silver uppercase">
      {{ remaining ? 'No live events from unfinished matches.' : 'No live events yet. Goals, assists and cards appear here as FPL updates.' }}
    </p>

    <ul v-else class="min-h-0 flex-1 divide-y divide-cyan/10 overflow-y-auto overscroll-contain">
      <li v-for="event in visibleEvents" :key="event.id">
        <div class="grid grid-cols-[6.5rem_1fr_auto] items-start gap-3 px-4 py-3 lg:grid-cols-1 xl:grid-cols-[7.5rem_1fr]">
          <p class="font-stats text-[11px] leading-tight text-silver-dim uppercase">
            {{ formatFeedTime(event.at) }}
          </p>
          <div class="min-w-0 lg:flex lg:items-start lg:justify-between lg:gap-3 xl:block">
            <div>
              <button
                type="button"
                class="inline-flex items-center gap-1 text-left font-medium text-white hover:text-cyan"
                :aria-expanded="expandedEventId === event.id"
                @click="togglePlayer(event.id)"
              >
                {{ event.webName }}
                <ChevronDown
                  class="size-3.5 text-silver-dim transition-transform"
                  :class="expandedEventId === event.id ? 'rotate-180 text-cyan' : ''"
                />
              </button>
              <p v-if="event.teamShortName" class="text-[11px] text-silver-dim">
                {{ event.teamShortName }}
              </p>
            </div>
            <p
              class="text-right font-stats text-label lg:shrink-0"
              :class="event.points < 0 ? 'text-live' : 'text-final'"
            >
              {{ event.label }} {{ pointsLabel(event.points) }}
            </p>
          </div>
        </div>
        <div
          v-if="expandedEventId === event.id"
          class="border-t border-cyan/10 bg-navy-900/60 px-4 py-3"
        >
          <p class="mb-2 font-stats text-kicker tracking-kicker text-silver uppercase">
            Owned by {{ ownersFor(event.elementId).length }}
          </p>
          <p v-if="!ownersFor(event.elementId).length" class="text-sm text-silver-dim">
            Nobody in this league owns {{ event.webName }}.
          </p>
          <ul v-else class="space-y-1.5">
            <li
              v-for="owner in ownersFor(event.elementId)"
              :key="owner.entryId"
              class="flex items-baseline justify-between gap-3 text-sm"
            >
              <span>
                <span class="text-white">{{ owner.playerName }}</span>
                <span class="ml-2 text-silver-dim">{{ owner.entryName }}</span>
              </span>
              <span class="font-stats text-kicker tracking-kicker uppercase text-silver">
                <span v-if="owner.isCaptain" class="text-cyan">C</span>
                <span v-else-if="owner.isViceCaptain" class="text-silver-dim">V</span>
                <span v-if="owner.onBench" class="ml-1 text-silver-dim">Bench</span>
              </span>
            </li>
          </ul>
        </div>
      </li>
    </ul>

    <div v-if="remaining" class="shrink-0 border-t border-cyan/15 p-3">
      <button
        type="button"
        class="w-full rounded-sm border border-cyan/20 px-3 py-2 font-stats text-kicker tracking-kicker text-cyan uppercase hover:bg-cyan/10 hover:text-white"
        @click="loadAll"
      >
        Load all this GW · {{ remaining }} left
      </button>
    </div>
  </div>
</template>
