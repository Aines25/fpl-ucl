<script setup lang="ts">
import { matchdays } from '../../../../data'

const route = useRoute()
const requestUrl = useRequestURL()
const md = Number(route.params.md)
const map = matchdays.find((entry) => entry.matchday === md)

if (!map) {
  throw createError({ statusCode: 404, statusMessage: 'Matchday not found' })
}

useHead({ title: `${map.label} · Champions League` })
useSeoMeta({
  ogTitle: `${map.label} · Champions League`,
  ogDescription: `Matchday results · GW ${map.fplGameweek}`,
  ogImage: `${requestUrl.origin}/api/og/matchday/${md}`,
  twitterCard: 'summary_large_image',
  twitterImage: `${requestUrl.origin}/api/og/matchday/${md}`,
})
</script>

<template>
  <div class="max-w-xl space-y-4">
    <SectionHeading :kicker="`GW ${map.fplGameweek}`" :title="map.label" />
    <p class="text-silver">
      Paste this link in WhatsApp to share the matchday graphic, or save the image.
    </p>
    <img
      :src="`/api/og/matchday/${md}`"
      alt=""
      class="w-full rounded-md border border-cyan/20"
    >
    <div class="flex flex-wrap gap-2">
      <ShareImageButton
        :href="`/api/og/matchday/${md}?size=square`"
        :filename="`matchday-${md}.png`"
      />
      <NuxtLink to="/fixtures" class="font-stats text-kicker tracking-kicker text-cyan uppercase hover:text-white">
        Open fixtures
      </NuxtLink>
    </div>
  </div>
</template>
