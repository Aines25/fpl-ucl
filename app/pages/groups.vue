<script setup lang="ts">
import { groupIds } from '../../data'

const { snapshot } = useCompetition()
</script>

<template>
  <div>
    <SectionHeading kicker="Group stage" title="Groups" />
    <QualificationBar class="mb-6" />
    <div class="grid gap-6 xl:grid-cols-2">
      <GroupTable
        v-for="group in groupIds"
        :key="group"
        :group="group"
        :rows="snapshot?.standings[group] ?? []"
      />
    </div>
  </div>
</template>
