<script setup lang="ts">
import { Check, Copy } from '@lucide/vue'
import { fixtures, matchdays } from '../../../data'
import { getPlayer } from '../../../data/players'

const props = defineProps<{
  matchday?: number
}>()

const { snapshot } = useCompetition()
const { resultById } = useFixtures()
const copied = ref(false)
const matchday = computed(() => props.matchday ?? snapshot.value?.currentMatchday ?? 1)

const current = computed(() => {
  const matchday = props.matchday ?? snapshot.value?.currentMatchday ?? 1
  return fixtures.filter((fixture) => fixture.matchday === matchday)
})

const sharePage = computed(() => {
  if (!import.meta.client) return ''
  return `${window.location.origin}/share/matchday/${matchday.value}`
})

const digest = computed(() => {
  const map = matchdays.find((entry) => entry.matchday === matchday.value)
  const label = map?.label ?? snapshot.value?.currentLabel ?? 'Matchday'
  const lines = current.value.map((fixture) => {
    const result = resultById.value.get(fixture.id)
    const home = getPlayer(fixture.homeId).name
    const away = getPlayer(fixture.awayId).name
    const left = result?.homeScore ?? '–'
    const right = result?.awayScore ?? '–'
    const group = fixture.group ? `Group ${fixture.group}` : fixture.stage.replaceAll('-', ' ')
    return `${group}: ${home} ${left}–${right} ${away}`
  })
  return [`${label} · Champions League`, ...lines, '', sharePage.value].filter((line) => line !== undefined).join('\n')
})

async function copyDigest() {
  try {
    await navigator.clipboard.writeText(digest.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 1600)
  }
  catch {
    copied.value = false
  }
}
</script>

<template>
  <div class="flex flex-wrap justify-end gap-2">
    <ShareImageButton
      :href="`/api/og/matchday/${matchday}?size=square`"
      :filename="`matchday-${matchday}.png`"
      label="Matchday image"
    />
    <ShareImageButton
      :href="`/api/og/groups?md=${matchday}&size=square`"
      :filename="`groups-md${matchday}.png`"
      label="Tables image"
    />
    <button
      type="button"
      class="inline-flex items-center gap-1.5 font-stats text-kicker tracking-kicker text-silver uppercase hover:text-white"
      @click="copyDigest"
    >
      <Check v-if="copied" class="size-3.5 text-final" />
      <Copy v-else class="size-3.5" />
      {{ copied ? 'Results copied' : 'Copy matchday results' }}
    </button>
  </div>
</template>
