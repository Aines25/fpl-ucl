<script setup lang="ts">
import { groupIds } from '../../data'

const { snapshot } = useCompetition()
const requestUrl = useRequestURL()
const md = computed(() => snapshot.value?.currentMatchday ?? 1)

useSeoMeta({
  ogTitle: 'Groups · Champions League',
  ogDescription: 'Group tables and qualification.',
  ogImage: () => `${requestUrl.origin}/api/og/groups?md=${md.value}`,
  twitterCard: 'summary_large_image',
})
</script>

<template>
  <div>
    <SectionHeading kicker="Group stage" title="Groups" />
    <div class="mb-6 flex justify-end">
      <ShareImageButton
        :href="`/api/og/groups?md=${md}&size=square`"
        :filename="`groups-md${md}.png`"
        label="Tables image"
      />
    </div>
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
