import type { FplEventState, FplGameweekScore } from '../../lib/types/competition'

export const FPL_BASE = 'https://fantasy.premierleague.com/api'

const headers = {
  'User-Agent': 'Mozilla/5.0 (compatible; FPL-UCL/1.0; +https://christiancodes.co.uk)',
  Accept: 'application/json',
}

export interface FplPicksResponse {
  entry_history?: {
    points?: number
    event_transfers_cost?: number
    total_points?: number
  }
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
}

export interface FplManagerResponse {
  id: number
  name: string
  player_first_name?: string
  player_last_name?: string
}

export async function fplFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${FPL_BASE}${path}`, { headers })
  if (!response.ok) {
    throw createError({
      statusCode: response.status,
      statusMessage: `FPL API ${path} failed with ${response.status}`,
    })
  }
  return response.json() as Promise<T>
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
 * FPL `entry_history.points` is the gross Gameweek score.
 * `event_transfers_cost` is the hit already taken that week.
 * Net points must subtract the hit once — never twice.
 */
export function normaliseGameweekScore(
  managerId: number,
  fplId: number,
  gameweek: number,
  payload: FplPicksResponse | null,
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

  const points = payload.entry_history.points ?? 0
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
