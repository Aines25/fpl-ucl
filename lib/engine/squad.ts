import type { CataloguePlayer, ClubFixture, ElementType, FplSquadView, LivePlayerStats, SquadSlot } from '../types/squad'

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
    transferCost: 0,
    netPoints: 0,
    transfers: 0,
    overallRank: null,
    eventRank: null,
    totalPoints: null,
    teamValue: null,
    bank: null,
    chip: null,
    chipLabel: null,
    formation: '–',
    starters: [],
    bench: [],
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
  const points = (history?.points ?? 0) - competitionChipAdjustment(chip, picks, live)
  const transferCost = history?.event_transfers_cost ?? 0

  return {
    managerId,
    fplId,
    name,
    teamName,
    gameweek,
    available: true,
    points,
    transferCost,
    netPoints: points - transferCost,
    transfers: history?.event_transfers ?? 0,
    overallRank: history?.overall_rank ?? null,
    eventRank: history?.rank ?? null,
    totalPoints: history?.total_points ?? null,
    teamValue: history?.value ?? null,
    bank: history?.bank ?? null,
    chip,
    chipLabel: chipLabel(chip),
    formation: formationFromTypes(starters.map((slot) => slot.elementType)),
    starters,
    bench,
  }
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
