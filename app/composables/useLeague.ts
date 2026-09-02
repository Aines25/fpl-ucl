import { useIntervalFn } from '@vueuse/core'
import type { ClassicLeagueTable } from '../../lib/types/league'

export function useLeague() {
  const { data, status, error, refresh } = useFetch<ClassicLeagueTable>('/api/fpl/league', {
    key: 'fpl-classic-league',
    server: true,
    default: () => undefined,
  })

  const captainsIncomplete = computed(() =>
    (data.value?.standings ?? []).some((row) => row.entryId > 0 && row.transfers == null),
  )

  if (import.meta.client) {
    const interval = useIntervalFn(() => {
      if (captainsIncomplete.value) refresh()
    }, 60_000)
    onUnmounted(() => interval.pause())
  }

  return { league: data, status, error, refresh }
}
