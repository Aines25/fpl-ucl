import type {
  FplEventState,
  FplGameweekScore,
  FixtureResult,
  FixtureStatus,
  TournamentFixture,
} from '../types/competition'

export function eventStatus(event: FplEventState | undefined): FixtureStatus {
  if (!event) return 'scheduled'
  if (event.dataChecked) return 'final'
  if (event.finished) return 'provisional'
  if (event.isCurrent) return 'live'
  return 'scheduled'
}

export function determineFixtureResult(
  fixture: TournamentFixture,
  home: FplGameweekScore | undefined,
  away: FplGameweekScore | undefined,
  event: FplEventState | undefined,
): FixtureResult {
  const status = eventStatus(event)
  const homeReady = Boolean(home?.available)
  const awayReady = Boolean(away?.available)

  if (!homeReady || !awayReady || status === 'scheduled') {
    return {
      fixtureId: fixture.id,
      homeScore: homeReady ? home!.netPoints : null,
      awayScore: awayReady ? away!.netPoints : null,
      winnerId: null,
      loserId: null,
      draw: false,
      status: homeReady && awayReady && status !== 'scheduled' ? status : 'scheduled',
    }
  }

  const homeScore = home!.netPoints
  const awayScore = away!.netPoints

  if (homeScore > awayScore) {
    return {
      fixtureId: fixture.id,
      homeScore,
      awayScore,
      winnerId: fixture.homeId,
      loserId: fixture.awayId,
      draw: false,
      status,
    }
  }

  if (awayScore > homeScore) {
    return {
      fixtureId: fixture.id,
      homeScore,
      awayScore,
      winnerId: fixture.awayId,
      loserId: fixture.homeId,
      draw: false,
      status,
    }
  }

  return {
    fixtureId: fixture.id,
    homeScore,
    awayScore,
    winnerId: null,
    loserId: null,
    draw: true,
    status,
  }
}

export function resultCountsForStandings(result: FixtureResult) {
  return result.status !== 'scheduled' && result.homeScore !== null && result.awayScore !== null
}
