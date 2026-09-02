import { describe, expect, it } from 'vitest'
import { activeCompetitionIds } from '../lib/engine/qualification'
import { standingsForGroup } from '../lib/engine/tiebreakers'
import type {
  CompetitionPlayer,
  FixtureResult,
  KnockoutTieResult,
  StandingRow,
  TournamentFixture,
} from '../lib/types/competition'

const players: CompetitionPlayer[] = [
  { id: 1, name: 'Christian', fplId: 1, group: 'A' },
  { id: 2, name: 'Dave', fplId: 2, group: 'A' },
  { id: 3, name: 'Michael', fplId: 3, group: 'A' },
  { id: 4, name: 'James', fplId: 4, group: 'A' },
]

const fixtures: TournamentFixture[] = [
  { id: '1', stage: 'group', group: 'A', matchday: 1, fplGameweek: 1, homeId: 1, awayId: 2 },
  { id: '2', stage: 'group', group: 'A', matchday: 1, fplGameweek: 1, homeId: 3, awayId: 4 },
  { id: '3', stage: 'group', group: 'A', matchday: 2, fplGameweek: 2, homeId: 1, awayId: 3 },
  { id: '4', stage: 'group', group: 'A', matchday: 2, fplGameweek: 2, homeId: 4, awayId: 2 },
]

function result(
  fixtureId: string,
  homeScore: number,
  awayScore: number,
  homeId: number,
  awayId: number,
): FixtureResult {
  const draw = homeScore === awayScore
  return {
    fixtureId,
    homeScore,
    awayScore,
    winnerId: draw ? null : homeScore > awayScore ? homeId : awayId,
    loserId: draw ? null : homeScore > awayScore ? awayId : homeId,
    draw,
    status: 'final',
  }
}

describe('standingsForGroup', () => {
  it('builds P/W/D/L/PF/PA/Pts from results', () => {
    const rows = standingsForGroup(
      [1, 2, 3, 4],
      fixtures,
      [
        result('1', 80, 60, 1, 2),
        result('2', 50, 50, 3, 4),
        result('3', 70, 40, 1, 3),
        result('4', 55, 66, 4, 2),
      ],
      players,
      2,
    )

    expect(rows[0].playerId).toBe(1)
    expect(rows[0].played).toBe(2)
    expect(rows[0].won).toBe(2)
    expect(rows[0].points).toBe(6)
    expect(rows[0].pointsFor).toBe(150)
    expect(rows[0].qualifyingZone).toBe(true)
  })

  it('breaks equal points using overall difference before head-to-head', () => {
    const rows = standingsForGroup(
      [1, 2, 3, 4],
      fixtures,
      [
        result('1', 70, 60, 1, 2),
        result('2', 50, 50, 3, 4),
        result('3', 40, 80, 1, 3),
        result('4', 10, 100, 4, 2),
      ],
      players,
      2,
    )

    const christian = rows.find((row) => row.playerId === 1)!
    const dave = rows.find((row) => row.playerId === 2)!
    expect(christian.points).toBe(3)
    expect(dave.points).toBe(3)
    expect(dave.difference).toBeGreaterThan(christian.difference)
    expect(dave.position).toBeLessThan(christian.position)
  })

  it('uses head-to-head when points and overall difference are level', () => {
    const rows = standingsForGroup(
      [1, 2, 3, 4],
      fixtures,
      [
        result('1', 70, 60, 1, 2),
        result('2', 50, 50, 3, 4),
        result('3', 40, 50, 1, 3),
        result('4', 40, 50, 4, 2),
      ],
      players,
      2,
    )

    const christian = rows.find((row) => row.playerId === 1)!
    const dave = rows.find((row) => row.playerId === 2)!
    expect(christian.points).toBe(3)
    expect(dave.points).toBe(3)
    expect(christian.difference).toBe(dave.difference)
    expect(christian.position).toBeLessThan(dave.position)
  })
})

describe('activeCompetitionIds', () => {
  function row(playerId: number, eliminated: boolean): StandingRow {
    return {
      playerId,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      difference: 0,
      points: 0,
      position: playerId,
      qualifyingZone: !eliminated,
      eliminated,
    }
  }

  it('keeps managers who are not eliminated from their group', () => {
    expect([...activeCompetitionIds({
      A: [row(1, false), row(2, true)],
      B: [row(5, false)],
    })]).toEqual([1, 5])
  })

  it('drops knockout losers once a winner is decided', () => {
    const knockout: KnockoutTieResult[] = [{
      tieId: 'r16-1',
      playerOneId: 1,
      playerTwoId: 5,
      playerOneAggregate: 80,
      playerTwoAggregate: 70,
      winnerId: 1,
      status: 'final',
      decidedByTiebreak: false,
    }]

    expect([...activeCompetitionIds({
      A: [row(1, false), row(2, true)],
      B: [row(5, false)],
    }, knockout)]).toEqual([1])
  })
})
