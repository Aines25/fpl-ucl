<script setup lang="ts">
import { Check, Download, Share2 } from '@lucide/vue'

const props = defineProps<{
  href: string
  filename: string
  label?: string
}>()

const busy = ref(false)
const copied = ref(false)
const canShare = computed(() => import.meta.client && typeof navigator !== 'undefined' && Boolean(navigator.share && navigator.canShare))

async function fileFromHref() {
  const response = await fetch(props.href)
  if (!response.ok) throw new Error('Could not build image')
  const blob = await response.blob()
  return new File([blob], props.filename, { type: 'image/png' })
}

async function shareImage() {
  busy.value = true
  try {
    const file = await fileFromHref()
    if (canShare.value) {
      const payload = { files: [file], title: props.filename }
      if (navigator.canShare?.(payload)) {
        await navigator.share(payload)
        return
      }
    }
    const url = URL.createObjectURL(file)
    const link = document.createElement('a')
    link.href = url
    link.download = props.filename
    link.click()
    URL.revokeObjectURL(url)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 1600)
  }
  catch {
    copied.value = false
  }
  finally {
    busy.value = false
  }
}
</script>

<template>
  <button
    type="button"
    class="inline-flex items-center gap-1.5 px-2 py-1.5 font-stats text-kicker tracking-kicker text-cyan uppercase hover:text-white disabled:opacity-50"
    :disabled="busy"
    @click="shareImage"
  >
    <Check v-if="copied" class="size-3.5 text-final" />
    <Download v-else-if="!canShare" class="size-3.5" />
    <Share2 v-else class="size-3.5" />
    {{ copied ? 'Saved' : busy ? 'Preparing' : (label ?? 'Share image') }}
  </button>
</template>
