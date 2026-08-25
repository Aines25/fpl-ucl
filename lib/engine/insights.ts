import type { LiveOwner, OwnedPlayerRow, OwnershipBand, PriceMoverRow } from '../types/league'
import type { CataloguePlayer, ElementType, SquadSlot } from '../types/squad'
import { formationFromTypes, playerPhotoUrl, playerShirtUrl } from './squad'

export const TEMPLATE_MIN = 0.5
export const POPULAR_MIN = 0.25
export const INSIGHTS_LIST_LIMIT = 20

export function ownershipBand(percent: number): OwnershipBand {
  if (percent >= TEMPLATE_MIN) return 'template'
  if (percent >= POPULAR_MIN) return 'popular'
  return 'differential'
}

export function ownershipPercent(owners: number, managerCount: number) {
  if (managerCount <= 0) return 0
  return owners / managerCount
}

function asElementType(value: number | undefined): ElementType {
  if (value === 2 || value === 3 || value === 4) return value
  return 1
}

export function ownedRowsFromOwners(
  ownersByPlayer: Record<number, LiveOwner[]>,
  catalogue: Map<number, CataloguePlayer>,
  managerCount: number,
): OwnedPlayerRow[] {
  const rows: OwnedPlayerRow[] = []
  for (const [key, owners] of Object.entries(ownersByPlayer)) {
    const elementId = Number(key)
    const player = catalogue.get(elementId)
    if (!player || !owners.length) continue
    const captains = owners.filter((owner) => owner.isCaptain).length
    const percent = ownershipPercent(owners.length, managerCount)
    const elementType = asElementType(player.elementType)
    rows.push({
      elementId,
      webName: player.webName,
      photoUrl: playerPhotoUrl(player.code),
      shirtUrl: playerShirtUrl(player.teamCode, elementType === 1),
      elementType,
      owners: owners.length,
      captains,
      percent,
      band: ownershipBand(percent),
    })
  }
  return rows.sort((left, right) =>
    right.owners - left.owners
    || right.captains - left.captains
    || left.webName.localeCompare(right.webName),
  )
}

export function mostCaptainedRows(rows: OwnedPlayerRow[]) {
  return rows
    .filter((row) => row.captains > 0)
    .slice()
    .sort((left, right) =>
      right.captains - left.captains
      || right.owners - left.owners
      || left.webName.localeCompare(right.webName),
    )
}

function countsFor(picked: OwnedPlayerRow[]) {
  const counts = { gk: 0, def: 0, mid: 0, fwd: 0, total: picked.length }
  for (const row of picked) {
    if (row.elementType === 1) counts.gk += 1
    else if (row.elementType === 2) counts.def += 1
    else if (row.elementType === 3) counts.mid += 1
    else counts.fwd += 1
  }
  return counts
}

function canComplete(counts: ReturnType<typeof countsFor>) {
  const remaining = 11 - counts.total
  if (remaining < 0) return false
  if (counts.gk > 1 || counts.def > 5 || counts.mid > 5 || counts.fwd > 3) return false
  const need = Math.max(0, 1 - counts.gk)
    + Math.max(0, 3 - counts.def)
    + Math.max(0, 2 - counts.mid)
    + Math.max(0, 1 - counts.fwd)
  return need <= remaining
}

export function templateXi(rows: OwnedPlayerRow[]): OwnedPlayerRow[] {
  const gk = rows.find((row) => row.elementType === 1)
  if (!gk) return []
  const picked = [gk]
  const rest = rows.filter((row) => row.elementId !== gk.elementId && row.elementType !== 1)
  for (const row of rest) {
    if (picked.length >= 11) break
    const next = countsFor([...picked, row])
    if (!canComplete(next)) continue
    picked.push(row)
  }
  if (picked.length !== 11) return picked
  const order: Record<ElementType, number> = { 4: 0, 3: 1, 2: 2, 1: 3 }
  return picked.sort((left, right) => order[left.elementType] - order[right.elementType] || left.webName.localeCompare(right.webName))
}

