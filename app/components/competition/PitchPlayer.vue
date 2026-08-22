<script setup lang="ts">
import type { SquadSlot } from '../../../lib/types/squad'

const props = withDefaults(defineProps<{
  player: SquadSlot
  size?: 'sm' | 'md'
}>(), {
  size: 'md',
})

const src = ref(props.player.photoUrl || props.player.shirtUrl)

watch(
  () => [props.player.photoUrl, props.player.shirtUrl],
  () => {
    src.value = props.player.photoUrl || props.player.shirtUrl
  },
)

function onError() {
  if (src.value && src.value === props.player.photoUrl && props.player.shirtUrl) {
    src.value = props.player.shirtUrl
    return
  }
  src.value = ''
}

const badge = computed(() => {
  if (props.player.multiplier >= 3) return '3x'
  if (props.player.isCaptain) return 'C'
  if (props.player.isViceCaptain) return 'V'
  return null
})
</script>

<template>
  <div
    :class="[
      'flex flex-col items-center text-center',
      size === 'sm' ? 'w-12 sm:w-14' : 'w-14 sm:w-16',
    ]"
  >
    <div class="relative">
      <div
        :class="[
          'overflow-hidden rounded-sm bg-navy-950/40',
          size === 'sm' ? 'h-12 w-10 sm:h-14 sm:w-11' : 'h-14 w-11 sm:h-16 sm:w-12',
        ]"
      >
        <img
          v-if="src"
          :src="src"
          :alt="player.webName"
          class="size-full object-contain object-bottom"
          loading="lazy"
          referrerpolicy="no-referrer"
          @error="onError"
        >
        <div
          v-else
          class="flex size-full items-center justify-center font-stats text-kicker text-silver uppercase"
        >
          {{ player.webName.slice(0, 2) }}
        </div>
      </div>
      <span
        v-if="badge"
        class="absolute -top-1 -right-1 rounded-sm bg-star px-1 font-stats text-[10px] leading-tight font-semibold text-navy-950"
      >
        {{ badge }}
      </span>
      <span
        :class="[
          'absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-sm px-1 font-stats text-[11px] leading-tight tabular-nums',
          player.counting ? 'bg-star text-navy-950' : 'bg-navy-950/80 text-silver',
        ]"
      >
        {{ player.points }}
      </span>
    </div>
    <p
      :class="[
        'mt-2 w-full truncate font-stats leading-tight text-white uppercase',
        size === 'sm' ? 'text-[9px] sm:text-[10px]' : 'text-[10px] sm:text-kicker',
      ]"
    >
      {{ player.webName }}
    </p>
  </div>
</template>
