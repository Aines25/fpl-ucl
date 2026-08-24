<script setup lang="ts">
import type { LiveOwner } from '../../../lib/types/league'

const props = withDefaults(defineProps<{
  owners: LiveOwner[]
  currentManagerId?: number | null
  currentEntryId?: number | null
  nextOpponentId?: number | null
  emptyLabel?: string
}>(), {
  currentManagerId: null,
  currentEntryId: null,
  nextOpponentId: null,
  emptyLabel: '',
})

function isCurrent(owner: LiveOwner) {
  if (props.currentManagerId && owner.competitionPlayerId === props.currentManagerId) return true
  if (props.currentEntryId && owner.entryId === props.currentEntryId) return true
  return false
}

function isNext(owner: LiveOwner) {
  return Boolean(props.nextOpponentId && owner.competitionPlayerId === props.nextOpponentId)
}

function teamPath(owner: LiveOwner) {
  if (!owner.competitionPlayerId || isCurrent(owner)) return null
  return `/team/${owner.competitionPlayerId}`
}
</script>

<template>
  <p v-if="!owners.length && emptyLabel" class="text-sm text-silver-dim">
    {{ emptyLabel }}
  </p>
  <ul v-else class="space-y-1.5">
    <li
      v-for="owner in owners"
      :key="owner.entryId"
      class="flex items-baseline justify-between gap-3 text-sm"
    >
      <span class="min-w-0">
        <NuxtLink
          v-if="teamPath(owner)"
          :to="teamPath(owner)!"
          class="text-white hover:text-cyan"
        >
          {{ owner.playerName }}
        </NuxtLink>
        <span v-else class="text-white">{{ owner.playerName }}</span>
        <span class="ml-2 text-silver-dim">{{ owner.entryName }}</span>
      </span>
      <span class="shrink-0 font-stats text-kicker tracking-kicker uppercase text-silver">
        <span v-if="isCurrent(owner)" class="text-star">This team</span>
        <span v-else-if="isNext(owner)" class="text-cyan">Next</span>
        <span v-if="owner.isCaptain" class="ml-1 text-cyan">C</span>
        <span v-else-if="owner.isViceCaptain" class="ml-1 text-silver-dim">V</span>
        <span v-if="owner.onBench" class="ml-1 text-silver-dim">Bench</span>
      </span>
    </li>
  </ul>
</template>
