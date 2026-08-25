<script setup lang="ts">
import { matchdays } from '../../../data'

const route = useRoute()
const requestUrl = useRequestURL()
const { snapshot } = useCompetition()
const md = computed(() => Number(route.query.md) || snapshot.value?.currentMatchday || 1)
const map = computed(() => matchdays.find((entry) => entry.matchday === md.value))

useHead({ title: 'Group tables · Champions League' })
useSeoMeta({
  ogTitle: 'Group tables · Champions League',
  ogDescription: () => map.value ? `${map.value.label} · GW ${map.value.fplGameweek}` : 'Champions League groups',
  ogImage: () => `${requestUrl.origin}/api/og/groups?md=${md.value}`,
  twitterCard: 'summary_large_image',
  twitterImage: () => `${requestUrl.origin}/api/og/groups?md=${md.value}`,
})
</script>

<template>
  <div class="max-w-xl space-y-4">
    <SectionHeading kicker="Champions League" title="Group tables" />
    <p class="text-silver">
      Paste this link in WhatsApp to share the tables graphic, or save the image.
    </p>
    <ClientOnly>
      <img
        :src="`/api/og/groups?md=${md}`"
        alt=""
        class="w-full rounded-md border border-cyan/20"
      >
    </ClientOnly>
    <div class="flex flex-wrap gap-2">
      <ShareImageButton
        :href="`/api/og/groups?md=${md}&size=square`"
        :filename="`groups-md${md}.png`"
      />
      <NuxtLink to="/groups" class="font-stats text-kicker tracking-kicker text-cyan uppercase hover:text-white">
        Open groups
      </NuxtLink>
    </div>
  </div>
</template>
