import { players } from '../../data/players'
import {
  cacheMaxAge,
  fplFetch,
  normaliseEvent,
  normaliseGameweekScore,
  type FplBootstrapResponse,
  type FplManagerResponse,
  type FplPicksResponse,
} from './fpl'
import type { FplEventState, FplGameweekScore } from '../../lib/types/competition'

export async function getBootstrap() {
  const payload = await fplFetch<FplBootstrapResponse>('/bootstrap-static/')
  const events = (payload.events ?? []).map(normaliseEvent)
  const current = events.find((event) => event.isCurrent) ?? events.find((event) => !event.finished)
  return {
    events,
    current,
  }
}

export async function getManager(fplId: number) {
  return fplFetch<FplManagerResponse>(`/entry/${fplId}/`)
}

export async function getGameweekScore(
  managerId: number,
  fplId: number,
  gameweek: number,
): Promise<FplGameweekScore> {
  if (!fplId) {
    return {
      managerId,
      fplId,
      gameweek,
      points: 0,
      transferCost: 0,
      netPoints: 0,
      available: false,
    }
  }

  try {
    const payload = await fplFetch<FplPicksResponse>(`/entry/${fplId}/event/${gameweek}/picks/`)
    return normaliseGameweekScore(managerId, fplId, gameweek, payload)
  }
  catch {
    return {
      managerId,
      fplId,
      gameweek,
      points: 0,
      transferCost: 0,
      netPoints: 0,
      available: false,
    }
  }
}

async function mapPool<T, R>(items: T[], concurrency: number, mapper: (item: T) => Promise<R>) {
  const results: R[] = []
  let index = 0
  async function worker() {
    while (index < items.length) {
      const current = index
      index += 1
      results[current] = await mapper(items[current])
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()))
  return results
}

export async function getScoresForGameweek(gameweek: number) {
  return mapPool(players, 8, (player) => getGameweekScore(player.id, player.fplId, gameweek))
}

export async function getScoresForGameweeks(gameweeks: number[]) {
  const unique = [...new Set(gameweeks)]
  const nested = await mapPool(unique, 2, (gameweek) => getScoresForGameweek(gameweek))
  return nested.flat()
}

export function maxAgeForEvents(events: FplEventState[], gameweeks: number[]) {
  const relevant = events.filter((event) => gameweeks.includes(event.id))
  if (relevant.some((event) => event.isCurrent && !event.dataChecked)) return 60
  if (relevant.every((event) => event.dataChecked)) return cacheMaxAge(relevant[0])
  return 120
}
