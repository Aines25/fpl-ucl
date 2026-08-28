import { describe, expect, it } from 'vitest'
import { clampTtlToNextDeadline, countdownParts, nextDeadlineEvent } from '../lib/engine/deadline'
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

describe('clampTtlToNextDeadline', () => {
  const events = [
    event(4, '2026-08-15T10:00:00.000Z', { finished: true, dataChecked: true }),
    event(5, '2026-08-22T10:00:00.000Z', { isCurrent: true, finished: true, dataChecked: true }),
    event(6, '2026-08-29T10:00:00.000Z', { isNext: true }),
  ]

  it('keeps the base ttl when the next deadline is further away', () => {
    const now = Date.parse('2026-08-23T10:00:00.000Z')
    expect(clampTtlToNextDeadline(events, 5, 3600, now)).toBe(3600)
  })

  it('caps the ttl at the seconds remaining until the next deadline', () => {
    const now = Date.parse('2026-08-29T09:58:00.000Z')
    expect(clampTtlToNextDeadline(events, 5, 12 * 3600, now)).toBe(120)
  })

  it('returns a short ttl once the next deadline has passed', () => {
    const now = Date.parse('2026-08-29T12:00:00.000Z')
    expect(clampTtlToNextDeadline(events, 5, 12 * 3600, now)).toBe(60)
  })

  it('never drops below one minute right before the deadline', () => {
    const now = Date.parse('2026-08-29T09:59:50.000Z')
    expect(clampTtlToNextDeadline(events, 5, 12 * 3600, now)).toBe(60)
  })

  it('leaves the ttl alone when there is no next event', () => {
    const now = Date.parse('2026-08-29T12:00:00.000Z')
    expect(clampTtlToNextDeadline(events, 6, 600, now)).toBe(600)
  })
})
