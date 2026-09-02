export interface LeagueStandingRow {
  rank: number
  lastRank: number | null
  entryId: number
  playerName: string
  entryName: string
  eventTotal: number
  total: number
  competitionPlayerId: number | null
  captain: string | null
  viceCaptain: string | null
  transfers: number | null
  transferCost: number | null
  transfersIn: string[]
  transfersOut: string[]
  freeTransfers: number | null
  chip: string | null
  chipsUsed: import('./squad').ChipPlay[]
  chipsRemaining: import('./squad').ChipBalance[]
}

export interface ClassicLeagueTable {
  leagueId: number
  name: string
  gameweek?: number
  dataChecked?: boolean
  picksComplete?: boolean
  standings: LeagueStandingRow[]
}

export interface LeaguePick {
  element: number
  position: number
  multiplier: number
  isCaptain: boolean
  isViceCaptain: boolean
}

export interface LeagueEntryPicks {
  captain: string | null
  viceCaptain: string | null
  transfers: number
  transferCost: number
  chip: string | null
  picks: LeaguePick[]
  transfersIn: string[]
  transfersOut: string[]
  freeTransfers: number | null
  chipsUsed: import('./squad').ChipPlay[]
  chipsRemaining: import('./squad').ChipBalance[]
}

export interface LiveOwner {
  entryId: number
  playerName: string
  entryName: string
  isCaptain: boolean
  isViceCaptain: boolean
  onBench: boolean
  competitionPlayerId: number | null
}

export interface LeagueOwnership {
  gameweek: number
  managerCount: number
  uclCount: number
  picksComplete: boolean
  ownersByPlayer: Record<number, LiveOwner[]>
}

export interface LiveFeedBreakdownLine {
  identifier: string
  label: string
  count: number
  points: number
}

export interface LiveFeedEvent {
  id: string
  at: number
  elementId: number
  webName: string
  teamShortName: string
  identifier: string
  label: string
  points: number
  occurrence: number
  gameweekPoints?: number
  gameweekBreakdown?: LiveFeedBreakdownLine[]
  matchFinished?: boolean
}

export interface LiveLeagueTable {
  leagueId: number
  name: string
  gameweek: number
  updatedAt: number
  picksComplete: boolean
  standings: LeagueStandingRow[]
  feed: LiveFeedEvent[]
  ownersByPlayer: Record<number, LiveOwner[]>
}

export type OwnershipBand = 'template' | 'popular' | 'differential'

export interface OwnedPlayerRow {
  elementId: number
  webName: string
  photoUrl: string
  shirtUrl: string
  elementType: import('./squad').ElementType
  owners: number
  captains: number
  percent: number
  band: OwnershipBand
}

export interface PriceMoverRow {
  elementId: number
  webName: string
  photoUrl: string
  nowCost: number
  costChangeEvent: number
  owners: number
}

export interface LeagueInsights {
  gameweek: number
  managerCount: number
  picksComplete: boolean
  mostOwned: OwnedPlayerRow[]
  mostCaptained: OwnedPlayerRow[]
  templateXi: import('./squad').SquadSlot[]
  templateFormation: string
  risers: PriceMoverRow[]
  fallers: PriceMoverRow[]
}
