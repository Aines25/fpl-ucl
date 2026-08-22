<script setup lang="ts">
import type { TournamentFixture } from '../../../lib/types/competition'
import { Card, CardContent } from '@/components/ui/card'

defineProps<{
  fixture: TournamentFixture
  remainingHome?: number
  remainingAway?: number
}>()
</script>

<template>
  <Card class="gap-0 rounded-md border-live/30 bg-navy-800/80 py-0">
    <CardContent class="p-4">
      <p class="mb-2 font-stats text-kicker tracking-kicker text-live uppercase">
        Live
      </p>
      <FixtureCard :fixture="fixture" />
      <p v-if="remainingHome !== undefined || remainingAway !== undefined" class="mt-3 font-stats text-label text-silver">
        Players remaining · {{ remainingHome ?? '–' }} / {{ remainingAway ?? '–' }}
      </p>
    </CardContent>
  </Card>
</template>
