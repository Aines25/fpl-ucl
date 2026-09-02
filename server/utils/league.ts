import { competition } from '../../data/competition'
import { players } from '../../data/players'
import { freeTransfersRemaining, squadMovesFromTransfers, summariseChips } from '../../lib/engine/squad'
import type { FplEventState } from '../../lib/types/competition'
import type { ClassicLeagueTable, LeagueEntryPicks, LeagueStandingRow } from '../../lib/types/league'
import type { CataloguePlayer } from '../../lib/types/squad'
import { isFresh, readSharedCache, writeSharedCache, type Timed } from './cache'
import { fplFetch, type FplClassicLeagueResponse, type FplHistoryResponse, type FplPicksResponse, type FplTransferResponse } from './fpl'
import { getBootstrap } from './scores'
import { getPlayerCatalogue } from './squad'

const MAX_PAGES = 6
const CAPTAIN_BATCH = 5
const CAPTAIN_BATCH_GAP_MS = 200
const CAPTAIN_PERSIST_SECONDS = 60 * 60 * 12
const EXTRAS_BUDGET_MS = 8_000
const STANDINGS_TTL_SECONDS = 60 * 10
const CONFIRMED_TTL_SECONDS = 60 * 60 * 12
const FILL_TTL_SECONDS = 60
const PICKS_CACHE_VERSION = 'v6'
const LEAGUE_CACHE_VERSION = 'v4'

let leagueMemory: Timed<ClassicLeagueTable> | null = null
let leagueInflight: Promise<ClassicLeagueTable> | null = null
const captainMemory = new Map<string, LeagueEntryPicks>()
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

export function officialLeagueTtlSeconds(
  event: FplEventState | undefined,
  extrasComplete: boolean,
) {
  if (captainsAreLocked(event) && !extrasComplete) return FILL_TTL_SECONDS
  if (event?.dataChecked) return CONFIRMED_TTL_SECONDS
  return STANDINGS_TTL_SECONDS
}

export function officialLeagueCacheIsFresh(
  cached: Timed<ClassicLeagueTable> | null | undefined,
  event: FplEventState | undefined,
) {
  if (!cached) return false
  if (event?.id && cached.data.gameweek && cached.data.gameweek !== event.id) return false
  if (event?.dataChecked && cached.data.dataChecked === false) return false
  const extrasComplete = leagueCaptainsComplete(cached.data.standings)
  return isFresh(cached, officialLeagueTtlSeconds(event, extrasComplete) * 1000)
}

export function captainsFromPicks(
  picks: FplPicksResponse['picks'],
  names: Map<number, string>,
): Pick<LeagueEntryPicks, 'captain' | 'viceCaptain'> {
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
): LeagueEntryPicks {
  return {
    ...captainsFromPicks(payload?.picks, names),
    transfers: payload?.entry_history?.event_transfers ?? 0,
    transferCost: payload?.entry_history?.event_transfers_cost ?? 0,
    chip: payload?.active_chip ?? null,
    picks: (payload?.picks ?? []).map((pick) => ({
      element: pick.element,
      position: pick.position,
      multiplier: pick.multiplier,
      isCaptain: pick.is_captain,
      isViceCaptain: pick.is_vice_captain,
    })),
    transfersIn: [],
    transfersOut: [],
    freeTransfers: null,
    chipsUsed: [],
    chipsRemaining: [],
  }
}

export function extrasAreComplete(extras: LeagueEntryPicks | undefined) {
  return Boolean(extras && extras.picks.length > 0 && typeof extras.transfers === 'number')
}

function extrasHaveHistory(extras: LeagueEntryPicks | undefined) {
  return extras?.freeTransfers != null
}

export function decorateLeagueExtras(
  extras: LeagueEntryPicks,
  gameweek: number,
  transfers: FplTransferResponse[] | null | undefined,
  history: FplHistoryResponse | null | undefined,
  catalogue: Map<number, CataloguePlayer>,
): LeagueEntryPicks {
  const moves = squadMovesFromTransfers(transfers, gameweek, catalogue)
  const chips = summariseChips(history?.chips, gameweek)
  return {
    ...extras,
    transfersIn: moves.map((move) => move.inName),
    transfersOut: moves.map((move) => move.outName),
    freeTransfers: freeTransfersRemaining(history?.current, history?.chips, gameweek, {
      transfers: extras.transfers,
      chip: extras.chip,
    }),
    chipsUsed: chips.chipsUsed,
    chipsRemaining: chips.chipsRemaining,
  }
}

export function leagueCaptainsComplete(standings: LeagueStandingRow[]) {
  return standings.every((row) => row.entryId <= 0 || typeof row.transfers === 'number')
}

