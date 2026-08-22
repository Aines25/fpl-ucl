import { describe, expect, it } from 'vitest'
import { countdownParts, nextDeadlineEvent } from '../lib/engine/deadline'
import type { FplEventState } from '../lib/types/competition'

function event(id: number, deadlineTime: string, overrides: Partial<FplEventState> = {}): FplEventState {
  return {
    id,
    name: `Gameweek ${id}`,
    isCurrent: false,
    isNext: false,
    finished: false,
    dataChecked: false,
    deadlineTime,
    ...overrides,
  }
}

describe('deadline helpers', () => {
  it('picks the nearest future deadline', () => {
    const now = Date.parse('2026-08-22T12:00:00.000Z')
    const next = nextDeadlineEvent([
      event(1, '2026-08-15T10:00:00.000Z'),
      event(2, '2026-08-23T10:00:00.000Z'),
      event(3, '2026-08-30T10:00:00.000Z'),
    ], now)
    expect(next?.id).toBe(2)
  })

  it('splits a countdown into days hours minutes seconds', () => {
    expect(countdownParts(((2 * 86400) + (3 * 3600) + (4 * 60) + 5) * 1000)).toEqual({
      days: 2,
      hours: 3,
      minutes: 4,
      seconds: 5,
      totalMs: ((2 * 86400) + (3 * 3600) + (4 * 60) + 5) * 1000,
    })
  })
})
