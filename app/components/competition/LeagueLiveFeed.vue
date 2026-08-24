<script setup lang="ts">
import { ChevronDown } from '@lucide/vue'
import { breakdownLineLabel, FEED_PAGE_SIZE, formatFeedTime, paginateFeed, signedPointsLabel } from '../../../lib/engine/live'
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

function gameweekPointsLabel(points: number) {
  return `${points} pts this GW`
}
</script>

<template>
  <div class="flex flex-col rounded-md border border-cyan/20 bg-navy-800/80 shadow-card lg:max-h-[inherit] lg:overflow-hidden">
    <div class="shrink-0 border-b border-cyan/15 px-4 py-3">
      <p class="font-stats text-kicker tracking-kicker text-live uppercase">
        Live feed
      </p>
      <p class="mt-1 text-sm text-silver">
        Latest events from matches still in play. Click a row to see who owns them.
      </p>
    </div>

    <p v-if="!visibleEvents.length" class="px-4 py-6 font-stats text-label text-silver uppercase">
      {{ remaining ? 'No live events from unfinished matches.' : 'No live events yet. Goals, assists and cards appear here as FPL updates.' }}
    </p>

    <ul v-else class="divide-y divide-cyan/10 lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain">
      <li v-for="event in visibleEvents" :key="event.id">
        <button
          type="button"
          class="group grid w-full cursor-pointer grid-cols-[6.5rem_1fr_auto] items-start gap-3 px-4 py-3 text-left hover:bg-cyan/5 lg:grid-cols-1 xl:grid-cols-[7.5rem_1fr]"
          :aria-expanded="expandedEventId === event.id"
          @click="togglePlayer(event.id)"
        >
          <p class="font-stats text-[11px] leading-tight text-silver-dim uppercase">
            {{ formatFeedTime(event.at) }}
          </p>
          <div class="min-w-0 lg:flex lg:items-start lg:justify-between lg:gap-3 xl:block">
            <div>
              <span class="inline-flex items-center gap-1 font-medium text-white group-hover:text-cyan">
                {{ event.webName }}
                <ChevronDown
                  class="size-3.5 text-silver-dim transition-transform"
                  :class="expandedEventId === event.id ? 'rotate-180 text-cyan' : ''"
                />
              </span>
              <p v-if="event.teamShortName" class="text-[11px] text-silver-dim">
                {{ event.teamShortName }}
              </p>
            </div>
            <p
              class="text-right font-stats text-label lg:shrink-0"
              :class="event.points < 0 ? 'text-live' : 'text-final'"
            >
              {{ event.label }} {{ signedPointsLabel(event.points) }}
            </p>
          </div>
        </button>
        <div
          v-if="expandedEventId === event.id"
          class="border-t border-cyan/10 bg-navy-900/60 px-4 py-3"
        >
          <div class="mb-3">
            <p
              class="mb-1.5 text-right font-stats text-label"
              :class="(event.gameweekPoints ?? 0) < 0 ? 'text-live' : 'text-final'"
            >
              {{ gameweekPointsLabel(event.gameweekPoints ?? 0) }}
            </p>
            <ul v-if="event.gameweekBreakdown?.length" class="space-y-1">
              <li
                v-for="line in event.gameweekBreakdown"
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
          </div>
          <p class="mb-2 font-stats text-kicker tracking-kicker text-silver uppercase">
            Owned by {{ ownersFor(event.elementId).length }}
          </p>
          <PlayerOwnersList
            :owners="ownersFor(event.elementId)"
            :empty-label="`Nobody in this league owns ${event.webName}.`"
          />
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
