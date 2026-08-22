import { describe, expect, it } from 'vitest'
import { remainingGroupFixtures, scenariosForGroup } from '../lib/engine/scenarios'
import type {
  CompetitionPlayer,
  FixtureResult,
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
  status: FixtureResult['status'] = 'final',
): FixtureResult {
  const draw = homeScore === awayScore
  return {
    fixtureId,
    homeScore,
    awayScore,
    winnerId: draw ? null : homeScore > awayScore ? homeId : awayId,
    loserId: draw ? null : homeScore > awayScore ? awayId : homeId,
    draw,
    status,
  }
}

describe('scenariosForGroup', () => {
  it('marks locked tables as qualified or eliminated', () => {
    const scenarios = scenariosForGroup(
      'A',
      [1, 2, 3, 4],
      fixtures,
      [
        result('1', 80, 40, 1, 2),
        result('2', 70, 40, 3, 4),
        result('3', 80, 40, 1, 3),
        result('4', 40, 80, 4, 2),
      ],
      players,
    )

    expect(scenarios.remainingFixtures).toBe(0)
    expect(scenarios.lines.find((line) => line.playerId === 1)?.status).toBe('qualified')
    expect(scenarios.lines.find((line) => line.playerId === 2)?.status).toBe('qualified')
    expect(scenarios.lines.find((line) => line.playerId === 4)?.status).toBe('eliminated')
  })

  it('says a group leader qualifies with a draw or better when that is enough', () => {
    const scenarios = scenariosForGroup(
      'A',
      [1, 2, 3, 4],
      fixtures,
      [
        result('1', 80, 40, 1, 2),
        result('2', 40, 80, 3, 4),
      ],
      players,
    )

    expect(scenarios.enumerated).toBe(true)
    expect(scenarios.remainingFixtures).toBe(2)
    const christian = scenarios.lines.find((line) => line.playerId === 1)!
    expect(christian.status).toBe('contention')
    expect(christian.qualifyCount).toBeGreaterThan(0)
    expect(christian.qualifyCount).toBeLessThan(christian.scenarioCount)
    expect(christian.message).toBe('Qualifies with a draw or better')
  })

  it('treats live fixtures as still remaining', () => {
    const remaining = remainingGroupFixtures(fixtures, [
      result('1', 20, 10, 1, 2, 'live'),
      result('2', 15, 15, 3, 4, 'live'),
    ])
    expect(remaining.map((fixture) => fixture.id)).toEqual(['1', '2', '3', '4'])
  })

  it('skips full enumeration when too many fixtures remain', () => {
    const many: TournamentFixture[] = Array.from({ length: 8 }, (_, index) => ({
      id: `x-${index}`,
      stage: 'group' as const,
      group: 'A' as const,
      matchday: index + 1,
      fplGameweek: index + 1,
      homeId: index % 2 === 0 ? 1 : 3,
      awayId: index % 2 === 0 ? 2 : 4,
    }))
    const scenarios = scenariosForGroup('A', [1, 2, 3, 4], many, [], players)
    expect(scenarios.enumerated).toBe(false)
    expect(scenarios.placeholder).toBe('Too early to call')
    expect(scenarios.lines).toEqual([])
  })
})
