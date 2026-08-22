import { describe, expect, it } from 'vitest'
import {
  formatUpcomingFixture,
  indexClubFixtures,
  isPendingFixture,
  pickClubFixture,
} from '../lib/engine/club-fixtures'
import type { ClubInfo } from '../lib/types/squad'

const teams = new Map<number, ClubInfo>([
  [1, { id: 1, shortName: 'ARS', code: 3 }],
  [2, { id: 2, shortName: 'AVL', code: 7 }],
  [3, { id: 3, shortName: 'NEW', code: 4 }],
  [4, { id: 4, shortName: 'MCI', code: 43 }],
])

describe('club fixtures', () => {
  it('picks the next unstarted fixture and labels the opponent', () => {
    const fixture = pickClubFixture(4, [
      {
        team_h: 4,
        team_a: 1,
        kickoff_time: '2026-08-22T14:00:00Z',
        started: true,
        finished: true,
      },
      {
        team_h: 3,
        team_a: 4,
        kickoff_time: '2026-08-23T15:00:00Z',
        started: false,
        finished: false,
      },
    ], teams)

    expect(fixture).toEqual({
      opponent: 'NEW',
      kickoff: '2026-08-23T15:00:00Z',
      started: false,
      finished: false,
    })
    expect(isPendingFixture(fixture)).toBe(true)
    expect(formatUpcomingFixture(fixture!)).toBe('vs NEW · Sun 16:00')
  })

  it('falls back to the last fixture once every match has started', () => {
    const fixture = pickClubFixture(1, [
      {
        team_h: 1,
        team_a: 2,
        kickoff_time: '2026-08-22T11:30:00Z',
        started: true,
        finished: true,
      },
    ], teams)

    expect(fixture?.opponent).toBe('AVL')
    expect(fixture?.started).toBe(true)
    expect(isPendingFixture(fixture)).toBe(false)
  })

  it('indexes both clubs in a fixture', () => {
    const index = indexClubFixtures([
      {
        team_h: 1,
        team_a: 4,
        kickoff_time: '2026-08-22T16:30:00Z',
        started: false,
        finished: false,
      },
    ], teams)

    expect(index.get(1)?.opponent).toBe('MCI')
    expect(index.get(4)?.opponent).toBe('ARS')
    expect(formatUpcomingFixture(index.get(1)!)).toBe('vs MCI · Sat 17:30')
  })
})