export function withLeagueRowDefaults(row: LeagueStandingRow): LeagueStandingRow {
  return {
    ...row,
    transferCost: row.transferCost ?? null,
    transfersIn: row.transfersIn ?? [],
    transfersOut: row.transfersOut ?? [],
    freeTransfers: row.freeTransfers ?? null,
    chipsUsed: row.chipsUsed ?? [],
    chipsRemaining: row.chipsRemaining ?? [],
  }
}

function withLeagueTableDefaults(table: ClassicLeagueTable): ClassicLeagueTable {
  return {
    ...table,
    picksComplete: table.picksComplete ?? leagueCaptainsComplete(table.standings),
    standings: table.standings.map(withLeagueRowDefaults),
  }
}

function classicLeagueTable(
  leagueId: number,
  name: string,
  standings: LeagueStandingRow[],
  event: FplEventState | undefined,
): ClassicLeagueTable {
  return {
    leagueId,
    name,
    gameweek: event?.id,
    dataChecked: Boolean(event?.dataChecked),
    picksComplete: leagueCaptainsComplete(standings),
    standings,
  }
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
    transferCost: null,
    transfersIn: [],
    transfersOut: [],
    freeTransfers: null,
    chip: null,
    chipsUsed: [],
    chipsRemaining: [],
  }
}

function picksCacheKey(gameweek: number) {
  return `fpl:league-picks:${PICKS_CACHE_VERSION}:${gameweek}`
}

async function hydrateCaptainMemory(gameweek: number) {
  if (captainSharedHydrated.has(gameweek)) return
  const shared = await readSharedCache<Record<string, LeagueEntryPicks>>(picksCacheKey(gameweek))
  if (shared?.data) {
    for (const [entryId, pair] of Object.entries(shared.data)) {
      captainMemory.set(captainKey(Number(entryId), gameweek), pair)
    }
  }
  captainSharedHydrated.add(gameweek)
}

async function persistCaptainMemory(gameweek: number) {
  const data: Record<string, LeagueEntryPicks> = {}
  const suffix = `:${gameweek}`
  for (const [key, pair] of captainMemory) {
    if (!key.endsWith(suffix)) continue
    data[key.slice(0, -suffix.length)] = pair
  }
  await writeSharedCache(picksCacheKey(gameweek), data, CAPTAIN_PERSIST_SECONDS)
}

async function fetchEntryExtras(
  entryId: number,
  gameweek: number,
  names: Map<number, string>,
  catalogue: Map<number, CataloguePlayer>,
  locked: boolean,
  existing: LeagueEntryPicks | undefined,
): Promise<LeagueEntryPicks | null> {
  const needPicks = locked && !extrasAreComplete(existing)
  const needHistory = !extrasHaveHistory(existing)
  if (!needPicks && !needHistory) return existing ?? null

  const [payload, transfers, history] = await Promise.all([
    needPicks
      ? fplFetch<FplPicksResponse>(`/entry/${entryId}/event/${gameweek}/picks/`).catch(() => null)
      : Promise.resolve(null),
    existing
      ? Promise.resolve(null)
      : fplFetch<FplTransferResponse[]>(`/entry/${entryId}/transfers/`).catch(() => null),
    needHistory
      ? fplFetch<FplHistoryResponse>(`/entry/${entryId}/history/`).catch(() => null)
      : Promise.resolve(null),
  ])

  if (!payload && !existing && !history) return null

  let extras = existing ?? extrasFromPicks(payload, names)
  if (payload) {
    extras = {
      ...extrasFromPicks(payload, names),
      transfersIn: extras.transfersIn,
      transfersOut: extras.transfersOut,
      freeTransfers: extras.freeTransfers,
      chipsUsed: extras.chipsUsed,
      chipsRemaining: extras.chipsRemaining,
    }
  }
  if (transfers) {
    const moves = squadMovesFromTransfers(transfers, gameweek, catalogue)
    extras = {
      ...extras,
      transfersIn: moves.map((move) => move.inName),
      transfersOut: moves.map((move) => move.outName),
    }
  }
  if (history) {
    return decorateLeagueExtras(extras, gameweek, transfers, history, catalogue)
  }
  return extras
}

function applyLeagueExtras(standings: LeagueStandingRow[], gameweek: number): LeagueStandingRow[] {
  return standings.map((row) => {
    const extras = captainMemory.get(captainKey(row.entryId, gameweek))
    const picksReady = extrasAreComplete(extras)
    return {
      ...row,
      captain: picksReady && extras ? extras.captain : null,
      viceCaptain: picksReady && extras ? extras.viceCaptain : null,
      transfers: picksReady && extras ? extras.transfers : null,
      transferCost: picksReady && extras ? extras.transferCost : null,
      transfersIn: extras?.transfersIn ?? [],
      transfersOut: extras?.transfersOut ?? [],
      freeTransfers: extras?.freeTransfers ?? null,
      chip: picksReady && extras ? extras.chip : null,
      chipsUsed: extras?.chipsUsed ?? [],
      chipsRemaining: extras?.chipsRemaining ?? [],
    }
  })
}

