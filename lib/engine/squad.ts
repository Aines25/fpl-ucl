import { gameweekBreakdownFromStats } from './live'
import type { CataloguePlayer, ChipBalance, ChipPlay, ClubFixture, ElementType, FplSquadView, LivePlayerStats, SquadMove, SquadSlot } from '../types/squad'

export interface SquadPick {
  element: number
  position: number
  multiplier: number
  is_captain: boolean
  is_vice_captain: boolean
}

export interface SquadPicksPayload {
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
  picks?: SquadPick[]
}

const CHIP_LABELS: Record<string, string> = {
  wildcard: 'Wildcard',
  bboost: 'Bench Boost',
  '3xc': 'Triple Captain',
  freehit: 'Free Hit',
  manager: 'Assistant Manager',
}

export const CHIP_RESET_GAMEWEEK = 20
export const SEASON_CHIPS = ['wildcard', 'freehit', 'bboost', '3xc'] as const

export type ChipHalf = 'first' | 'second'

export function chipHalf(gameweek: number): ChipHalf {
  return gameweek < CHIP_RESET_GAMEWEEK ? 'first' : 'second'
}

export interface ChipRecord {
  name?: string
  event?: number
}

export function summariseChips(
  plays: ChipRecord[] | null | undefined,
  gameweek: number,
): { chipsUsed: ChipPlay[], chipsRemaining: ChipBalance[] } {
  const chipsUsed: ChipPlay[] = []
  const usedKeys = new Set<string>()

  for (const play of plays ?? []) {
    if (!play.name || !play.event) continue
    chipsUsed.push({
      name: play.name,
      label: chipLabel(play.name) ?? play.name,
      event: play.event,
    })
    usedKeys.add(`${play.name}:${chipHalf(play.event)}`)
  }

  chipsUsed.sort((left, right) => left.event - right.event)

  const half = chipHalf(gameweek)
  const chipsRemaining: ChipBalance[] = SEASON_CHIPS
    .filter((name) => !usedKeys.has(`${name}:${half}`))
    .map((name) => ({
      name,
      label: chipLabel(name) ?? name,
      half,
    }))

  return { chipsUsed, chipsRemaining }
}

export const MAX_FREE_TRANSFERS = 5

export interface TransferWeek {
  event?: number
  event_transfers?: number
}

export function freeTransfersRemaining(
  weeks: TransferWeek[] | null | undefined,
  chips: ChipRecord[] | null | undefined,
  gameweek: number,
  thisWeek?: { transfers?: number, chip?: string | null },
): number {
  const chipByEvent = new Map<number, string>()
  for (const play of chips ?? []) {
    if (play.name && play.event) chipByEvent.set(play.event, play.name)
  }
  if (thisWeek?.chip) chipByEvent.set(gameweek, thisWeek.chip)

  const transfersByEvent = new Map<number, number>()
  for (const week of weeks ?? []) {
    if (!week.event) continue
    transfersByEvent.set(week.event, week.event_transfers ?? 0)
  }
  if (thisWeek?.transfers != null) transfersByEvent.set(gameweek, thisWeek.transfers)

  let stored = 0
  for (let event = 1; event <= gameweek; event += 1) {
    const available = Math.min(MAX_FREE_TRANSFERS, stored + 1)
    const chip = chipByEvent.get(event)
    if (chip === 'wildcard' || chip === 'freehit') {
      stored = available
      continue
    }
    stored = Math.max(0, available - (transfersByEvent.get(event) ?? 0))
  }
  return stored
}

export function playerPhotoUrl(code: number) {
  if (!code) return ''
  return `https://resources.premierleague.com/premierleague/photos/players/110x140/p${code}.png`
}

export function playerShirtUrl(teamCode: number, isGoalkeeper: boolean) {
  if (!teamCode) return ''
  const suffix = isGoalkeeper ? '_1' : ''
  return `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${teamCode}${suffix}-66.webp`
}

export function chipLabel(chip: string | null | undefined) {
  if (!chip) return null
  return CHIP_LABELS[chip] ?? chip.replaceAll('_', ' ')
}

export function elementTypeLabel(type: ElementType) {
  if (type === 1) return 'GK'
  if (type === 2) return 'DEF'
  if (type === 3) return 'MID'
  return 'FWD'
}

/**
 * Extra FPL chip points that do not count in this competition.
 * Bench Boost: drop the bench. Triple Captain: keep a normal 2x captain.
 * Free Hit and Wildcard stay as FPL scored them.
 */
