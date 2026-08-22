import { describe, expect, it } from 'vitest'
import { isRetryableStatus, normaliseGameweekScore, retryDelayMs } from '../server/utils/fpl'

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

  it('retries transient FPL failures, not missing teams', () => {
    expect(isRetryableStatus(429)).toBe(true)
    expect(isRetryableStatus(403)).toBe(true)
    expect(isRetryableStatus(503)).toBe(true)
    expect(isRetryableStatus(404)).toBe(false)
    expect(retryDelayMs(0, 429)).toBe(400)
    expect(retryDelayMs(1, 500)).toBe(400)
  })
})
