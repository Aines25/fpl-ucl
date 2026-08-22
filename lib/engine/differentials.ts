import type { ClubFixture, FplSquadView, SquadSlot } from '../types/squad'
import { isPendingFixture } from './club-fixtures'

export function competitionMultiplier(slot: SquadSlot, chip: string | null | undefined) {
  if (slot.multiplier <= 0) return 0
  if (chip === 'bboost' && slot.pickPosition > 11) return 0
  if (chip === '3xc' && slot.multiplier >= 3) return 2
  return slot.multiplier
}

export interface DifferentialRow {
  elementId: number
  webName: string
  photoUrl: string
  shirtUrl: string
  elementType: SquadSlot['elementType']
  rawPoints: number
  homeMultiplier: number
  awayMultiplier: number
  homePoints: number
  awayPoints: number
  swing: number
  kind: 'shared' | 'home' | 'away'
  fixture: ClubFixture | null
  pending: boolean
}

export interface DifferentialSummary {
  rows: DifferentialRow[]
  shared: DifferentialRow[]
  homeOnly: DifferentialRow[]
  awayOnly: DifferentialRow[]
  captainSwing: number
  playerSwing: number
  transferSwing: number
  homeTransferCost: number
  awayTransferCost: number
  netSwing: number
}

function slotIndex(slots: SquadSlot[], chip: string | null | undefined) {
  const map = new Map<number, { slot: SquadSlot, multiplier: number }>()
  for (const slot of slots) {
    const multiplier = competitionMultiplier(slot, chip)
    if (multiplier <= 0) continue
    map.set(slot.elementId, { slot, multiplier })
  }
  return map
}

export function compareSquads(
  home: FplSquadView | undefined,
  away: FplSquadView | undefined,
): DifferentialSummary | null {
  if (!home?.available || !away?.available) return null

  const homeSlots = [...home.starters, ...home.bench]
  const awaySlots = [...away.starters, ...away.bench]
  const homeIndex = slotIndex(homeSlots, home.chip)
  const awayIndex = slotIndex(awaySlots, away.chip)
  const ids = new Set([...homeIndex.keys(), ...awayIndex.keys()])

  const rows: DifferentialRow[] = []
  let captainSwing = 0

  for (const elementId of ids) {
    const homeEntry = homeIndex.get(elementId)
    const awayEntry = awayIndex.get(elementId)
    const slot = homeEntry?.slot ?? awayEntry?.slot
    if (!slot) continue

    const homeMultiplier = homeEntry?.multiplier ?? 0
    const awayMultiplier = awayEntry?.multiplier ?? 0
    const rawPoints = slot.rawPoints
    const homePoints = rawPoints * homeMultiplier
    const awayPoints = rawPoints * awayMultiplier
    const swing = homePoints - awayPoints
    const kind = homeMultiplier > 0 && awayMultiplier > 0
      ? 'shared'
      : homeMultiplier > 0 ? 'home' : 'away'

    if (kind === 'shared' && homeMultiplier === awayMultiplier && swing === 0) {
      continue
    }

    if ((homeEntry?.slot.isCaptain || awayEntry?.slot.isCaptain) && homeMultiplier !== awayMultiplier) {
      captainSwing += swing
    }

    rows.push({
      elementId,
      webName: slot.webName,
      photoUrl: slot.photoUrl,
      shirtUrl: slot.shirtUrl,
      elementType: slot.elementType,
      rawPoints,
      homeMultiplier,
      awayMultiplier,
      homePoints,
      awayPoints,
      swing,
      kind,
      fixture: slot.fixture,
      pending: isPendingFixture(slot.fixture),
    })
  }

  rows.sort((left, right) => Math.abs(right.swing) - Math.abs(left.swing) || left.webName.localeCompare(right.webName))

  const playerSwing = rows.reduce((sum, row) => sum + row.swing, 0)
  const transferSwing = away.transferCost - home.transferCost

  return {
    rows,
    shared: rows.filter((row) => row.kind === 'shared'),
    homeOnly: rows.filter((row) => row.kind === 'home'),
    awayOnly: rows.filter((row) => row.kind === 'away'),
    captainSwing,
    playerSwing,
    transferSwing,
    homeTransferCost: home.transferCost,
    awayTransferCost: away.transferCost,
    netSwing: playerSwing + transferSwing,
  }
}
