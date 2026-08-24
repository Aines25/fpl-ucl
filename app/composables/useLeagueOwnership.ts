import type { MaybeRefOrGetter } from 'vue'
import { useIntervalFn } from '@vueuse/core'
import type { LeagueOwnership } from '../../lib/types/league'

export function useLeagueOwnership(gameweek: MaybeRefOrGetter<number>) {
  const { isLive } = useCompetition()

  const { data, status, error, refresh } = useFetch<LeagueOwnership>(
    () => `/api/fpl/league/owners?gw=${toValue(gameweek)}`,
    {
      key: 'fpl-league-owners',
      default: () => undefined,
      lazy: true,
      server: false,
      immediate: false,
      watch: false,
    },
  )

  watch(() => toValue(gameweek), (gw) => {
    if (import.meta.client && gw >= 1) void refresh()
  }, { immediate: true })

  if (import.meta.client) {
    const interval = useIntervalFn(() => {
      if (isLive.value && toValue(gameweek) >= 1) void refresh()
    }, 60_000)
    onUnmounted(() => interval.pause())
  }

  return { ownership: data, status, error, refresh }
}
