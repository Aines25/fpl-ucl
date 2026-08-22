<script setup lang="ts">
import { RefreshCw } from '@lucide/vue'
import { competition } from '../../../data/competition'

const { snapshot } = useCompetition()
const refreshing = ref(false)

async function refresh() {
  if (refreshing.value)
    return
  refreshing.value = true
  try {
    await refreshNuxtData()
  }
  finally {
    refreshing.value = false
  }
}
</script>

<template>
  <header class="relative z-10 border-b border-cyan/20 bg-navy-950/80 backdrop-blur-md">
    <div class="mx-auto flex max-w-page items-center gap-3 px-4 py-3 sm:px-6">
      <NuxtLink to="/" class="flex min-w-0 flex-1 items-center gap-3">
        <StarballMark size="sm" />
        <div class="min-w-0">
          <p class="font-stats text-kicker tracking-kicker text-cyan uppercase">
            {{ competition.season }}
          </p>
          <h1 class="font-display text-lg tracking-display text-white uppercase sm:text-xl">
            {{ competition.name }}
          </h1>
        </div>
      </NuxtLink>
      <div class="hidden text-right sm:block">
        <p class="font-stats text-kicker tracking-kicker text-silver uppercase">
          {{ snapshot?.currentLabel ?? 'Matchday 1' }}
        </p>
        <p class="font-stats text-sm text-white">
          GW {{ snapshot?.currentGameweek ?? 1 }}
        </p>
      </div>
      <button
        type="button"
        class="shrink-0 p-2.5 text-silver transition-colors hover:text-white"
        aria-label="Refresh"
        :disabled="refreshing"
        @click="refresh"
      >
        <RefreshCw :class="['size-4', refreshing && 'animate-spin']" />
      </button>
    </div>
  </header>
</template>
