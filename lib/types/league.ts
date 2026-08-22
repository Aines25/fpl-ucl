export interface LeagueStandingRow {
  rank: number
  lastRank: number | null
  entryId: number
  playerName: string
  entryName: string
  eventTotal: number
  total: number
  competitionPlayerId: number | null
}

export interface ClassicLeagueTable {
  leagueId: number
  name: string
  standings: LeagueStandingRow[]
}
