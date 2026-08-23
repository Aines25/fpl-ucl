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
