import { describe, expect, it } from 'vitest'
import { determineFixtureResult, shouldUseLiveGameweekPoints } from '../lib/engine/results'
import type { FplEventState, FplGameweekScore, TournamentFixture } from '../lib/types/competition'

const fixture: TournamentFixture = {
  id: 'A-MD1-1',
  stage: 'group',
  group: 'A',
  matchday: 1,
  fplGameweek: 1,
  homeId: 1,
  awayId: 2,
}

function score(managerId: number, netPoints: number, points = netPoints, transferCost = 0): FplGameweekScore {
  return {
    managerId,
    fplId: managerId,
    gameweek: 1,
    points,
    transferCost,
    netPoints,
    available: true,
  }
}

function event(overrides: Partial<FplEventState> = {}): FplEventState {
  return {
    id: 1,
    name: 'Gameweek 1',
    isCurrent: true,
    isNext: false,
    finished: false,
    dataChecked: false,
    deadlineTime: null,
    ...overrides,
  }
}

describe('determineFixtureResult', () => {
  it('awards a home win on higher net points', () => {
    const result = determineFixtureResult(fixture, score(1, 72), score(2, 64), event({ dataChecked: true, finished: true }))
    expect(result.winnerId).toBe(1)
    expect(result.loserId).toBe(2)
    expect(result.draw).toBe(false)
    expect(result.status).toBe('final')
  })

  it('uses net points after transfer cost, never double-counting', () => {
    const home = score(1, 68, 72, 4)
    const away = score(2, 70, 70, 0)
    const result = determineFixtureResult(fixture, home, away, event({ finished: true, dataChecked: true }))
    expect(result.homeScore).toBe(68)
    expect(result.awayScore).toBe(70)
    expect(result.winnerId).toBe(2)
  })

  it('marks live scores as live, not final', () => {
    const result = determineFixtureResult(fixture, score(1, 40), score(2, 38), event())
    expect(result.status).toBe('live')
    expect(result.winnerId).toBe(1)
  })

  it('is a draw when net points are equal', () => {
    const result = determineFixtureResult(fixture, score(1, 55), score(2, 55), event({ finished: true }))
    expect(result.draw).toBe(true)
    expect(result.winnerId).toBeNull()
    expect(result.status).toBe('provisional')
  })

  it('stays scheduled when both sides have 0 before the gameweek starts', () => {
    const result = determineFixtureResult(fixture, score(1, 0), score(2, 0), undefined)
    expect(result.status).toBe('scheduled')
    expect(result.winnerId).toBeNull()
  })

  it('treats scored fixtures as live when event metadata is missing', () => {
    const result = determineFixtureResult(fixture, score(1, 15), score(2, 15), undefined)
    expect(result.status).toBe('live')
    expect(result.homeScore).toBe(15)
    expect(result.awayScore).toBe(15)
    expect(result.draw).toBe(true)
  })

  it('keeps a live status if one side failed to load', () => {
    const result = determineFixtureResult(fixture, score(1, 20), undefined, event())
    expect(result.status).toBe('live')
    expect(result.homeScore).toBe(20)
    expect(result.awayScore).toBeNull()
    expect(result.winnerId).toBeNull()
  })
})

describe('shouldUseLiveGameweekPoints', () => {
  it('uses the live feed until FPL finishes the gameweek', () => {
    expect(shouldUseLiveGameweekPoints(undefined)).toBe(true)
    expect(shouldUseLiveGameweekPoints(event())).toBe(true)
    expect(shouldUseLiveGameweekPoints(event({ finished: true }))).toBe(false)
    expect(shouldUseLiveGameweekPoints(event({ dataChecked: true }))).toBe(false)
  })
})