export function templateSlots(rows: OwnedPlayerRow[]): SquadSlot[] {
  return rows.map((row, index) => ({
    elementId: row.elementId,
    pickPosition: index + 1,
    multiplier: 1,
    isCaptain: false,
    isViceCaptain: false,
    rawPoints: 0,
    points: row.owners,
    minutes: 0,
    counting: true,
    webName: row.webName,
    elementType: row.elementType,
    teamId: 0,
    teamCode: 0,
    photoUrl: row.photoUrl,
    shirtUrl: row.shirtUrl,
    fixture: null,
    breakdown: [],
  }))
}

export function templateFormation(rows: OwnedPlayerRow[]) {
  return formationFromTypes(rows.map((row) => row.elementType))
}

export function priceMovers(
  ownersByPlayer: Record<number, LiveOwner[]>,
  catalogue: Map<number, CataloguePlayer>,
): { risers: PriceMoverRow[], fallers: PriceMoverRow[] } {
  const movers: PriceMoverRow[] = []
  for (const [key, owners] of Object.entries(ownersByPlayer)) {
    const player = catalogue.get(Number(key))
    const change = player?.costChangeEvent ?? 0
    if (!player || !owners.length || !change) continue
    movers.push({
      elementId: player.id,
      webName: player.webName,
      photoUrl: playerPhotoUrl(player.code),
      nowCost: player.nowCost ?? 0,
      costChangeEvent: change,
      owners: owners.length,
    })
  }
  const risers = movers
    .filter((row) => row.costChangeEvent > 0)
    .sort((left, right) => right.costChangeEvent - left.costChangeEvent || right.owners - left.owners || left.webName.localeCompare(right.webName))
  const fallers = movers
    .filter((row) => row.costChangeEvent < 0)
    .sort((left, right) => left.costChangeEvent - right.costChangeEvent || right.owners - left.owners || left.webName.localeCompare(right.webName))
  return { risers, fallers }
}

export function buildLeagueInsights(input: {
  gameweek: number
  managerCount: number
  picksComplete: boolean
  ownersByPlayer: Record<number, LiveOwner[]>
  catalogue: Map<number, CataloguePlayer>
}): {
  gameweek: number
  managerCount: number
  picksComplete: boolean
  mostOwned: OwnedPlayerRow[]
  mostCaptained: OwnedPlayerRow[]
  templateXi: SquadSlot[]
  templateFormation: string
  risers: PriceMoverRow[]
  fallers: PriceMoverRow[]
} {
  const owned = ownedRowsFromOwners(input.ownersByPlayer, input.catalogue, input.managerCount)
  const xi = templateXi(owned)
  const movers = priceMovers(input.ownersByPlayer, input.catalogue)
  return {
    gameweek: input.gameweek,
    managerCount: input.managerCount,
    picksComplete: input.picksComplete,
    mostOwned: owned.slice(0, INSIGHTS_LIST_LIMIT),
    mostCaptained: mostCaptainedRows(owned).slice(0, INSIGHTS_LIST_LIMIT),
    templateXi: templateSlots(xi),
    templateFormation: templateFormation(xi),
    risers: movers.risers.slice(0, INSIGHTS_LIST_LIMIT),
    fallers: movers.fallers.slice(0, INSIGHTS_LIST_LIMIT),
  }
}

export function formatOwnershipPercent(percent: number) {
  return `${Math.round(percent * 100)}%`
}

export function formatPrice(tenths: number | null | undefined) {
  if (tenths == null) return '–'
  return `£${(tenths / 10).toFixed(1)}m`
}

export function formatPriceChange(tenths: number) {
  if (!tenths) return '£0.0m'
  const value = (Math.abs(tenths) / 10).toFixed(1)
  return tenths > 0 ? `+£${value}m` : `−£${value}m`
}

export function playerHasAlert(player: {
  news?: string
  costChangeEvent?: number
  chanceOfPlayingThis?: number | null
  chanceOfPlayingNext?: number | null
}) {
  if (player.news?.trim()) return true
  if (player.costChangeEvent) return true
  if (player.chanceOfPlayingThis != null && player.chanceOfPlayingThis < 100) return true
  if (player.chanceOfPlayingNext != null && player.chanceOfPlayingNext < 100) return true
  return false
}

export function chanceLabel(thisRound: number | null | undefined, nextRound: number | null | undefined) {
  if (nextRound != null && nextRound < 100) return `${nextRound}% next`
  if (thisRound != null && thisRound < 100) return `${thisRound}% this GW`
  return null
}
