import type { ClubInfo } from '../types/squad'
import type { FdrCell, FdrGrid, FdrOpponent, FdrRating, FdrSort, FdrTeamRow } from '../types/fdr'

export const FDR_SHORT_WINDOW = 6

export interface FdrFixtureInput {
  event: number | null
  team_h: number
  team_a: number
  team_h_difficulty?: number | null
  team_a_difficulty?: number | null
}

export interface FdrEventInput {
  id: number
  finished: boolean
  isCurrent?: boolean
  isNext?: boolean
}

export function emptyFdrGrid(): FdrGrid {
  return { startGameweek: 1, gameweeks: [], teams: [] }
}

export function clampFdr(value: number | null | undefined): FdrRating {
  if (value === 1 || value === 2 || value === 3 || value === 4 || value === 5) return value
  return 3
}

export function fdrStartGameweek(events: FdrEventInput[]): number {
  const unfinished = events.filter((event) => !event.finished).sort((left, right) => left.id - right.id)
  if (unfinished[0]) return unfinished[0].id
  return events.find((event) => event.isCurrent)?.id
    ?? events.find((event) => event.isNext)?.id
    ?? events[events.length - 1]?.id
    ?? 1
}

export function remainingGameweeks(events: FdrEventInput[], startGameweek: number): number[] {
  return events
    .map((event) => event.id)
    .filter((id) => id >= startGameweek)
    .sort((left, right) => left - right)
}

export function averageFdr(cells: FdrCell[]): number | null {
  const ratings = cells.flatMap((cell) => cell.fixtures.map((fixture) => fixture.difficulty))
  if (!ratings.length) return null
  return ratings.reduce((sum, value) => sum + value, 0) / ratings.length
}

export function formatFdrAverage(value: number | null): string {
  return value == null ? '—' : value.toFixed(1)
}

export function formatFdrOpponent(fixture: FdrOpponent): string {
  return `${fixture.opponent} (${fixture.home ? 'H' : 'A'})`
}

export function sliceFdrGrid(grid: FdrGrid, count: number): FdrGrid {
  const gameweeks = grid.gameweeks.slice(0, Math.max(0, count))
  const teams = grid.teams.map((team) => {
    const cells = team.cells.filter((cell) => gameweeks.includes(cell.gameweek))
    return { ...team, cells, average: averageFdr(cells) }
  })
  return { ...grid, gameweeks, teams }
}

export function sortFdrRows(rows: FdrTeamRow[], by: FdrSort): FdrTeamRow[] {
  return [...rows].sort((left, right) => {
    if (by === 'easiest') {
      const leftAvg = left.average ?? Number.POSITIVE_INFINITY
      const rightAvg = right.average ?? Number.POSITIVE_INFINITY
      if (leftAvg !== rightAvg) return leftAvg - rightAvg
    }
    return left.shortName.localeCompare(right.shortName)
  })
}

function teamKey(teamId: number, gameweek: number) {
  return `${teamId}:${gameweek}`
}

function pushOpponent(index: Map<string, FdrOpponent[]>, teamId: number, gameweek: number, opponent: FdrOpponent) {
  const key = teamKey(teamId, gameweek)
  const existing = index.get(key)
  if (existing) existing.push(opponent)
  else index.set(key, [opponent])
}

export function buildFdrGrid(
  fixtures: FdrFixtureInput[],
  teams: ClubInfo[],
  events: FdrEventInput[],
): FdrGrid {
  if (!teams.length || !events.length) return emptyFdrGrid()

  const startGameweek = fdrStartGameweek(events)
  const gameweeks = remainingGameweeks(events, startGameweek)
  const teamMap = new Map(teams.map((team) => [team.id, team]))
  const byTeamGw = new Map<string, FdrOpponent[]>()

  for (const fixture of fixtures) {
    if (fixture.event == null || !gameweeks.includes(fixture.event)) continue

    pushOpponent(byTeamGw, fixture.team_h, fixture.event, {
      opponentId: fixture.team_a,
      opponent: teamMap.get(fixture.team_a)?.shortName ?? 'TBD',
      home: true,
      difficulty: clampFdr(fixture.team_h_difficulty),
    })
    pushOpponent(byTeamGw, fixture.team_a, fixture.event, {
      opponentId: fixture.team_h,
      opponent: teamMap.get(fixture.team_h)?.shortName ?? 'TBD',
      home: false,
      difficulty: clampFdr(fixture.team_a_difficulty),
    })
  }

  const rows: FdrTeamRow[] = [...teams]
    .sort((left, right) => left.shortName.localeCompare(right.shortName))
    .map((team) => {
      const cells: FdrCell[] = gameweeks.map((gameweek) => ({
        gameweek,
        fixtures: byTeamGw.get(teamKey(team.id, gameweek)) ?? [],
      }))
      return {
        teamId: team.id,
        shortName: team.shortName,
        cells,
        average: averageFdr(cells),
      }
    })

  return { startGameweek, gameweeks, teams: rows }
}
