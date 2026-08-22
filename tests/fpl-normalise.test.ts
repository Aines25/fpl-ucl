import { describe, expect, it } from 'vitest'
import { normaliseGameweekScore } from '../server/utils/fpl'

describe('normaliseGameweekScore', () => {
  it('subtracts transfer cost once from gross points', () => {
    const score = normaliseGameweekScore(1, 99, 1, {
      entry_history: {
        points: 72,
        event_transfers_cost: 4,
      },
    })
    expect(score.points).toBe(72)
    expect(score.transferCost).toBe(4)
    expect(score.netPoints).toBe(68)
    expect(score.available).toBe(true)
  })
})
