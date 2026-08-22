import { describe, expect, it } from 'vitest'
import { captainsAreLocked, captainsFromPicks, normaliseLeagueStanding } from '../server/utils/league'

describe('normaliseLeagueStanding', () => {
  it('maps FPL standings and flags tournament managers', () => {
    const row = normaliseLeagueStanding({
      rank: 2,
      last_rank: 5,
      entry: 12878,
      player_name: 'Christian Smith-Rose',
      entry_name: 'UCL XI',
      event_total: 61,
      total: 412,
    }, new Map([[12878, 16]]))

    expect(row).toEqual({
      rank: 2,
      lastRank: 5,
      entryId: 12878,
      playerName: 'Christian Smith-Rose',
      entryName: 'UCL XI',
      eventTotal: 61,
      total: 412,
      competitionPlayerId: 16,
      captain: null,
      viceCaptain: null,
    })
  })
})

describe('captainsFromPicks', () => {
  it('resolves captain and vice names from the catalogue', () => {
    expect(captainsFromPicks([
      { element: 1, position: 1, multiplier: 2, is_captain: true, is_vice_captain: false },
      { element: 2, position: 2, multiplier: 1, is_captain: false, is_vice_captain: true },
    ], new Map([[1, 'Haaland'], [2, 'Salah']]))).toEqual({
      captain: 'Haaland',
      viceCaptain: 'Salah',
    })
  })

  it('returns nulls when picks are missing', () => {
    expect(captainsFromPicks(undefined, new Map())).toEqual({
      captain: null,
      viceCaptain: null,
    })
  })
})

describe('captainsAreLocked', () => {
  it('treats a current or finished event as locked', () => {
    expect(captainsAreLocked({
      id: 3,
      name: 'Gameweek 3',
      isCurrent: true,
      isNext: false,
      finished: false,
      dataChecked: false,
      deadlineTime: '2099-01-01T11:00:00Z',
    })).toBe(true)
  })

  it('waits until the deadline for the next event', () => {
    expect(captainsAreLocked({
      id: 4,
      name: 'Gameweek 4',
      isCurrent: false,
      isNext: true,
      finished: false,
      dataChecked: false,
      deadlineTime: '2099-01-01T11:00:00Z',
    }, Date.parse('2098-12-31T11:00:00Z'))).toBe(false)

    expect(captainsAreLocked({
      id: 4,
      name: 'Gameweek 4',
      isCurrent: false,
      isNext: true,
      finished: false,
      dataChecked: false,
      deadlineTime: '2099-01-01T11:00:00Z',
    }, Date.parse('2099-01-01T11:00:00Z'))).toBe(true)
  })
})
