import { competition } from '../../data/competition'
import { players } from '../../data/players'
import type { FplEventState } from '../../lib/types/competition'
import type { ClassicLeagueTable, LeagueStandingRow } from '../../lib/types/league'
import { isFresh, readSharedCache, writeSharedCache, type Timed } from './cache'
import { cacheMaxAge, fplFetch, type FplClassicLeagueResponse, type FplPicksResponse } from './fpl'
import { getBootstrap } from './scores'
import { getPlayerCatalogue } from './squad'

const LEAGUE_TTL_MS = 60_000
const MAX_PAGES = 6
const CAPTAIN_BATCH = 10
const CAPTAIN_PERSIST_SECONDS = 60 * 60 * 12

type LeaguePickExtras = Pick<LeagueStandingRow, 'captain' | 'viceCaptain' | 'transfers'>

let leagueMemory: Timed<ClassicLeagueTable> | null = null
let leagueInflight: Promise<ClassicLeagueTable> | null = null
const captainMemory = new Map<string, LeaguePickExtras>()
const captainSharedHydrated = new Set<number>()

function playerByFplId() {
  return new Map(players.filter((player) => player.fplId > 0).map((player) => [player.fplId, player.id]))
}

function captainKey(entryId: number, gameweek: number) {
  return `${entryId}:${gameweek}`
}

export function captainsAreLocked(event: FplEventState | undefined, now = Date.now()) {
  if (!event) return false
  if (event.finished || event.dataChecked || event.isCurrent) return true
  if (!event.deadlineTime) return false
  return now >= new Date(event.deadlineTime).getTime()
}

export function captainsFromPicks(
  picks: FplPicksResponse['picks'],
  names: Map<number, string>,
): Pick<LeaguePickExtras, 'captain' | 'viceCaptain'> {
  let captain: string | null = null
  let viceCaptain: string | null = null
  for (const pick of picks ?? []) {
    if (pick.is_captain) captain = names.get(pick.element) ?? null
    if (pick.is_vice_captain) viceCaptain = names.get(pick.element) ?? null
  }
  return { captain, viceCaptain }
}

export function extrasFromPicks(
  payload: FplPicksResponse | null | undefined,
  names: Map<number, string>,
): LeaguePickExtras {
  return {
    ...captainsFromPicks(payload?.picks, names),
    transfers: payload?.entry_history?.event_transfers ?? 0,
  }
}

function extrasAreComplete(extras: LeaguePickExtras | undefined) {
  return typeof extras?.transfers === 'number'
}

export function normaliseLeagueStanding(
  row: NonNullable<NonNullable<FplClassicLeagueResponse['standings']>['results']>[number],
  competitionIds: Map<number, number>,
): LeagueStandingRow {
  const entryId = row.entry ?? 0
  return {
    rank: row.rank ?? 0,
    lastRank: row.last_rank ?? null,
    entryId,
    playerName: row.player_name ?? 'Unknown',
    entryName: row.entry_name ?? '',
    eventTotal: row.event_total ?? 0,
    total: row.total ?? 0,
    competitionPlayerId: competitionIds.get(entryId) ?? null,
    captain: null,
    viceCaptain: null,
    transfers: null,
  }
}

async function hydrateCaptainMemory(gameweek: number) {
  if (captainSharedHydrated.has(gameweek)) return
  const shared = await readSharedCache<Record<string, LeaguePickExtras>>(`fpl:league-picks:v2:${gameweek}`)
  if (shared?.data) {
    for (const [entryId, pair] of Object.entries(shared.data)) {
      captainMemory.set(captainKey(Number(entryId), gameweek), pair)
    }
  }
  captainSharedHydrated.add(gameweek)
}

async function persistCaptainMemory(gameweek: number) {
  const data: Record<string, LeaguePickExtras> = {}
  const suffix = `:${gameweek}`
  for (const [key, pair] of captainMemory) {
    if (!key.endsWith(suffix)) continue
    data[key.slice(0, -suffix.length)] = pair
  }
  await writeSharedCache(`fpl:league-picks:v2:${gameweek}`, data, CAPTAIN_PERSIST_SECONDS)
}

async function attachLeagueCaptains(standings: LeagueStandingRow[], event: FplEventState | undefined) {
  const gameweek = event?.id
  if (!gameweek) return standings

  await hydrateCaptainMemory(gameweek)

  if (captainsAreLocked(event)) {
    const missing = standings
      .map((row) => row.entryId)
      .filter((entryId) => entryId > 0 && !extrasAreComplete(captainMemory.get(captainKey(entryId, gameweek))))

    if (missing.length) {
      const catalogue = await getPlayerCatalogue()
      const names = new Map([...catalogue.values()].map((player) => [player.id, player.webName]))
      let fetched = 0

      for (let index = 0; index < missing.length; index += CAPTAIN_BATCH) {
        const batch = missing.slice(index, index + CAPTAIN_BATCH)
        await Promise.all(batch.map(async (entryId) => {
          const payload = await fplFetch<FplPicksResponse>(
            `/entry/${entryId}/event/${gameweek}/picks/`,
          ).catch(() => null)
          if (!payload) return
          captainMemory.set(captainKey(entryId, gameweek), extrasFromPicks(payload, names))
          fetched += 1
        }))
      }

      if (fetched) await persistCaptainMemory(gameweek)
    }
  }

  return standings.map((row) => ({
    ...row,
    ...(captainMemory.get(captainKey(row.entryId, gameweek)) ?? { captain: null, viceCaptain: null, transfers: null }),
  }))
}

async function fetchClassicLeague(leagueId: number): Promise<ClassicLeagueTable> {
  const competitionIds = playerByFplId()
  const standings: LeagueStandingRow[] = []
  let name = 'Classic league'
  let page = 1
  let hasNext = true

  while (hasNext && page <= MAX_PAGES) {
    const payload = await fplFetch<FplClassicLeagueResponse>(
      `/leagues-classic/${leagueId}/standings/?page_standings=${page}`,
    )
    name = payload.league?.name ?? name
    const rows = payload.standings?.results ?? []
    standings.push(...rows.map((row) => normaliseLeagueStanding(row, competitionIds)))
    hasNext = Boolean(payload.standings?.has_next)
    page += 1
  }

  let event: FplEventState | undefined
  try {
    event = (await getBootstrap()).current
  }
  catch {
    event = undefined
  }

  return {
    leagueId,
    name,
    standings: await attachLeagueCaptains(standings, event),
  }
}

export async function getClassicLeague(leagueId = competition.fplLeagueId) {
  if (isFresh(leagueMemory, LEAGUE_TTL_MS) && leagueMemory) {
    return leagueMemory.data
  }

  if (!leagueMemory) {
    const shared = await readSharedCache<ClassicLeagueTable>(`fpl:league:${leagueId}`)
    if (shared) {
      leagueMemory = shared
      if (isFresh(shared, LEAGUE_TTL_MS)) return shared.data
    }
  }

  if (!leagueInflight) {
    leagueInflight = fetchClassicLeague(leagueId)
      .then(async (data) => {
        leagueMemory = { at: Date.now(), data }
        let persistSeconds = 60 * 10
        try {
          const bootstrap = await getBootstrap()
          persistSeconds = cacheMaxAge(bootstrap.current)
        }
        catch {
          persistSeconds = 60 * 10
        }
        await writeSharedCache(`fpl:league:${leagueId}`, data, persistSeconds)
        return data
      })
      .catch((error) => {
        if (leagueMemory) return leagueMemory.data
        throw error
      })
      .finally(() => {
        leagueInflight = null
      })
  }

  if (leagueMemory) return leagueMemory.data
  return leagueInflight
}
