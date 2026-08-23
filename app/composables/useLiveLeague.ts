import { useIntervalFn } from '@vueuse/core'
import type { MaybeRefOrGetter } from 'vue'
import { stampFeedEvents } from '../../lib/engine/live'
import type { LiveFeedEvent, LiveLeagueTable } from '../../lib/types/league'

const FEED_STORAGE_PREFIX = 'fpl-ucl:live-feed:'
const FEED_STORAGE_LIMIT = 250

function readStoredFeed(gameweek: number): LiveFeedEvent[] {
  if (!import.meta.client) return []
  try {
    const raw = localStorage.getItem(`${FEED_STORAGE_PREFIX}${gameweek}`)
    if (!raw) return []
    const parsed = JSON.parse(raw) as LiveFeedEvent[]
    return Array.isArray(parsed) ? parsed : []
  }
  catch {
    return []
  }
}

function writeStoredFeed(gameweek: number, events: LiveFeedEvent[]) {
  if (!import.meta.client) return
  try {
    localStorage.setItem(`${FEED_STORAGE_PREFIX}${gameweek}`, JSON.stringify(events.slice(0, FEED_STORAGE_LIMIT)))
  }
  catch {
    // Ignore quota or private-mode failures; the in-memory feed still updates.
  }
}

export function useLiveLeague(enabled: MaybeRefOrGetter<boolean>) {
  const { isLive } = useCompetition()
  const { data, status, error, refresh } = useFetch<LiveLeagueTable>('/api/fpl/league/live', {
    key: 'fpl-live-league',
    server: false,
    immediate: false,
    default: () => undefined,
  })

  const feed = shallowRef<LiveFeedEvent[]>([])

  function syncFeed(payload: LiveLeagueTable | undefined) {
    if (!payload) {
      feed.value = []
      return
    }
    const stored = readStoredFeed(payload.gameweek)
    const merged = stampFeedEvents(
      (payload.feed ?? []).map(({ at: _at, ...event }) => event),
      [...stored, ...(payload.feed ?? [])],
      payload.updatedAt,
    )
    feed.value = merged
    writeStoredFeed(payload.gameweek, merged)
  }

  watch(data, (payload) => syncFeed(payload), { immediate: true })

  watch(() => toValue(enabled), (on) => {
    if (on && !data.value) void refresh()
  }, { immediate: true })

  if (import.meta.client) {
    const interval = useIntervalFn(() => {
      if (toValue(enabled) && isLive.value) void refresh()
    }, 60_000)
    onUnmounted(() => interval.pause())
  }

  return { live: data, feed, status, error, refresh }
}