async function attachLeagueCaptains(
  standings: LeagueStandingRow[],
  event: FplEventState | undefined,
  options: { budgetMs?: number } = {},
) {
  const gameweek = event?.id
  if (!gameweek) return standings

  await hydrateCaptainMemory(gameweek)
  const catalogue = await getPlayerCatalogue()
  const names = new Map([...catalogue.values()].map((player) => [player.id, player.webName]))
  const locked = captainsAreLocked(event)
  const deadline = options.budgetMs != null ? Date.now() + options.budgetMs : null

  const toFetch = standings
    .map((row) => row.entryId)
    .filter((entryId) => {
      if (entryId <= 0) return false
      const extras = captainMemory.get(captainKey(entryId, gameweek))
      return (locked && !extrasAreComplete(extras)) || !extrasHaveHistory(extras)
    })

  for (let index = 0; index < toFetch.length; index += CAPTAIN_BATCH) {
    if (deadline != null && Date.now() >= deadline) break
    if (index > 0) await new Promise((resolve) => setTimeout(resolve, CAPTAIN_BATCH_GAP_MS))
    const batch = toFetch.slice(index, index + CAPTAIN_BATCH)
    let fetched = 0
    await Promise.all(batch.map(async (entryId) => {
      const key = captainKey(entryId, gameweek)
      const next = await fetchEntryExtras(entryId, gameweek, names, catalogue, locked, captainMemory.get(key))
      if (!next) return
      captainMemory.set(key, next)
      fetched += 1
    }))
    if (fetched) await persistCaptainMemory(gameweek)
  }

  return applyLeagueExtras(standings, gameweek)
}

export async function getLeagueEntryPicks(
  standings: LeagueStandingRow[],
  event: FplEventState | undefined,
) {
  await attachLeagueCaptains(standings, event)
  const gameweek = event?.id
  const picks = new Map<number, LeagueEntryPicks>()
  if (!gameweek) return picks
  for (const row of standings) {
    const extras = captainMemory.get(captainKey(row.entryId, gameweek))
    if (extras) picks.set(row.entryId, extras)
  }
  return picks
}

async function fetchLeagueStandings(leagueId: number) {
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

  return { name, standings }
}

async function currentEvent() {
  try {
    return (await getBootstrap()).current
  }
  catch {
    return undefined
  }
}

async function buildClassicLeague(
  leagueId: number,
  existing: ClassicLeagueTable | undefined,
  event: FplEventState | undefined,
  refreshStandings: boolean,
): Promise<ClassicLeagueTable> {
  let name = existing?.name ?? 'Classic league'
  let standings = existing?.standings ?? []

  if (refreshStandings || !existing) {
    try {
      const fetched = await fetchLeagueStandings(leagueId)
      name = fetched.name
      standings = fetched.standings
    }
    catch (error) {
      if (!existing?.standings.length) throw error
    }
  }

  try {
    standings = await attachLeagueCaptains(standings, event, { budgetMs: EXTRAS_BUDGET_MS })
  }
  catch {
    if (event?.id) {
      await hydrateCaptainMemory(event.id).catch(() => undefined)
      standings = applyLeagueExtras(standings, event.id)
    }
  }

  return classicLeagueTable(leagueId, name, standings, event)
}

export async function getClassicLeague(leagueId = competition.fplLeagueId) {
  const event = await currentEvent()

  if (!leagueMemory) {
    const shared = await readSharedCache<ClassicLeagueTable>(`fpl:league:${LEAGUE_CACHE_VERSION}:${leagueId}`)
    if (shared) leagueMemory = shared
  }

  if (officialLeagueCacheIsFresh(leagueMemory, event) && leagueMemory) {
    return withLeagueTableDefaults(leagueMemory.data)
  }

  const cached = leagueMemory?.data
  const sameGameweek = Boolean(cached && event?.id && cached.gameweek === event.id)
  const extrasComplete = Boolean(cached && leagueCaptainsComplete(cached.standings))
  const confirmedNow = Boolean(event?.dataChecked && cached && cached.dataChecked === false)
  const refreshStandings = !cached
    || !sameGameweek
    || confirmedNow
    || (extrasComplete && !isFresh(leagueMemory, STANDINGS_TTL_SECONDS * 1000))

  if (!leagueInflight) {
    leagueInflight = buildClassicLeague(leagueId, sameGameweek ? cached : undefined, event, refreshStandings)
      .then(async (data) => {
        leagueMemory = { at: Date.now(), data }
        await writeSharedCache(
          `fpl:league:${LEAGUE_CACHE_VERSION}:${leagueId}`,
          data,
          officialLeagueTtlSeconds(event, leagueCaptainsComplete(data.standings)),
        )
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

  if (leagueMemory) return withLeagueTableDefaults(leagueMemory.data)
  return leagueInflight.then(withLeagueTableDefaults)
}
