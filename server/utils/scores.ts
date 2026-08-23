import { committedScoresForGameweek } from '../../data/frozen-scores'
import { players } from '../../data/players'
import { alignArchivedScores, archiveIsComplete } from '../../lib/engine/archive'
import { shouldUseLiveGameweekPoints } from '../../lib/engine/results'
import type { FplEventState, FplGameweekScore } from '../../lib/types/competition'
import {
  isFresh,
  readSharedCache,
  writeSharedCache,
  type Timed,
} from './cache'
import {
  cacheMaxAge,
  fplFetch,
  normaliseEvent,
  normaliseGameweekScore,
  type FplBootstrapResponse,
  type FplManagerResponse,
  type FplPicksResponse,
} from './fpl'
import { getLiveStats, rememberCatalogueFromBootstrap } from './squad'

const BOOTSTRAP_TTL_MS = 60_000
const SCORE_TTL_MS = 60_000
const FROZEN_TTL_SECONDS = 60 * 60 * 24 * 180

type BootstrapPayload = {
  events: FplEventState[]
  current: FplEventState | undefined
}

let bootstrapMemory: Timed<BootstrapPayload> | null = null
const scoreMemory = new Map<string, Timed<FplGameweekScore>>()
const frozenGameweekMemory = new Map<number, FplGameweekScore[]>()

function scoreKey(managerId: number, gameweek: number) {
  return `${managerId}:${gameweek}`
}

function rememberScore(score: FplGameweekScore) {
  if (!score.available) return
  scoreMemory.set(scoreKey(score.managerId, score.gameweek), { at: Date.now(), data: score })
}

function recalledScore(managerId: number, gameweek: number) {
  return scoreMemory.get(scoreKey(managerId, gameweek))?.data
}

function frozenKey(gameweek: number) {
  return `fpl:frozen:${gameweek}`
}

function rememberFrozenGameweek(gameweek: number, scores: FplGameweekScore[]) {
  const aligned = alignArchivedScores(players, scores, gameweek)
  frozenGameweekMemory.set(gameweek, aligned)
  for (const score of aligned) {
    if (!score.available) continue
    scoreMemory.set(scoreKey(score.managerId, score.gameweek), { at: Date.now(), data: score })
  }
  return aligned
}

async function persistFrozenGameweek(gameweek: number, scores: FplGameweekScore[]) {
  const aligned = rememberFrozenGameweek(gameweek, scores)
  await writeSharedCache(frozenKey(gameweek), aligned, FROZEN_TTL_SECONDS)
  return aligned
}

export function committedFrozenScore(managerId: number, gameweek: number) {
  const archived = frozenGameweekMemory.get(gameweek)
    ?? committedScoresForGameweek(gameweek)
  if (!archived) return undefined
  return alignArchivedScores(players, archived, gameweek).find((score) => score.managerId === managerId)
}

export async function getBootstrap() {
  if (isFresh(bootstrapMemory, BOOTSTRAP_TTL_MS) && bootstrapMemory) {
    return bootstrapMemory.data
  }

  if (!bootstrapMemory) {
    const shared = await readSharedCache<BootstrapPayload>('fpl:bootstrap')
    if (shared) {
      bootstrapMemory = shared
      if (isFresh(shared, BOOTSTRAP_TTL_MS)) return shared.data
    }
  }

  try {
    const payload = await fplFetch<FplBootstrapResponse>('/bootstrap-static/')
    rememberCatalogueFromBootstrap(payload)
    const events = (payload.events ?? []).map(normaliseEvent)
    const current = events.find((event) => event.isCurrent) ?? events.find((event) => !event.finished)
    const data = { events, current }
    bootstrapMemory = { at: Date.now(), data }
    void writeSharedCache('fpl:bootstrap', data, cacheMaxAge(current))
    return data
  }
  catch (error) {
    if (bootstrapMemory) return bootstrapMemory.data
    throw error
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

  const frozen = committedFrozenScore(managerId, gameweek)
  if (frozen?.available) return frozen

  const cached = scoreMemory.get(scoreKey(managerId, gameweek))
  if (cached?.data.frozen || (isFresh(cached, SCORE_TTL_MS) && cached)) {
    return cached.data
  }

  try {
    const [payload, live, bootstrap] = await Promise.all([
      fplFetch<FplPicksResponse>(`/entry/${fplId}/event/${gameweek}/picks/`),
      getLiveStats(gameweek),
      getBootstrap().catch(() => null),
    ])
    const event = bootstrap?.events.find((entry) => entry.id === gameweek)
    const useLivePoints = shouldUseLiveGameweekPoints(event) && live.size > 0
    const chip = payload.active_chip
    const needsLive = useLivePoints || chip === 'bboost' || chip === '3xc'
    if (needsLive && live.size === 0) {
      return recalledScore(managerId, gameweek) ?? {
        managerId,
        fplId,
        gameweek,
        points: 0,
        transferCost: 0,
        netPoints: 0,
        available: false,
      }
    }
    const score = normaliseGameweekScore(managerId, fplId, gameweek, payload, live, useLivePoints)
    rememberScore(score)
    return score
  }
  catch {
    return recalledScore(managerId, gameweek) ?? {
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
  const committed = committedScoresForGameweek(gameweek)
  if (committed) {
    return rememberFrozenGameweek(gameweek, committed)
  }

  const memory = frozenGameweekMemory.get(gameweek)
  if (memory) return memory

  const shared = await readSharedCache<FplGameweekScore[]>(frozenKey(gameweek))
  if (shared?.data?.length) {
    return rememberFrozenGameweek(gameweek, shared.data)
  }

  const scores = await mapPool(players, 4, (player) => getGameweekScore(player.id, player.fplId, gameweek))

  try {
    const bootstrap = await getBootstrap()
    const event = bootstrap.events.find((entry) => entry.id === gameweek)
    if (event?.dataChecked && archiveIsComplete(players, scores)) {
      return persistFrozenGameweek(gameweek, scores)
    }
  }
  catch {
    // Live fetch still returns; freeze on the next successful bootstrap.
  }

  return scores
}

export async function getScoresForGameweeks(gameweeks: number[]) {
  const unique = [...new Set(gameweeks)]
  const nested = await mapPool(unique, 1, (gameweek) => getScoresForGameweek(gameweek))
  return nested.flat()
}

export function maxAgeForEvents(events: FplEventState[], gameweeks: number[]) {
  const relevant = events.filter((event) => gameweeks.includes(event.id))
  if (relevant.some((event) => event.isCurrent && !event.dataChecked)) return 60
  if (relevant.length && relevant.every((event) => event.dataChecked)) return cacheMaxAge(relevant[0])
  return 120
}
