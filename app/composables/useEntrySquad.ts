import type { MaybeRefOrGetter } from 'vue'
import { useIntervalFn } from '@vueuse/core'
import type { FplSquadView } from '../../lib/types/squad'

const squadCache = new Map<string, FplSquadView>()

function cacheKey(entryId: number, gameweek: number) {
  return `${entryId}:${gameweek}`
}

function normaliseSquad(data: FplSquadView): FplSquadView {
  return {
    ...data,
    officialPoints: data.officialPoints ?? data.points,
    officialNetPoints: data.officialNetPoints ?? data.netPoints,
    moves: data.moves ?? [],
    chipsUsed: data.chipsUsed ?? [],
    chipsRemaining: data.chipsRemaining ?? [],
  }
}

export function useEntrySquad(
  entryId: MaybeRefOrGetter<number | null>,
  gameweek: MaybeRefOrGetter<number>,
) {
  const { isLive } = useCompetition()
  const squad = shallowRef<FplSquadView | undefined>()
  const status = ref<'idle' | 'pending' | 'success' | 'error'>('idle')
  const error = ref<unknown>(null)
  let request = 0

  async function load() {
    const id = toValue(entryId)
    const gw = toValue(gameweek)
    const current = ++request

    if (!id || id <= 0 || !Number.isFinite(gw) || gw < 1) {
      squad.value = undefined
      status.value = 'idle'
      error.value = null
      return
    }

    const cached = squadCache.get(cacheKey(id, gw))
    if (cached) {
      squad.value = cached
      status.value = 'success'
      error.value = null
      return
    }

    squad.value = undefined
    status.value = 'pending'
    error.value = null

    try {
      const data = normaliseSquad(await $fetch<FplSquadView>(`/api/fpl/entry/${id}/${gw}`))
      squadCache.set(cacheKey(id, gw), data)
      if (current !== request) return
      squad.value = data
      status.value = 'success'
    }
    catch (err) {
      if (current !== request) return
      error.value = err
      status.value = 'error'
    }
  }

  watch([() => toValue(entryId), () => toValue(gameweek)], () => {
    void load()
  }, { immediate: true })

  async function refresh() {
    const id = toValue(entryId)
    const gw = toValue(gameweek)
    if (id && gw) squadCache.delete(cacheKey(id, gw))
    await load()
  }

  const loading = computed(() => status.value === 'pending')

  if (import.meta.client) {
    const interval = useIntervalFn(() => {
      if (isLive.value && toValue(entryId)) void refresh()
    }, 60_000)
    onUnmounted(() => interval.pause())
  }

  return { squad, status, error, refresh, loading }
}
