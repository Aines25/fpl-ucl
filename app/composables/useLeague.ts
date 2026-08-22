import { useIntervalFn } from '@vueuse/core'
import type { ClassicLeagueTable } from '../../lib/types/league'

export function useLeague() {
  const { isLive } = useCompetition()
  const { data, status, error, refresh } = useFetch<ClassicLeagueTable>('/api/fpl/league', {
    key: 'fpl-classic-league',
    server: true,
    default: () => undefined,
  })

  if (import.meta.client) {
    const interval = useIntervalFn(() => {
      if (isLive.value) refresh()
    }, 60_000)
    onUnmounted(() => interval.pause())
  }

  return { league: data, status, error, refresh }
}