export function competitionChipAdjustment(
  chip: string | null | undefined,
  picks: Array<{ element: number; position: number; multiplier: number }>,
  live: Map<number, { points: number }>,
) {
  if (chip === 'bboost') {
    return picks
      .filter((pick) => pick.position > 11)
      .reduce((sum, pick) => sum + (live.get(pick.element)?.points ?? 0), 0)
  }

  if (chip === '3xc') {
    const triple = picks.find((pick) => pick.multiplier === 3)
    return triple ? (live.get(triple.element)?.points ?? 0) : 0
  }

  return 0
}

export function livePicksGrossPoints(
  picks: Array<{ element: number; multiplier: number }>,
  live: Map<number, { points: number }>,
) {
  return picks.reduce((sum, pick) => {
    if (pick.multiplier <= 0) return sum
    return sum + (live.get(pick.element)?.points ?? 0) * pick.multiplier
  }, 0)
}

/**
 * Competition GW total: official FPL points minus house-rule chip extras,
 * or the live per-player sum when `entry_history.points` is still lagging.
 */
export function competitionGameweekPoints(
  chip: string | null | undefined,
  picks: Array<{ element: number; position: number; multiplier: number }>,
  live: Map<number, { points: number }>,
  officialPoints: number,
  useLivePoints = false,
) {
  const adjustment = competitionChipAdjustment(chip, picks, live)
  if (useLivePoints && live.size > 0 && picks.length > 0) {
    return livePicksGrossPoints(picks, live) - adjustment
  }
  return officialPoints - adjustment
}

export function formationFromTypes(types: number[]) {
  const defs = types.filter((type) => type === 2).length
  const mids = types.filter((type) => type === 3).length
  const fwds = types.filter((type) => type === 4).length
  if (!defs && !mids && !fwds) return '–'
  return `${defs}-${mids}-${fwds}`
}

export function formatTeamValue(tenths: number | null | undefined) {
  if (tenths === null || tenths === undefined) return '–'
  return `£${(tenths / 10).toFixed(1)}m`
}

export function formatTransfers(count: number, cost: number) {
  if (count === 0 && cost === 0) return '0'
  if (cost === 0) return String(count)
  return `${count} (−${cost})`
}

export function emptySquad(
  managerId: number,
  fplId: number,
  name: string,
  gameweek: number,
  teamName: string | null = null,
): FplSquadView {
  return {
    managerId,
    fplId,
    name,
    teamName,
    gameweek,
    available: false,
    points: 0,
    officialPoints: 0,
    transferCost: 0,
    netPoints: 0,
    officialNetPoints: 0,
    transfers: 0,
    moves: [],
    overallRank: null,
    eventRank: null,
    totalPoints: null,
    teamValue: null,
    bank: null,
    chip: null,
    chipLabel: null,
    chipsUsed: [],
    chipsRemaining: [],
    formation: '–',
    starters: [],
    bench: [],
    previewFromGameweek: null,
  }
}

function asElementType(value: number | undefined): ElementType {
  if (value === 2 || value === 3 || value === 4) return value
  return 1
}

function slotFromPick(
  pick: SquadPick,
  catalogue: Map<number, CataloguePlayer>,
  live: Map<number, LivePlayerStats>,
  fixtures: Map<number, ClubFixture>,
): SquadSlot {
  const player = catalogue.get(pick.element)
  const stats = live.get(pick.element)
  const elementType = asElementType(player?.elementType)
  const rawPoints = stats?.points ?? 0
  const counting = pick.multiplier > 0
  const teamId = player?.teamId ?? 0

  return {
    elementId: pick.element,
    pickPosition: pick.position,
    multiplier: pick.multiplier,
    isCaptain: pick.is_captain,
    isViceCaptain: pick.is_vice_captain,
    rawPoints,
    points: counting ? rawPoints * pick.multiplier : rawPoints,
    minutes: stats?.minutes ?? 0,
    counting,
    webName: player?.webName ?? 'Unknown',
    elementType,
    teamId,
    teamCode: player?.teamCode ?? 0,
    photoUrl: playerPhotoUrl(player?.code ?? 0),
    shirtUrl: playerShirtUrl(player?.teamCode ?? 0, elementType === 1),
    fixture: teamId ? fixtures.get(teamId) ?? null : null,
    breakdown: gameweekBreakdownFromStats(stats ?? { minutes: 0, points: 0 }, elementType),
    nowCost: player?.nowCost,
    costChangeEvent: player?.costChangeEvent,
    news: player?.news,
    newsAdded: player?.newsAdded,
    chanceOfPlayingThis: player?.chanceOfPlayingThis,
    chanceOfPlayingNext: player?.chanceOfPlayingNext,
    status: player?.status,
  }
}

