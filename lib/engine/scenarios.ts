import { competition } from '../../data/competition'
import type {
  CompetitionPlayer,
  FixtureResult,
  GroupScenarios,
  QualificationLine,
  QualificationStatus,
  TournamentFixture,
} from '../types/competition'
import { standingsForGroup } from './tiebreakers'

export const MAX_ENUMERATED_FIXTURES = 6

export type ScenarioOutcome = 'home' | 'draw' | 'away'

const OUTCOMES: ScenarioOutcome[] = ['home', 'draw', 'away']

export function lockedGroupResults(results: FixtureResult[]) {
  return results.filter((result) => result.status === 'final')
}

export function remainingGroupFixtures(
  fixtures: TournamentFixture[],
  results: FixtureResult[],
) {
  const lockedIds = new Set(lockedGroupResults(results).map((result) => result.fixtureId))
  return fixtures.filter((fixture) => fixture.stage === 'group' && !lockedIds.has(fixture.id))
}

export function hypotheticalResult(
  fixture: TournamentFixture,
  outcome: ScenarioOutcome,
): FixtureResult {
  if (outcome === 'home') {
    return {
      fixtureId: fixture.id,
      homeScore: 1,
      awayScore: 0,
      winnerId: fixture.homeId,
      loserId: fixture.awayId,
      draw: false,
      status: 'final',
    }
  }
  if (outcome === 'away') {
    return {
      fixtureId: fixture.id,
      homeScore: 0,
      awayScore: 1,
      winnerId: fixture.awayId,
      loserId: fixture.homeId,
      draw: false,
      status: 'final',
    }
  }
  return {
    fixtureId: fixture.id,
    homeScore: 0,
    awayScore: 0,
    winnerId: null,
    loserId: null,
    draw: true,
    status: 'final',
  }
}

export function enumerateOutcomeSets(count: number): ScenarioOutcome[][] {
  const total = 3 ** count
  const sets: ScenarioOutcome[][] = []
  for (let index = 0; index < total; index += 1) {
    const set: ScenarioOutcome[] = []
    let cursor = index
    for (let fixture = 0; fixture < count; fixture += 1) {
      set.push(OUTCOMES[cursor % 3])
      cursor = Math.floor(cursor / 3)
    }
    sets.push(set)
  }
  return sets
}

function ownOutcome(
  fixture: TournamentFixture,
  playerId: number,
  outcome: ScenarioOutcome,
): 'win' | 'draw' | 'loss' | null {
  if (fixture.homeId !== playerId && fixture.awayId !== playerId) return null
  if (outcome === 'draw') return 'draw'
  const homeWin = outcome === 'home'
  const playerIsHome = fixture.homeId === playerId
  return homeWin === playerIsHome ? 'win' : 'loss'
}

function describeLine(
  playerId: number,
  status: QualificationStatus,
  qualifyCount: number,
  scenarioCount: number,
  remaining: TournamentFixture[],
  outcomeSets: ScenarioOutcome[][],
  qualifiedMask: boolean[],
): string {
  if (status === 'qualified') return 'Qualified'
  if (status === 'eliminated') return 'Eliminated'
  if (!scenarioCount) return 'Still in contention'

  const ownFixtures = remaining
    .map((fixture, index) => ({ fixture, index }))
    .filter(({ fixture }) => fixture.homeId === playerId || fixture.awayId === playerId)

  if (ownFixtures.length === 1) {
    const { fixture, index } = ownFixtures[0]
    let winQualify = 0
    let winTotal = 0
    let drawQualify = 0
    let drawTotal = 0
    let lossQualify = 0
    let lossTotal = 0

    outcomeSets.forEach((set, scenarioIndex) => {
      const result = ownOutcome(fixture, playerId, set[index])
      const qualifies = qualifiedMask[scenarioIndex]
      if (result === 'win') {
        winTotal += 1
        if (qualifies) winQualify += 1
      }
      else if (result === 'draw') {
        drawTotal += 1
        if (qualifies) drawQualify += 1
      }
      else if (result === 'loss') {
        lossTotal += 1
        if (qualifies) lossQualify += 1
      }
    })

    const always = (count: number, total: number) => total > 0 && count === total
    const never = (count: number) => count === 0
    const sometimes = (count: number, total: number) => count > 0 && count < total

    if (always(winQualify, winTotal) && always(drawQualify, drawTotal)) {
      return 'Qualifies with a draw or better'
    }
    if (always(winQualify, winTotal) && never(drawQualify) && never(lossQualify)) {
      return 'Qualifies with a win'
    }
    if (always(winQualify, winTotal) && sometimes(drawQualify, drawTotal)) {
      return 'Qualifies with a win; a draw may be enough'
    }
    if (always(winQualify, winTotal) && never(drawQualify) && sometimes(lossQualify, lossTotal)) {
      return 'Needs a win, or a loss and help'
    }
    if (sometimes(winQualify, winTotal) && never(drawQualify) && never(lossQualify)) {
      return 'Needs a win and help'
    }
    if (never(winQualify) && sometimes(drawQualify, drawTotal)) {
      return 'Needs a draw and help'
    }
    if (lossQualify > 0 && winQualify + drawQualify < qualifyCount) {
      return 'Can still qualify even with a loss'
    }
  }

  const percent = Math.round((qualifyCount / scenarioCount) * 100)
  return `Still in contention · ${percent}% of remaining outcomes`
}

