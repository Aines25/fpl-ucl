<script setup lang="ts">
import { Check, Copy, Share2 } from '@lucide/vue'
import type { FixtureResult, TournamentFixture } from '../../../lib/types/competition'
import { getPlayer } from '../../../data/players'

const props = defineProps<{
  fixture: TournamentFixture
  result?: FixtureResult
  homeScore?: number | null
  awayScore?: number | null
}>()

const copied = ref(false)
const canShare = computed(() => import.meta.client && typeof navigator !== 'undefined' && Boolean(navigator.share))

const home = computed(() => getPlayer(props.fixture.homeId))
const away = computed(() => getPlayer(props.fixture.awayId))
const homePts = computed(() => props.result?.homeScore ?? props.homeScore ?? null)
const awayPts = computed(() => props.result?.awayScore ?? props.awayScore ?? null)

const headline = computed(() => {
  const left = homePts.value === null ? '–' : String(homePts.value)
  const right = awayPts.value === null ? '–' : String(awayPts.value)
  return `${home.value.name} ${left}–${right} ${away.value.name}`
})

const shareUrl = computed(() => {
  if (!import.meta.client) return ''
  return `${window.location.origin}/match/${props.fixture.id}`
})

const shareText = computed(() => {
  const stage = props.fixture.group ? `Group ${props.fixture.group}` : props.fixture.stage.replaceAll('-', ' ')
  return `${headline.value} · ${stage} · GW${props.fixture.fplGameweek}`
})

async function copyLink() {
  try {
    await navigator.clipboard.writeText(`${shareText.value}\n${shareUrl.value}`)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 1600)
  }
  catch {
    copied.value = false
  }
}

async function share() {
  if (canShare.value) {
    try {
      await navigator.share({
        title: headline.value,
        text: shareText.value,
        url: shareUrl.value,
      })
      return
    }
    catch {
      // Fall through to copy if the user cancels or share is unavailable.
    }
  }
  await copyLink()
}
</script>

<template>
  <aside class="overflow-hidden rounded-md border border-cyan/20 bg-navy-800/80 shadow-card">
    <div class="border-b border-cyan/15 px-4 py-3">
      <p class="font-stats text-kicker tracking-kicker text-cyan uppercase">
        {{ fixture.group ? `Group ${fixture.group}` : fixture.stage.replaceAll('-', ' ') }}
        · GW {{ fixture.fplGameweek }}
      </p>
      <div class="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <p class="truncate font-display text-sm tracking-wide text-white uppercase">
          {{ home.name }}
        </p>
        <p class="font-stats text-2xl tabular-nums text-star">
          {{ homePts === null ? '–' : homePts }}–{{ awayPts === null ? '–' : awayPts }}
        </p>
        <p class="truncate text-right font-display text-sm tracking-wide text-white uppercase">
          {{ away.name }}
        </p>
      </div>
    </div>
    <div class="flex items-center justify-end gap-2 px-3 py-2">
      <button
        type="button"
        class="inline-flex items-center gap-1.5 px-2 py-1.5 font-stats text-kicker tracking-kicker text-silver uppercase hover:text-white"
        @click="copyLink"
      >
        <Check v-if="copied" class="size-3.5 text-final" />
        <Copy v-else class="size-3.5" />
        {{ copied ? 'Copied' : 'Copy' }}
      </button>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 px-2 py-1.5 font-stats text-kicker tracking-kicker text-cyan uppercase hover:text-white"
        @click="share"
      >
        <Share2 class="size-3.5" />
        Share
      </button>
    </div>
  </aside>
</template>
