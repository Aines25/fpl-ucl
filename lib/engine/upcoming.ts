import type { FixtureResult, TournamentFixture } from '../types/competition'

export function upcomingFixtureFor(
  playerId: number,
  fixtures: TournamentFixture[],
  results: FixtureResult[],
) {
  const resultById = new Map(results.map((result) => [result.fixtureId, result]))
  return fixtures.find((fixture) => {
    if (fixture.homeId !== playerId && fixture.awayId !== playerId) return false
    const result = resultById.get(fixture.id)
    return !result || result.status !== 'final'
  })
}
