<script setup lang="ts">
useHead({ title: 'League table · Champions League' })
const requestUrl = useRequestURL()
useSeoMeta({
  ogTitle: 'League table · Champions League',
  ogDescription: 'Mini-league standings with captains, transfers, and hits.',
  ogImage: `${requestUrl.origin}/api/og/league`,
  twitterCard: 'summary_large_image',
  twitterImage: `${requestUrl.origin}/api/og/league`,
})
</script>

<template>
  <div class="max-w-xl space-y-4">
    <SectionHeading kicker="Mini-league" title="League table" />
    <p class="text-silver">
      Paste this link in WhatsApp to share the league graphic, or save the image.
    </p>
    <img
      src="/api/og/league"
      alt=""
      class="w-full rounded-md border border-cyan/20"
    >
    <div class="flex flex-wrap gap-2">
      <ShareImageButton
        href="/api/og/league"
        filename="league.png"
      />
      <NuxtLink to="/league" class="font-stats text-kicker tracking-kicker text-cyan uppercase hover:text-white">
        Open league
      </NuxtLink>
    </div>
  </div>
</template>
