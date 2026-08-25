<script setup lang="ts">
import { Check, Download, Share2 } from '@lucide/vue'

const props = defineProps<{
  href?: string
  filename?: string
  items?: Array<{ href: string, filename: string }>
  label?: string
}>()

const busy = ref(false)
const copied = ref(false)
const canShare = computed(() => import.meta.client && typeof navigator !== 'undefined' && Boolean(navigator.share && navigator.canShare))
const specs = computed(() => {
  if (props.items?.length) return props.items
  if (props.href && props.filename) return [{ href: props.href, filename: props.filename }]
  return []
})

async function filesFromSpecs() {
  const results = await Promise.all(specs.value.map(async (spec) => {
    const response = await fetch(spec.href)
    if (!response.ok) return null
    const blob = await response.blob()
    return new File([blob], spec.filename, { type: 'image/png' })
  }))
  const files = results.filter((file): file is File => file != null)
  if (!files.length) throw new Error('Could not build image')
  return files
}

function isAbort(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError'
}

async function downloadFiles(files: File[]) {
  for (const [index, file] of files.entries()) {
    const url = URL.createObjectURL(file)
    const link = document.createElement('a')
    link.href = url
    link.download = file.name
    link.click()
    URL.revokeObjectURL(url)
    if (index < files.length - 1) await new Promise((resolve) => setTimeout(resolve, 400))
  }
}

async function shareImage() {
  if (!specs.value.length) return
  busy.value = true
  try {
    const files = await filesFromSpecs()
    if (canShare.value) {
      const payload = { files, title: files[0]?.name ?? 'share.png' }
      if (navigator.canShare?.(payload)) {
        try {
          await navigator.share(payload)
          return
        }
        catch (error) {
          if (isAbort(error)) return
        }
      }
    }
    await downloadFiles(files)
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
