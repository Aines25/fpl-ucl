<script setup lang="ts">
import type { FixtureStatus } from '../../../lib/types/competition'
import { Badge } from '@/components/ui/badge'

defineProps<{
  status: FixtureStatus
}>()

const labels: Record<FixtureStatus, string> = {
  scheduled: 'Scheduled',
  live: 'Live',
  provisional: 'Provisional',
  final: 'Final',
}

const classes: Record<FixtureStatus, string> = {
  scheduled: 'rounded-sm border-silver/30 bg-navy-900 font-stats tracking-kicker text-silver uppercase',
  live: 'rounded-sm border-live/40 bg-live/15 font-stats tracking-kicker text-live uppercase',
  provisional: 'rounded-sm border-provisional/40 bg-provisional/15 font-stats tracking-kicker text-provisional uppercase',
  final: 'rounded-sm border-final/40 bg-final/15 font-stats tracking-kicker text-final uppercase',
}
</script>

<template>
  <Badge variant="outline" :class="classes[status]">
    {{ labels[status] }}
  </Badge>
</template>
