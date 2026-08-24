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
  chip: string | null
}

export interface ClassicLeagueTable {
  leagueId: number
  name: string
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
