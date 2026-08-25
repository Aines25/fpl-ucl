<script setup lang="ts">
import { leagueShareImageParts } from '../../../lib/engine/share-cards'

useHead({ title: 'League table · Champions League' })
const requestUrl = useRequestURL()
const parts = leagueShareImageParts()
useSeoMeta({
  ogTitle: 'League table · Champions League',
  ogDescription: 'Mini-league standings with captains, transfers, and hits.',
  ogImage: `${requestUrl.origin}/api/og/league?part=1`,
  twitterCard: 'summary_large_image',
  twitterImage: `${requestUrl.origin}/api/og/league?part=1`,
})
</script>

<template>
  <div class="max-w-xl space-y-4">
    <SectionHeading kicker="Mini-league" title="League table" />
    <p class="text-silver">
      Paste this link in WhatsApp to share the league graphic, or save the three images.
    </p>
    <ClientOnly>
      <div class="space-y-3">
        <img
          v-for="part in parts"
          :key="part.href"
          :src="part.href"
          alt=""
          class="w-full rounded-md border border-cyan/20"
        >
      </div>
    </ClientOnly>
    <div class="flex flex-wrap gap-2">
      <ShareImageButton :items="parts" />
      <NuxtLink to="/league" class="font-stats text-kicker tracking-kicker text-cyan uppercase hover:text-white">
        Open league
      </NuxtLink>
    </div>
  </div>
</template>
