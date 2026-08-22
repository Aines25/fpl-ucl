<script setup lang="ts">
import { competition } from '../../../data/competition'

const { snapshot } = useCompetition()
</script>

<template>
  <header class="relative z-10 border-b border-cyan/20 bg-navy-950/80 backdrop-blur-md">
    <div class="mx-auto flex max-w-page items-center gap-3 px-4 py-3 sm:px-6">
      <StarballMark size="sm" />
      <div class="min-w-0 flex-1">
        <p class="font-stats text-kicker tracking-kicker text-cyan uppercase">
          {{ competition.season }}
        </p>
        <h1 class="font-display text-lg tracking-display text-white uppercase sm:text-xl">
          {{ competition.name }}
        </h1>
      </div>
      <div class="hidden text-right sm:block">
        <p class="font-stats text-kicker tracking-kicker text-silver uppercase">
          {{ snapshot?.currentLabel ?? 'Matchday 1' }}
        </p>
        <p class="font-stats text-sm text-white">
          GW {{ snapshot?.currentGameweek ?? 1 }}
        </p>
      </div>
    </div>
  </header>
</template>
