import { describe, expect, it } from 'vitest'
import { decideKnockoutWinner, goalsFromCountingPicks } from '../lib/engine/knockout'
import { drawOpen, drawRoundOf16 } from '../lib/engine/draw'
import type { KnockoutTieConfig } from '../lib/types/competition'

const tie: KnockoutTieConfig = {
  id: 'R16-1',
  stage: 'round-of-16',
  playerOneId: 1,
  playerTwoId: 2,
  firstLegFixtureId: 'a',
  secondLegFixtureId: 'b',
}

describe('decideKnockoutWinner', () => {
  it('uses aggregate points first', () => {
    expect(decideKnockoutWinner(tie, 140, 135).winnerId).toBe(1)
  })

  it('uses goals scored then conceded when aggregates are level', () => {
    const winner = decideKnockoutWinner(tie, 120, 120, {
      goals: [
        { playerId: 1, goalsScored: 8, goalsConceded: 6 },
        { playerId: 2, goalsScored: 8, goalsConceded: 4 },
      ],
    })
    expect(winner.winnerId).toBe(2)
    expect(winner.decidedByTiebreak).toBe(true)
  })

  it('sums goals from counting picks without captain multipliers', () => {
    expect(goalsFromCountingPicks(
      [
        { element: 1, multiplier: 2 },
        { element: 2, multiplier: 1 },
        { element: 3, multiplier: 0 },
      ],
      new Map([
        [1, { goalsScored: 2, goalsConceded: 1 }],
        [2, { goalsScored: 1, goalsConceded: 1 }],
        [3, { goalsScored: 4, goalsConceded: 9 }],
      ]),
    )).toEqual({ goalsScored: 3, goalsConceded: 2 })
  })

  it('uses a deterministic coin toss rather than Math.random', () => {
    const first = decideKnockoutWinner(tie, 100, 100)
    const second = decideKnockoutWinner(tie, 100, 100)
    expect(first.winnerId).toBe(second.winnerId)
    expect(first.decidedByTiebreak).toBe(true)
  })
})

describe('knockout draws', () => {
  it('never pairs a winner with their own group runner-up', () => {
    const sides = [
      { group: 'A' as const, winnerId: 1, runnerUpId: 2 },
      { group: 'B' as const, winnerId: 5, runnerUpId: 6 },
      { group: 'C' as const, winnerId: 9, runnerUpId: 10 },
      { group: 'D' as const, winnerId: 13, runnerUpId: 14 },
      { group: 'E' as const, winnerId: 17, runnerUpId: 18 },
      { group: 'F' as const, winnerId: 21, runnerUpId: 22 },
      { group: 'G' as const, winnerId: 25, runnerUpId: 26 },
      { group: 'H' as const, winnerId: 29, runnerUpId: 30 },
    ]
    let seed = 1
    const random = () => {
      seed = (seed * 16807) % 2147483647
      return seed / 2147483647
    }
    const drawn = drawRoundOf16(sides, random)
    expect(drawn).toHaveLength(8)
    for (const pairing of drawn) {
      expect(pairing.winnerGroup).not.toBe(pairing.runnerUpGroup)
    }
  })

  it('pairs an open draw without leftover players', () => {
    const pairs = drawOpen([1, 2, 3, 4], () => 0.4)
    expect(pairs).toHaveLength(2)
    expect(new Set(pairs.flat()).size).toBe(4)
  })
})
