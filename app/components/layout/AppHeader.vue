<script setup lang="ts">
import { RefreshCw } from '@lucide/vue'
import { competition } from '../../../data/competition'

const MIN_VISIBLE_MS = 500
const UPDATED_MS = 1800

const { snapshot } = useCompetition()
const refreshing = ref(false)
const justUpdated = ref(false)

let updatedTimer: ReturnType<typeof setTimeout> | undefined

const statusLabel = computed(() => {
  if (refreshing.value)
    return 'Refreshing'
  if (justUpdated.value)
    return 'Updated'
  return snapshot.value?.currentLabel ?? 'Matchday 1'
})

async function refresh() {
  if (refreshing.value)
    return

  justUpdated.value = false
  if (updatedTimer) {
    clearTimeout(updatedTimer)
    updatedTimer = undefined
  }

  refreshing.value = true
  const started = Date.now()
  let succeeded = false
  try {
    await refreshNuxtData()
    succeeded = true
  }
  finally {
    const remaining = MIN_VISIBLE_MS - (Date.now() - started)
    if (remaining > 0)
      await new Promise(resolve => setTimeout(resolve, remaining))
    refreshing.value = false
    if (succeeded) {
      justUpdated.value = true
      updatedTimer = setTimeout(() => {
        justUpdated.value = false
        updatedTimer = undefined
      }, UPDATED_MS)
    }
  }
}

onUnmounted(() => {
  if (updatedTimer)
    clearTimeout(updatedTimer)
})
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
      <div class="shrink-0 text-right">
        <p
          class="font-stats text-kicker tracking-kicker uppercase"
          :class="refreshing || justUpdated ? 'text-cyan' : 'hidden text-silver sm:block'"
          aria-live="polite"
        >
          {{ statusLabel }}
        </p>
        <p class="hidden font-stats text-sm text-white sm:block">
          GW {{ snapshot?.currentGameweek ?? 1 }}
        </p>
      </div>
      <button
        type="button"
        class="shrink-0 p-2.5 transition-colors disabled:pointer-events-none"
        :class="refreshing || justUpdated ? 'text-cyan' : 'text-silver hover:text-white'"
        :aria-label="refreshing ? 'Refreshing' : justUpdated ? 'Updated' : 'Refresh'"
        :aria-busy="refreshing"
        :disabled="refreshing"
        @click="refresh"
      >
        <RefreshCw :class="['size-4', refreshing && 'animate-spin']" />
      </button>
    </div>
    <div
      class="refresh-bar pointer-events-none absolute inset-x-0 bottom-0 h-0.5 origin-left bg-cyan shadow-[0_0_8px_var(--ucl-cyan)]"
      :class="{
        'refresh-bar--active': refreshing,
        'refresh-bar--done': justUpdated,
      }"
      aria-hidden="true"
    />
  </header>
</template>

<style scoped>
.refresh-bar {
  transform: scaleX(0);
  opacity: 0;
}

.refresh-bar--active {
  animation: refresh-grow 0.5s ease-out forwards;
}

.refresh-bar--done {
  animation: refresh-fade 0.35s ease-out forwards;
}

@keyframes refresh-grow {
  from {
    transform: scaleX(0);
    opacity: 1;
  }
  to {
    transform: scaleX(1);
    opacity: 1;
  }
}

@keyframes refresh-fade {
  from {
    transform: scaleX(1);
    opacity: 1;
  }
  to {
    transform: scaleX(1);
    opacity: 0;
  }
}
</style>
