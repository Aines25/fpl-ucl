export type ElementType = 1 | 2 | 3 | 4

export interface CataloguePlayer {
  id: number
  webName: string
  teamId: number
  teamCode: number
  elementType: ElementType
  code: number
}

export interface LivePlayerStats {
  minutes: number
  points: number
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
}

export interface FplSquadView {
  managerId: number
  fplId: number
  name: string
  teamName: string | null
  gameweek: number
  available: boolean
  points: number
  transferCost: number
  netPoints: number
  transfers: number
  overallRank: number | null
  eventRank: number | null
  totalPoints: number | null
  teamValue: number | null
  bank: number | null
  chip: string | null
  chipLabel: string | null
  formation: string
  starters: SquadSlot[]
  bench: SquadSlot[]
}
