import type { KnockoutTieConfig, TournamentFixture } from '../lib/types/competition'

/**
 * Knockout fixtures are empty until a draw is run and committed.
 * Runtime code must never call Math.random() to fill these.
 */
export const knockoutFixtures: TournamentFixture[] = []

export const knockoutTies: KnockoutTieConfig[] = [
  ...Array.from({ length: 8 }, (_, index) => ({
    id: `R16-${index + 1}`,
    stage: 'round-of-16' as const,
    playerOneId: null,
    playerTwoId: null,
    firstLegFixtureId: `R16-${index + 1}-L1`,
    secondLegFixtureId: `R16-${index + 1}-L2`,
  })),
  ...Array.from({ length: 4 }, (_, index) => ({
    id: `QF-${index + 1}`,
    stage: 'quarter-final' as const,
    playerOneId: null,
    playerTwoId: null,
    firstLegFixtureId: `QF-${index + 1}-L1`,
    secondLegFixtureId: `QF-${index + 1}-L2`,
  })),
  ...Array.from({ length: 2 }, (_, index) => ({
    id: `SF-${index + 1}`,
    stage: 'semi-final' as const,
    playerOneId: null,
    playerTwoId: null,
    firstLegFixtureId: `SF-${index + 1}-L1`,
    secondLegFixtureId: `SF-${index + 1}-L2`,
  })),
  {
    id: 'F-1',
    stage: 'final',
    playerOneId: null,
    playerTwoId: null,
    firstLegFixtureId: 'F-1-L1',
  },
]
