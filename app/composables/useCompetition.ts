import { useIntervalFn } from '@vueuse/core'
import type { FixtureResult, FplGameweekScore, KnockoutTieResult, StandingRow } from '../../lib/types/competition'
import type { GroupId } from '../../lib/types/competition'
import { competition } from '../../data/competition'

export interface CompetitionSnapshot {
  competition: typeof competition
  currentMatchday: number
  currentGameweek: number
  currentLabel: string
  events: Array<{
    id: number
    name: string
    isCurrent: boolean
    isNext: boolean
    finished: boolean
    dataChecked: boolean
    deadlineTime: string | null
  }>
  scores: FplGameweekScore[]
  results: FixtureResult[]
  standings: Record<GroupId, StandingRow[]>
  knockout: KnockoutTieResult[]
  linkedManagers: number
  totalManagers: number
}

export function useCompetition() {
  const { data, status, error, refresh } = useFetch<CompetitionSnapshot>('/api/competition/snapshot', {
    key: 'competition-snapshot',
    server: true,
    default: () => undefined,
  })

  const isLive = computed(() => {
    const current = data.value?.events.find((event) => event.isCurrent)
    return Boolean(current && !current.finished)
  })

  if (import.meta.client) {
    const interval = useIntervalFn(() => {
      if (isLive.value) refresh()
    }, 60_000)
    onUnmounted(() => interval.pause())
  }

  return { snapshot: data, status, error, refresh, isLive }
}
