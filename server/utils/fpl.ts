import { competitionGameweekPoints } from '../../lib/engine/squad'
import type { FplEventState, FplGameweekScore } from '../../lib/types/competition'

export const FPL_BASE = 'https://fantasy.premierleague.com/api'

const headers = {
  'User-Agent': 'Mozilla/5.0 (compatible; FPL-UCL/1.0; +https://christiancodes.co.uk)',
  Accept: 'application/json',
}

export interface FplPicksResponse {
  active_chip?: string | null
  entry_history?: {
    points?: number
    event_transfers?: number
    event_transfers_cost?: number
    total_points?: number
    rank?: number | null
    overall_rank?: number | null
    value?: number
    bank?: number
  }
  picks?: Array<{
    element: number
    position: number
    multiplier: number
    is_captain: boolean
    is_vice_captain: boolean
  }>
}

export interface FplBootstrapResponse {
  events?: Array<{
    id: number
    name: string
    is_current: boolean
    is_next: boolean
    finished: boolean
    data_checked: boolean
    deadline_time: string | null
  }>
  elements?: Array<{
    id: number
    web_name: string
    team: number
    element_type: number
    code: number
  }>
  teams?: Array<{
    id: number
    name: string
    short_name: string
    code: number
  }>
}

export interface FplLiveResponse {
  elements?: Array<{
    id: number
    stats?: {
      minutes?: number
      total_points?: number
      goals_scored?: number
      assists?: number
      clean_sheets?: number
      goals_conceded?: number
      own_goals?: number
      penalties_saved?: number
      penalties_missed?: number
      yellow_cards?: number
      red_cards?: number
      saves?: number
      bonus?: number
    }
  }>
}

export interface FplFixtureResponse {
  id: number
  event: number | null
  kickoff_time: string | null
  team_h: number
  team_a: number
  team_h_difficulty?: number | null
  team_a_difficulty?: number | null
  started: boolean | null
  finished: boolean
  finished_provisional?: boolean
}

export interface FplManagerResponse {
  id: number
  name: string
  player_first_name?: string
  player_last_name?: string
}

export interface FplHistoryResponse {
  chips?: Array<{
    name?: string
    event?: number
    time?: string
  }>
}

export interface FplTransferResponse {
  element_in?: number
  element_out?: number
  element_in_cost?: number
  element_out_cost?: number
  entry?: number
  event?: number
  time?: string
}

export interface FplClassicLeagueResponse {
  league?: {
    id: number
    name: string
  }
  standings?: {
    has_next?: boolean
    page?: number
    results?: Array<{
      event_total?: number
      player_name?: string
      rank?: number
      last_rank?: number | null
      total?: number
      entry?: number
      entry_name?: string
    }>
  }
}

export function isRetryableStatus(status: number) {
  return status === 403 || status === 408 || status === 425 || status === 429 || status >= 500
}

export function retryDelayMs(attempt: number, status?: number) {
  const base = status === 429 ? 400 : 200
  return base * 2 ** attempt
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function fplFetch<T>(path: string, attempts = 2): Promise<T> {
  let lastError: unknown

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(`${FPL_BASE}${path}`, { headers })
      if (response.ok) {
        return response.json() as Promise<T>
      }

      const error = createError({
        statusCode: response.status,
        statusMessage: `FPL API ${path} failed with ${response.status}`,
      })
      if (!isRetryableStatus(response.status) || attempt === attempts - 1) {
        throw error
      }
      lastError = error
      await wait(retryDelayMs(attempt, response.status))
    }
    catch (error) {
      lastError = error
      const status = typeof error === 'object' && error && 'statusCode' in error
        ? Number((error as { statusCode?: number }).statusCode)
        : 0
      if (status && !isRetryableStatus(status)) throw error
      if (attempt === attempts - 1) throw error
      await wait(retryDelayMs(attempt, status || undefined))
    }
  }

  throw lastError
}

export function normaliseEvent(event: NonNullable<FplBootstrapResponse['events']>[number]): FplEventState {
  return {
    id: event.id,
    name: event.name,
    isCurrent: event.is_current,
    isNext: event.is_next,
    finished: event.finished,
    dataChecked: event.data_checked,
    deadlineTime: event.deadline_time,
  }
}

/**
 * FPL `entry_history.points` is the official Gameweek score, including chips.
 * This competition drops Bench Boost bench points and the extra Triple Captain
 * multiplier. Transfer hits are then subtracted once from that adjusted total.
 * While the gameweek is live, prefer the per-player live feed so totals match the pitch.
 */
export function normaliseGameweekScore(
  managerId: number,
  fplId: number,
  gameweek: number,
  payload: FplPicksResponse | null,
  live: Map<number, { points: number }> = new Map(),
  useLivePoints = false,
): FplGameweekScore {
  if (!payload?.entry_history) {
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

  const points = competitionGameweekPoints(
    payload.active_chip,
    payload.picks ?? [],
    live,
    payload.entry_history.points ?? 0,
    useLivePoints,
  )
  const transferCost = payload.entry_history.event_transfers_cost ?? 0
  return {
    managerId,
    fplId,
    gameweek,
    points,
    transferCost,
    netPoints: points - transferCost,
    available: true,
  }
}

export function cacheMaxAge(event: FplEventState | undefined) {
  if (!event) return 60
  if (event.dataChecked) return 60 * 60 * 12
  if (event.isCurrent) return 60
  return 60 * 10
}

export function setApiCacheHeaders(event: Parameters<typeof setHeader>[0], sMaxAge: number, staleWhileRevalidate = 30) {
  setHeader(event, 'cache-control', 'private, no-cache')
  setHeader(event, 'cdn-cache-control', `public, s-maxage=${sMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`)
}