export function hydrateSquad(input: {
  managerId: number
  fplId: number
  name: string
  teamName: string | null
  gameweek: number
  payload: SquadPicksPayload | null
  catalogue: Map<number, CataloguePlayer>
  live: Map<number, LivePlayerStats>
  fixtures?: Map<number, ClubFixture>
  useLivePoints?: boolean
}): FplSquadView {
  const { managerId, fplId, name, teamName, gameweek, payload, catalogue, live } = input
  const fixtures = input.fixtures ?? new Map<number, ClubFixture>()
  const picks = payload?.picks ?? []
  const history = payload?.entry_history

  if (!payload || (!picks.length && !history)) {
    return emptySquad(managerId, fplId, name, gameweek, teamName)
  }

  const slots = [...picks]
    .sort((a, b) => a.position - b.position)
    .map((pick) => slotFromPick(pick, catalogue, live, fixtures))

  const starters = slots.filter((slot) => slot.pickPosition <= 11)
  const bench = slots.filter((slot) => slot.pickPosition > 11)
  const chip = payload.active_chip ?? null
  const officialPoints = history?.points ?? 0
  const points = competitionGameweekPoints(chip, picks, live, officialPoints, input.useLivePoints)
  const transferCost = history?.event_transfers_cost ?? 0

  return {
    managerId,
    fplId,
    name,
    teamName,
    gameweek,
    available: true,
    points,
    officialPoints,
    transferCost,
    netPoints: points - transferCost,
    officialNetPoints: officialPoints - transferCost,
    transfers: history?.event_transfers ?? 0,
    moves: [],
    overallRank: history?.overall_rank ?? null,
    eventRank: history?.rank ?? null,
    totalPoints: history?.total_points ?? null,
    teamValue: history?.value ?? null,
    bank: history?.bank ?? null,
    chip,
    chipLabel: chipLabel(chip),
    chipsUsed: [],
    chipsRemaining: [],
    formation: formationFromTypes(starters.map((slot) => slot.elementType)),
    starters,
    bench,
    previewFromGameweek: null,
  }
}

function zeroSlotScoring(slot: SquadSlot): SquadSlot {
  return {
    ...slot,
    rawPoints: 0,
    points: 0,
    minutes: 0,
    breakdown: [],
  }
}

export function previewSquadFromCurrent(
  squad: FplSquadView,
  requestedGameweek: number,
  fromGameweek: number,
): FplSquadView {
  return {
    ...squad,
    gameweek: requestedGameweek,
    previewFromGameweek: fromGameweek,
    points: 0,
    officialPoints: 0,
    transferCost: 0,
    netPoints: 0,
    officialNetPoints: 0,
    transfers: 0,
    moves: [],
    eventRank: null,
    chip: null,
    chipLabel: null,
    starters: squad.starters.map(zeroSlotScoring),
    bench: squad.bench.map(zeroSlotScoring),
  }
}

export interface TransferRecord {
  element_in?: number
  element_out?: number
  element_in_cost?: number
  element_out_cost?: number
  event?: number
}

export function squadMovesFromTransfers(
  transfers: TransferRecord[] | null | undefined,
  gameweek: number,
  catalogue: Map<number, CataloguePlayer>,
): SquadMove[] {
  return (transfers ?? [])
    .filter((transfer) => transfer.event === gameweek)
    .map((transfer) => {
      const inId = transfer.element_in ?? 0
      const outId = transfer.element_out ?? 0
      return {
        inId,
        outId,
        inName: catalogue.get(inId)?.webName ?? 'Unknown',
        outName: catalogue.get(outId)?.webName ?? 'Unknown',
        inCost: transfer.element_in_cost ?? 0,
        outCost: transfer.element_out_cost ?? 0,
      }
    })
}

export function groupStartersByLine(starters: SquadSlot[]) {
  const lines: Record<'gkp' | 'def' | 'mid' | 'fwd', SquadSlot[]> = {
    gkp: [],
    def: [],
    mid: [],
    fwd: [],
  }
  for (const slot of starters) {
    if (slot.elementType === 1) lines.gkp.push(slot)
    else if (slot.elementType === 2) lines.def.push(slot)
    else if (slot.elementType === 3) lines.mid.push(slot)
    else lines.fwd.push(slot)
  }
  return lines
}
