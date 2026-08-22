<script setup lang="ts">
import { useNow } from '@vueuse/core'
import { matchdays } from '../../../data'
import { countdownParts, currentLiveEvent, matchdayForEvent, nextDeadlineEvent } from '../../../lib/engine/deadline'

const { snapshot } = useCompetition()
const now = useNow({ interval: 1000 })
const ready = ref(false)

onMounted(() => {
  ready.value = true
})

const upcoming = computed(() => {
  const events = snapshot.value?.events ?? []
  if (ready.value) return nextDeadlineEvent(events, now.value.getTime())
  return events.find((event) => event.isNext) ?? events.find((event) => !event.finished && event.deadlineTime)
})
const live = computed(() => currentLiveEvent(snapshot.value?.events ?? []))
const mapped = computed(() => matchdayForEvent(upcoming.value ?? live.value, matchdays))

const parts = computed(() => {
  if (!ready.value || !upcoming.value?.deadlineTime) return null
  return countdownParts(new Date(upcoming.value.deadlineTime).getTime() - now.value.getTime())
})

function pad(value: number) {
  return String(value).padStart(2, '0')
}
</script>

<template>
  <div class="rounded-md border border-cyan/20 bg-navy-800/80 px-4 py-3 shadow-card">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p class="font-stats text-kicker tracking-kicker text-cyan uppercase">
          {{ live && !upcoming ? 'Gameweek live' : 'Next deadline' }}
        </p>
        <p class="font-display text-sm tracking-wide text-white uppercase sm:text-base">
          {{ mapped?.label ?? upcoming?.name ?? live?.name ?? 'FPL deadline' }}
        </p>
      </div>
      <p v-if="live && !upcoming" class="font-stats text-label tracking-kicker text-live uppercase">
        Scores updating
      </p>
      <dl v-else-if="parts" class="flex items-end gap-3 font-stats tabular-nums">
        <div v-if="parts.days > 0">
          <dt class="text-kicker tracking-kicker text-silver uppercase">Days</dt>
          <dd class="text-2xl leading-none text-white">{{ pad(parts.days) }}</dd>
        </div>
        <div>
          <dt class="text-kicker tracking-kicker text-silver uppercase">Hrs</dt>
          <dd class="text-2xl leading-none text-white">{{ pad(parts.hours) }}</dd>
        </div>
        <div>
          <dt class="text-kicker tracking-kicker text-silver uppercase">Min</dt>
          <dd class="text-2xl leading-none text-white">{{ pad(parts.minutes) }}</dd>
        </div>
        <div>
          <dt class="text-kicker tracking-kicker text-silver uppercase">Sec</dt>
          <dd class="text-2xl leading-none text-star">{{ pad(parts.seconds) }}</dd>
        </div>
      </dl>
    </div>
  </div>
</template>
