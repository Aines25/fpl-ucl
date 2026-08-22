import { competition } from '../../data/competition'
import { players } from '../../data/players'
import type { ClassicLeagueTable, LeagueStandingRow } from '../../lib/types/league'
import { isFresh, readSharedCache, writeSharedCache, type Timed } from './cache'
import { cacheMaxAge, fplFetch, type FplClassicLeagueResponse } from './fpl'
import { getBootstrap } from './scores'

const LEAGUE_TTL_MS = 60_000
const MAX_PAGES = 6

let leagueMemory: Timed<ClassicLeagueTable> | null = null
let leagueInflight: Promise<ClassicLeagueTable> | null = null

function playerByFplId() {
  return new Map(players.filter((player) => player.fplId > 0).map((player) => [player.fplId, player.id]))
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
  }
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

  return {
    leagueId,
    name,
    standings,
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
