export type FdrRating = 1 | 2 | 3 | 4 | 5

export type FdrSort = 'easiest' | 'name'

export interface FdrOpponent {
  opponentId: number
  opponent: string
  home: boolean
  difficulty: FdrRating
}

export interface FdrCell {
  gameweek: number
  fixtures: FdrOpponent[]
}

export interface FdrTeamRow {
  teamId: number
  shortName: string
  cells: FdrCell[]
  average: number | null
}

export interface FdrGrid {
  startGameweek: number
  gameweeks: number[]
  teams: FdrTeamRow[]
}
