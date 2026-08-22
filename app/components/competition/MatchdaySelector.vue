<script setup lang="ts">
import { matchdays } from '../../../data/matchdays'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const selected = defineModel<number>({ required: true })

const options = matchdays
</script>

<template>
  <Tabs :model-value="String(selected)" @update:model-value="selected = Number($event)">
    <TabsList class="h-auto w-full flex-wrap justify-start rounded-md bg-navy-900 p-1">
      <TabsTrigger
        v-for="option in options"
        :key="option.matchday"
        :value="String(option.matchday)"
        class="rounded-sm font-stats text-kicker tracking-kicker px-3 py-2 uppercase data-[state=active]:bg-navy-700 data-[state=active]:text-cyan"
      >
        {{ option.stage === 'group' ? `MD${option.matchday}` : option.label }}
      </TabsTrigger>
    </TabsList>
  </Tabs>
</template>
