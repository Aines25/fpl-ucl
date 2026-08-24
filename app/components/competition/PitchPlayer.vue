<script setup lang="ts">
import type { SquadSlot } from '../../../lib/types/squad'

const props = withDefaults(defineProps<{
  player: SquadSlot
  size?: 'sm' | 'md'
  selected?: boolean
}>(), {
  size: 'md',
  selected: false,
})

const emit = defineEmits<{
  select: [player: SquadSlot]
}>()

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
  <button
    type="button"
    :class="[
      'flex cursor-pointer flex-col items-center rounded-sm text-center hover:bg-white/10',
      size === 'sm' ? 'w-12 px-0.5 py-1 sm:w-14' : 'w-14 px-0.5 py-1 sm:w-16',
      selected ? 'bg-cyan/15 ring-1 ring-cyan/50' : '',
    ]"
    :aria-pressed="selected"
    aria-haspopup="dialog"
    :aria-label="`${player.webName}, ${player.points} ${player.points === 1 ? 'point' : 'points'}`"
    @click.stop="emit('select', player)"
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
          alt=""
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
  </button>
</template>
