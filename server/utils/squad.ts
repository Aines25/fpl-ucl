import { getPlayer } from '../../data/players'
import { indexClubFixtures } from '../../lib/engine/club-fixtures'
import { shouldUseLiveGameweekPoints } from '../../lib/engine/results'
import { emptySquad, hydrateSquad, squadMovesFromTransfers, summariseChips } from '../../lib/engine/squad'
import type { CataloguePlayer, ClubInfo, FplSquadView, LivePlayerStats } from '../../lib/types/squad'
import { isFresh, type Timed } from './cache'
import {
  fplFetch,
  type FplBootstrapResponse,
  type FplFixtureResponse,
  type FplLiveResponse,
  type FplManagerResponse,
  type FplHistoryResponse,
  type FplPicksResponse,
  type FplTransferResponse,
} from './fpl'

const CATALOGUE_TTL_MS = 30 * 60 * 1000
const LIVE_TTL_MS = 45_000
const SQUAD_TTL_MS = 45_000

interface BootstrapCatalogue {
  players: Map<number, CataloguePlayer>
  teams: Map<number, ClubInfo>
  events: Array<{ id: number, finished: boolean, dataChecked: boolean }>
}

let catalogueCache: Timed<BootstrapCatalogue> | null = null
let catalogueInflight: Promise<BootstrapCatalogue> | null = null

const liveCache = new Map<number, Timed<Map<number, LivePlayerStats>>>()
const liveInflight = new Map<number, Promise<Map<number, LivePlayerStats>>>()
const fixtureCache = new Map<number, Timed<FplFixtureResponse[]>>()
const fixtureInflight = new Map<number, Promise<FplFixtureResponse[]>>()
const ALL_FIXTURES_TTL_MS = 10 * 60 * 1000
let allFixtureCache: Timed<FplFixtureResponse[]> | null = null
let allFixtureInflight: Promise<FplFixtureResponse[]> | null = null
const squadCache = new Map<string, Timed<FplSquadView>>()
const squadInflight = new Map<string, Promise<FplSquadView>>()

function catalogueFromBootstrap(payload: FplBootstrapResponse): BootstrapCatalogue {
  const teams = new Map<number, ClubInfo>()
  for (const team of payload.teams ?? []) {
    teams.set(team.id, {
      id: team.id,
      shortName: team.short_name,
      code: team.code,
    })
  }
  const players = new Map<number, CataloguePlayer>()
  for (const element of payload.elements ?? []) {
    const team = teams.get(element.team)
    const elementType = element.element_type
    players.set(element.id, {
      id: element.id,
      webName: element.web_name,
      teamId: element.team,
      teamCode: team?.code ?? 0,
      elementType: elementType === 2 || elementType === 3 || elementType === 4 ? elementType : 1,
      code: element.code,
    })
  }
  return {
    players,
    teams,
    events: (payload.events ?? []).map((event) => ({
      id: event.id,
      finished: event.finished,
      dataChecked: event.data_checked,
    })),
  }
}

export function rememberCatalogueFromBootstrap(payload: FplBootstrapResponse) {
  const data = catalogueFromBootstrap(payload)
  catalogueCache = { at: Date.now(), data }
  return data
}

async function getBootstrapCatalogue() {
  if (isFresh(catalogueCache, CATALOGUE_TTL_MS) && catalogueCache) {
    return catalogueCache.data
  }
  if (!catalogueInflight) {
    catalogueInflight = fplFetch<FplBootstrapResponse>('/bootstrap-static/')
      .then((payload) => rememberCatalogueFromBootstrap(payload))
      .finally(() => {
        catalogueInflight = null
      })
  }
  return catalogueInflight
}

export async function getPlayerCatalogue() {
  return (await getBootstrapCatalogue()).players
}

export async function getClubCatalogue() {
  return (await getBootstrapCatalogue()).teams
}

export async function getGameweekFixtures(gameweek: number) {
  const cached = fixtureCache.get(gameweek)
  if (isFresh(cached, LIVE_TTL_MS) && cached) return cached.data

  let inflight = fixtureInflight.get(gameweek)
  if (!inflight) {
    inflight = fplFetch<FplFixtureResponse[]>(`/fixtures/?event=${gameweek}`)
      .then((payload) => {
        const data = payload ?? []
        fixtureCache.set(gameweek, { at: Date.now(), data })
        return data
      })
      .catch(() => cached?.data ?? [])
      .finally(() => {
        fixtureInflight.delete(gameweek)
      })
    fixtureInflight.set(gameweek, inflight)
  }
  return inflight
}

