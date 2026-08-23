import { describe, expect, it } from 'vitest'
import { isRetryableStatus, normaliseGameweekScore, retryDelayMs } from '../server/utils/fpl'

const live = new Map([
  [9, { points: 8 }],
  [12, { points: 2 }],
  [13, { points: 4 }],
])

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

  it('drops bench boost substitute points from the fixture total', () => {
    const score = normaliseGameweekScore(1, 99, 1, {
      active_chip: 'bboost',
      entry_history: {
        points: 35,
        event_transfers_cost: 0,
      },
      picks: [
        { element: 9, position: 9, multiplier: 2, is_captain: true, is_vice_captain: false },
        { element: 12, position: 12, multiplier: 1, is_captain: false, is_vice_captain: false },
        { element: 13, position: 13, multiplier: 1, is_captain: false, is_vice_captain: false },
      ],
    }, live)
    expect(score.points).toBe(29)
    expect(score.netPoints).toBe(29)
  })

  it('scores triple captain as a normal 2x captain', () => {
    const score = normaliseGameweekScore(1, 99, 1, {
      active_chip: '3xc',
      entry_history: {
        points: 72,
        event_transfers_cost: 4,
      },
      picks: [
        { element: 9, position: 9, multiplier: 3, is_captain: true, is_vice_captain: false },
      ],
    }, live)
    expect(score.points).toBe(64)
    expect(score.netPoints).toBe(60)
  })

  it('keeps free hit totals as FPL scored them', () => {
    const score = normaliseGameweekScore(1, 99, 1, {
      active_chip: 'freehit',
      entry_history: {
        points: 81,
        event_transfers_cost: 0,
      },
      picks: [
        { element: 9, position: 9, multiplier: 2, is_captain: true, is_vice_captain: false },
        { element: 12, position: 12, multiplier: 0, is_captain: false, is_vice_captain: false },
      ],
    }, live)
    expect(score.points).toBe(81)
    expect(score.netPoints).toBe(81)
  })

  it('uses live pick totals while official FPL points lag', () => {
    const score = normaliseGameweekScore(1, 99, 1, {
      active_chip: 'bboost',
      entry_history: {
        points: 35,
        event_transfers_cost: 0,
      },
      picks: [
        { element: 9, position: 9, multiplier: 2, is_captain: true, is_vice_captain: false },
        { element: 12, position: 12, multiplier: 1, is_captain: false, is_vice_captain: false },
        { element: 13, position: 13, multiplier: 1, is_captain: false, is_vice_captain: false },
      ],
    }, live, true)
    expect(score.points).toBe(16)
    expect(score.netPoints).toBe(16)
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
