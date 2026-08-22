import { describe, expect, it } from 'vitest'
import { normaliseLeagueStanding } from '../server/utils/league'

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
    })
  })
})
