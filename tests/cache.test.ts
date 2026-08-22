import { describe, expect, it } from 'vitest'
import { isFresh } from '../server/utils/cache'

describe('isFresh', () => {
  it('is false for missing entries', () => {
    expect(isFresh(null, 1000)).toBe(false)
    expect(isFresh(undefined, 1000)).toBe(false)
  })

  it('is true within the ttl and false afterwards', () => {
    expect(isFresh({ at: Date.now() - 100, data: 1 }, 1000)).toBe(true)
    expect(isFresh({ at: Date.now() - 2000, data: 1 }, 1000)).toBe(false)
  })
})
