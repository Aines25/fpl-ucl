export type ElementType = 1 | 2 | 3 | 4

export interface CataloguePlayer {
  id: number
  webName: string
  teamId: number
  teamCode: number
  elementType: ElementType
  code: number
  nowCost?: number
  costChangeEvent?: number
  news?: string
  newsAdded?: string | null
  chanceOfPlayingThis?: number | null
  chanceOfPlayingNext?: number | null
  status?: string
}

export interface LivePlayerStats {
  minutes: number
  points: number
  goalsScored?: number
  assists?: number
  cleanSheets?: number
  goalsConceded?: number
  ownGoals?: number
  penaltiesSaved?: number
  penaltiesMissed?: number
  yellowCards?: number
  redCards?: number
  saves?: number
  bonus?: number
}

export interface ClubInfo {
  id: number
  shortName: string
  code: number
}

export interface ClubFixture {
  opponent: string
  kickoff: string | null
  started: boolean
  finished: boolean
}

export interface PlayerBreakdownLine {
  identifier: string
  label: string
  count: number
  points: number
}

export interface SquadSlot {
  elementId: number
  pickPosition: number
  multiplier: number
  isCaptain: boolean
  isViceCaptain: boolean
  rawPoints: number
  points: number
  minutes: number
  counting: boolean
  webName: string
  elementType: ElementType
  teamId: number
  teamCode: number
  photoUrl: string
  shirtUrl: string
  fixture: ClubFixture | null
  breakdown: PlayerBreakdownLine[]
  nowCost?: number
  costChangeEvent?: number
  news?: string
  newsAdded?: string | null
  chanceOfPlayingThis?: number | null
  chanceOfPlayingNext?: number | null
  status?: string
}

export interface SquadMove {
  inId: number
  outId: number
  inName: string
  outName: string
  inCost: number
  outCost: number
}

export interface ChipPlay {
  name: string
  label: string
  event: number
}

export interface ChipBalance {
  name: string
  label: string
  half: 'first' | 'second'
}

export interface FplSquadView {
  managerId: number
  fplId: number
  name: string
  teamName: string | null
  gameweek: number
  available: boolean
  points: number
  officialPoints: number
  transferCost: number
  netPoints: number
  officialNetPoints: number
  transfers: number
  moves: SquadMove[]
  overallRank: number | null
  eventRank: number | null
  totalPoints: number | null
  teamValue: number | null
  bank: number | null
  chip: string | null
  chipLabel: string | null
  chipsUsed: ChipPlay[]
  chipsRemaining: ChipBalance[]
  formation: string
  starters: SquadSlot[]
  bench: SquadSlot[]
}
