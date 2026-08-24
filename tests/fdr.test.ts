import { describe, expect, it } from 'vitest'
import {
  averageFdr,
  buildFdrGrid,
  clampFdr,
  fdrStartGameweek,
  formatFdrAverage,
  formatFdrOpponent,
  remainingGameweeks,
  sliceFdrGrid,
  sortFdrRows,
} from '../lib/engine/fdr'
import type { ClubInfo } from '../lib/types/squad'

const teams: ClubInfo[] = [
  { id: 1, shortName: 'ARS', code: 3 },
  { id: 2, shortName: 'AVL', code: 7 },
  { id: 3, shortName: 'NEW', code: 4 },
  { id: 4, shortName: 'MCI', code: 43 },
]

const events = [
  { id: 1, finished: true, isCurrent: false, isNext: false },
  { id: 2, finished: false, isCurrent: true, isNext: false },
  { id: 3, finished: false, isCurrent: false, isNext: true },
  { id: 4, finished: false, isCurrent: false, isNext: false },
  { id: 5, finished: false, isCurrent: false, isNext: false },
]

describe('FDR', () => {
  it('returns an empty grid when teams or events are missing', () => {
    expect(buildFdrGrid([], [], events).teams).toEqual([])
    expect(buildFdrGrid([], teams, []).gameweeks).toEqual([])
  })

  it('clamps missing ratings to 3', () => {
    expect(clampFdr(2)).toBe(2)
    expect(clampFdr(null)).toBe(3)
    expect(clampFdr(9)).toBe(3)
  })

  it('starts from the first unfinished gameweek', () => {
    expect(fdrStartGameweek(events)).toBe(2)
    expect(fdrStartGameweek(events.map((event) => ({ ...event, finished: true })))).toBe(2)
    expect(remainingGameweeks(events, 2)).toEqual([2, 3, 4, 5])
  })

  it('assigns home and away difficulty from the club perspective', () => {
    const grid = buildFdrGrid([
      {
        event: 2,
        team_h: 1,
        team_a: 4,
        team_h_difficulty: 2,
        team_a_difficulty: 4,
      },
    ], teams, events)

    const arsenal = grid.teams.find((row) => row.shortName === 'ARS')
    const city = grid.teams.find((row) => row.shortName === 'MCI')
    expect(arsenal?.cells[0]).toEqual({
      gameweek: 2,
      fixtures: [{ opponentId: 4, opponent: 'MCI', home: true, difficulty: 2 }],
    })
    expect(city?.cells[0]).toEqual({
      gameweek: 2,
      fixtures: [{ opponentId: 1, opponent: 'ARS', home: false, difficulty: 4 }],
    })
    expect(formatFdrOpponent(arsenal!.cells[0].fixtures[0])).toBe('MCI (H)')
  })

  it('leaves blank gameweeks empty and stacks double gameweeks', () => {
    const grid = buildFdrGrid([
      {
        event: 2,
        team_h: 1,
        team_a: 2,
        team_h_difficulty: 2,
        team_a_difficulty: 3,
      },
      {
        event: 2,
        team_h: 3,
        team_a: 1,
        team_h_difficulty: 4,
        team_a_difficulty: 2,
      },
    ], teams, events)

    const arsenal = grid.teams.find((row) => row.shortName === 'ARS')
    expect(arsenal?.cells[0].fixtures).toHaveLength(2)
    expect(arsenal?.cells[1].fixtures).toEqual([])
    expect(arsenal?.average).toBe(2)
  })

  it('ignores unscheduled fixtures', () => {
    const grid = buildFdrGrid([
      {
        event: null,
        team_h: 1,
        team_a: 2,
        team_h_difficulty: 5,
        team_a_difficulty: 5,
      },
    ], teams, events)
    expect(grid.teams.every((row) => row.cells.every((cell) => cell.fixtures.length === 0))).toBe(true)
    expect(grid.teams.every((row) => row.average == null)).toBe(true)
    expect(formatFdrAverage(null)).toBe('—')
  })

  it('recomputes averages when the window is sliced', () => {
    const grid = buildFdrGrid([
      { event: 2, team_h: 1, team_a: 2, team_h_difficulty: 2, team_a_difficulty: 3 },
      { event: 3, team_h: 4, team_a: 1, team_h_difficulty: 3, team_a_difficulty: 5 },
      { event: 4, team_h: 1, team_a: 3, team_h_difficulty: 4, team_a_difficulty: 2 },
    ], teams, events)

    const short = sliceFdrGrid(grid, 1)
    const arsenal = short.teams.find((row) => row.shortName === 'ARS')
    expect(short.gameweeks).toEqual([2])
    expect(arsenal?.average).toBe(2)
    expect(formatFdrAverage(arsenal?.average ?? null)).toBe('2.0')
    expect(averageFdr(grid.teams.find((row) => row.shortName === 'ARS')!.cells)).toBeCloseTo(11 / 3)
  })

  it('sorts easiest runs first, then alphabetically', () => {
    const grid = buildFdrGrid([
      { event: 2, team_h: 1, team_a: 4, team_h_difficulty: 4, team_a_difficulty: 2 },
      { event: 2, team_h: 2, team_a: 3, team_h_difficulty: 3, team_a_difficulty: 3 },
    ], teams, events)

    const easiest = sortFdrRows(grid.teams, 'easiest').map((row) => row.shortName)
    expect(easiest[0]).toBe('MCI')
    expect(sortFdrRows(grid.teams, 'name').map((row) => row.shortName)).toEqual(['ARS', 'AVL', 'MCI', 'NEW'])
  })
})
