<script setup lang="ts">
import { groupIds } from '../../data'

const { snapshot } = useCompetition()
</script>

<template>
  <div>
    <SectionHeading kicker="Group stage" title="Groups" />
    <QualificationBar class="mb-6" />
    <div class="grid gap-6 xl:grid-cols-2">
      <div v-for="group in groupIds" :key="group" class="space-y-3">
        <GroupTable
          :group="group"
          :rows="snapshot?.standings?.[group] ?? []"
        />
        <QualificationCard
          v-if="snapshot?.scenarios?.[group]"
          :scenarios="snapshot.scenarios[group]"
        />
      </div>
    </div>
  </div>
</template>
