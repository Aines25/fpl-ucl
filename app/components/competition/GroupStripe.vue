<script setup lang="ts">
import type { GroupId } from '../../../lib/types/competition'

defineProps<{
  group: GroupId
}>()
</script>

<template>
  <span
    :class="['inline-block h-full w-1 shrink-0', {
      'bg-group-a': group === 'A',
      'bg-group-b': group === 'B',
      'bg-group-c': group === 'C',
      'bg-group-d': group === 'D',
      'bg-group-e': group === 'E',
      'bg-group-f': group === 'F',
      'bg-group-g': group === 'G',
      'bg-group-h': group === 'H',
    }]"
    aria-hidden="true"
  />
</template>
