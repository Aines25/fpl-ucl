import type { MaybeRefOrGetter } from 'vue'
import { useIntervalFn } from '@vueuse/core'
import type { LeagueInsights } from '../../lib/types/league'

export function useLeagueInsights(gameweek: MaybeRefOrGetter<number>, enabled: MaybeRefOrGetter<boolean>) {
  const { isLive } = useCompetition()
  const { data, status, error, refresh } = useFetch<LeagueInsights>(
    () => `/api/fpl/league/insights?gw=${toValue(gameweek)}`,
    {
      key: 'fpl-league-insights',
      default: () => undefined,
      lazy: true,
      immediate: false,
      watch: false,
    },
  )

  watch(
    () => [toValue(gameweek), toValue(enabled)] as const,
    ([gw, on]) => {
      if (import.meta.client && on && gw >= 1) void refresh()
    },
    { immediate: true },
  )

  if (import.meta.client) {
    const interval = useIntervalFn(() => {
      if (isLive.value && toValue(enabled) && toValue(gameweek) >= 1) void refresh()
    }, 60_000)
    onUnmounted(() => interval.pause())
  }

  return { insights: data, status, error, refresh }
}
