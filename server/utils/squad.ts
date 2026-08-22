import { getPlayer } from '../../data/players'
import { emptySquad, hydrateSquad } from '../../lib/engine/squad'
import type { CataloguePlayer, FplSquadView, LivePlayerStats } from '../../lib/types/squad'
import {
  fplFetch,
  type FplBootstrapResponse,
  type FplLiveResponse,
  type FplManagerResponse,
  type FplPicksResponse,
} from './fpl'

interface Timed<T> {
  at: number
  data: T
}

const CATALOGUE_TTL_MS = 30 * 60 * 1000
const LIVE_TTL_MS = 45_000

let catalogueCache: Timed<Map<number, CataloguePlayer>> | null = null
let catalogueInflight: Promise<Map<number, CataloguePlayer>> | null = null

const liveCache = new Map<number, Timed<Map<number, LivePlayerStats>>>()
const liveInflight = new Map<number, Promise<Map<number, LivePlayerStats>>>()

function isFresh<T>(entry: Timed<T> | null | undefined, ttl: number) {
  return Boolean(entry && Date.now() - entry.at < ttl)
}

export async function getPlayerCatalogue() {
  if (isFresh(catalogueCache, CATALOGUE_TTL_MS) && catalogueCache) {
    return catalogueCache.data
  }
  if (!catalogueInflight) {
    catalogueInflight = fplFetch<FplBootstrapResponse>('/bootstrap-static/')
      .then((payload) => {
        const teams = new Map((payload.teams ?? []).map((team) => [team.id, team]))
        const data = new Map<number, CataloguePlayer>()
        for (const element of payload.elements ?? []) {
          const team = teams.get(element.team)
          const elementType = element.element_type
          data.set(element.id, {
            id: element.id,
            webName: element.web_name,
            teamId: element.team,
            teamCode: team?.code ?? 0,
            elementType: elementType === 2 || elementType === 3 || elementType === 4 ? elementType : 1,
            code: element.code,
          })
        }
        catalogueCache = { at: Date.now(), data }
        return data
      })
      .finally(() => {
        catalogueInflight = null
      })
  }
  return catalogueInflight
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

export async function getSquad(managerId: number, gameweek: number): Promise<FplSquadView> {
  const player = getPlayer(managerId)
  if (!player.fplId) {
    return emptySquad(player.id, 0, player.name, gameweek)
  }

  const [catalogue, live, payload, manager] = await Promise.all([
    getPlayerCatalogue(),
    getLiveStats(gameweek),
    fplFetch<FplPicksResponse>(`/entry/${player.fplId}/event/${gameweek}/picks/`).catch(() => null),
    fplFetch<FplManagerResponse>(`/entry/${player.fplId}/`).catch(() => null),
  ])

  return hydrateSquad({
    managerId: player.id,
    fplId: player.fplId,
    name: player.name,
    teamName: manager?.name ?? null,
    gameweek,
    payload,
    catalogue,
    live,
  })
}