export async function getAllFixtures() {
  if (isFresh(allFixtureCache, ALL_FIXTURES_TTL_MS) && allFixtureCache) {
    return allFixtureCache.data
  }

  if (!allFixtureInflight) {
    allFixtureInflight = fplFetch<FplFixtureResponse[]>('/fixtures/')
      .then((payload) => {
        const data = payload ?? []
        allFixtureCache = { at: Date.now(), data }
        return data
      })
      .finally(() => {
        allFixtureInflight = null
      })
  }

  try {
    return await allFixtureInflight
  }
  catch (error) {
    if (allFixtureCache) return allFixtureCache.data
    throw error
  }
}

export async function getLiveStats(gameweek: number) {
  const cached = liveCache.get(gameweek)
  if (isFresh(cached, LIVE_TTL_MS) && cached) return cached.data

  let inflight = liveInflight.get(gameweek)
  if (!inflight) {
    inflight = fplFetch<FplLiveResponse>(`/event/${gameweek}/live/`)
      .then((payload) => {
        const data = new Map<number, LivePlayerStats>()
        for (const element of payload.elements ?? []) {
          data.set(element.id, {
            minutes: element.stats?.minutes ?? 0,
            points: element.stats?.total_points ?? 0,
            goalsScored: element.stats?.goals_scored ?? 0,
            assists: element.stats?.assists ?? 0,
            cleanSheets: element.stats?.clean_sheets ?? 0,
            goalsConceded: element.stats?.goals_conceded ?? 0,
            ownGoals: element.stats?.own_goals ?? 0,
            penaltiesSaved: element.stats?.penalties_saved ?? 0,
            penaltiesMissed: element.stats?.penalties_missed ?? 0,
            yellowCards: element.stats?.yellow_cards ?? 0,
            redCards: element.stats?.red_cards ?? 0,
            saves: element.stats?.saves ?? 0,
            bonus: element.stats?.bonus ?? 0,
          })
        }
        liveCache.set(gameweek, { at: Date.now(), data })
        return data
      })
      .catch(() => cached?.data ?? new Map<number, LivePlayerStats>())
      .finally(() => {
        liveInflight.delete(gameweek)
      })
    liveInflight.set(gameweek, inflight)
  }
  return inflight
}

export async function getSquadByEntry(input: {
  managerId: number
  fplId: number
  name: string
  gameweek: number
}): Promise<FplSquadView> {
  const { managerId, fplId, name, gameweek } = input
  if (!fplId) {
    return emptySquad(managerId, 0, name, gameweek)
  }

  const key = `entry:v5:${fplId}:${gameweek}`
  const cached = squadCache.get(key)
  if (isFresh(cached, SQUAD_TTL_MS) && cached) return cached.data

  let inflight = squadInflight.get(key)
  if (!inflight) {
    inflight = Promise.all([
      getBootstrapCatalogue(),
      getLiveStats(gameweek),
      getGameweekFixtures(gameweek),
      fplFetch<FplPicksResponse>(`/entry/${fplId}/event/${gameweek}/picks/`).catch(() => null),
      fplFetch<FplManagerResponse>(`/entry/${fplId}/`).catch(() => null),
      fplFetch<FplTransferResponse[]>(`/entry/${fplId}/transfers/`).catch(() => []),
      fplFetch<FplHistoryResponse>(`/entry/${fplId}/history/`).catch(() => null),
    ])
      .then(([catalogue, live, fixtures, payload, manager, transfers, history]) => {
        const event = catalogue.events?.find((entry) => entry.id === gameweek)
        const data = hydrateSquad({
          managerId,
          fplId,
          name,
          teamName: manager?.name ?? null,
          gameweek,
          payload,
          catalogue: catalogue.players,
          live,
          fixtures: indexClubFixtures(fixtures, catalogue.teams),
          useLivePoints: shouldUseLiveGameweekPoints(event) && live.size > 0,
        })
        data.moves = squadMovesFromTransfers(transfers, gameweek, catalogue.players)
        const chips = summariseChips(history?.chips, gameweek)
        data.chipsUsed = chips.chipsUsed
        data.chipsRemaining = chips.chipsRemaining
        squadCache.set(key, { at: Date.now(), data })
        return data
      })
      .catch(() => cached?.data ?? emptySquad(managerId, fplId, name, gameweek))
      .finally(() => {
        squadInflight.delete(key)
      })
    squadInflight.set(key, inflight)
  }

  return inflight
}

export async function getSquad(managerId: number, gameweek: number): Promise<FplSquadView> {
  const player = getPlayer(managerId)
  return getSquadByEntry({
    managerId: player.id,
    fplId: player.fplId,
    name: player.name,
    gameweek,
  })
}
