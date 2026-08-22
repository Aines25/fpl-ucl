import type { MaybeRefOrGetter } from 'vue'
import { useIntervalFn } from '@vueuse/core'
import type { FplSquadView } from '../../lib/types/squad'

export function useSquad(managerId: MaybeRefOrGetter<number>, gameweek: MaybeRefOrGetter<number>) {
  const { isLive } = useCompetition()

  const { data, status, error, refresh } = useFetch<FplSquadView>(
    () => `/api/fpl/squad/${toValue(managerId)}/${toValue(gameweek)}`,
    {
      default: () => undefined,
      lazy: true,
    },
  )

  const loading = computed(() => !data.value && status.value !== 'error')

  if (import.meta.client) {
    const interval = useIntervalFn(() => {
      if (isLive.value) refresh()
    }, 60_000)
    onUnmounted(() => interval.pause())
  }

  return { squad: data, status, error, refresh, loading }
}