export function scenariosForGroup(
  group: GroupScenarios['group'],
  playerIds: number[],
  fixtures: TournamentFixture[],
  results: FixtureResult[],
  players: CompetitionPlayer[],
  qualifyPerGroup = competition.groupStage.qualifyPerGroup,
): GroupScenarios {
  const groupFixtures = fixtures.filter(
    (fixture) => fixture.stage === 'group' && playerIds.includes(fixture.homeId),
  )
  const remaining = remainingGroupFixtures(groupFixtures, results)
  const locked = lockedGroupResults(results).filter((result) =>
    groupFixtures.some((fixture) => fixture.id === result.fixtureId),
  )
  const current = standingsForGroup(playerIds, groupFixtures, results, players, qualifyPerGroup)
  const currentById = new Map(current.map((row) => [row.playerId, row]))

  if (!remaining.length) {
    return {
      group,
      remainingFixtures: 0,
      enumerated: true,
      lines: current.map((row) => ({
        playerId: row.playerId,
        status: row.qualifyingZone ? 'qualified' : 'eliminated',
        qualifyCount: row.qualifyingZone ? 1 : 0,
        scenarioCount: 1,
        message: row.qualifyingZone ? 'Qualified' : 'Eliminated',
      })),
    }
  }

  if (remaining.length > MAX_ENUMERATED_FIXTURES) {
    return {
      group,
      remainingFixtures: remaining.length,
      enumerated: false,
      placeholder: 'Too early to call',
      lines: [],
    }
  }

  const outcomeSets = enumerateOutcomeSets(remaining.length)
  const qualifyCounts = new Map(playerIds.map((id) => [id, 0]))

  const qualifiedMask = outcomeSets.map((set) => {
    const hypothetical = set.map((outcome, index) => hypotheticalResult(remaining[index], outcome))
    const rows = standingsForGroup(
      playerIds,
      groupFixtures,
      [...locked, ...hypothetical],
      players,
      qualifyPerGroup,
    )
    for (const row of rows) {
      if (row.position <= qualifyPerGroup) {
        qualifyCounts.set(row.playerId, (qualifyCounts.get(row.playerId) ?? 0) + 1)
      }
    }
    return rows
  })

  const lines: QualificationLine[] = playerIds
    .map((playerId) => {
      const qualifyCount = qualifyCounts.get(playerId) ?? 0
      const scenarioCount = outcomeSets.length
      const status: QualificationStatus = qualifyCount === scenarioCount
        ? 'qualified'
        : qualifyCount === 0
          ? 'eliminated'
          : 'contention'
      const mask = qualifiedMask.map((rows) => {
        const row = rows.find((entry) => entry.playerId === playerId)
        return Boolean(row && row.position <= qualifyPerGroup)
      })
      return {
        playerId,
        status,
        qualifyCount,
        scenarioCount,
        message: describeLine(playerId, status, qualifyCount, scenarioCount, remaining, outcomeSets, mask),
      }
    })
    .sort((left, right) => {
      const leftPos = currentById.get(left.playerId)?.position ?? 99
      const rightPos = currentById.get(right.playerId)?.position ?? 99
      return leftPos - rightPos
    })

  return {
    group,
    remainingFixtures: remaining.length,
    enumerated: true,
    lines,
  }
}
