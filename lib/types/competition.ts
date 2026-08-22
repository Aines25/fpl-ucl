export type GroupId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H'

export type Stage =
  | 'group'
  | 'round-of-16'
  | 'quarter-final'
  | 'semi-final'
  | 'final'

export type FixtureStatus = 'scheduled' | 'live' | 'provisional' | 'final'

export interface CompetitionPlayer {
  id: number
  name: string
  fplId: number
  group: GroupId
}

export interface MatchdayMap {
  matchday: number
  fplGameweek: number
  stage: Stage
  label: string
  leg?: 1 | 2
}

export interface TournamentFixture {
  id: string
  stage: Stage
  group?: GroupId
  matchday: number
  fplGameweek: number
  homeId: number
  awayId: number
  leg?: 1 | 2
}

export interface KnockoutTieConfig {
  id: string
  stage: Exclude<Stage, 'group'>
  playerOneId: number | null
  playerTwoId: number | null
  firstLegFixtureId: string
  secondLegFixtureId?: string
}

export interface FplGameweekScore {
  managerId: number
  fplId: number
  gameweek: number
  points: number
  transferCost: number
  netPoints: number
  available: boolean
}

export interface FplEventState {
  id: number
  name: string
  isCurrent: boolean
  isNext: boolean
  finished: boolean
  dataChecked: boolean
  deadlineTime: string | null
}

export interface FixtureResult {
  fixtureId: string
  homeScore: number | null
  awayScore: number | null
  winnerId: number | null
  loserId: number | null
  draw: boolean
  status: FixtureStatus
}

export interface StandingRow {
  playerId: number
  played: number
  won: number
  drawn: number
  lost: number
  pointsFor: number
  pointsAgainst: number
  difference: number
  points: number
  position: number
  qualifyingZone: boolean
  eliminated: boolean
}

export interface KnockoutTieResult {
  tieId: string
  playerOneId: number | null
  playerTwoId: number | null
  playerOneAggregate: number | null
  playerTwoAggregate: number | null
  winnerId: number | null
  status: FixtureStatus
  decidedByTiebreak: boolean
}
