import type {
  CompetitionPlayer,
  FixtureResult,
  StandingRow,
  TournamentFixture,
} from '../types/competition'
import { applyMathematicalElimination, buildGroupTable, toStandingRows } from './standings'

function fixturesBetween(
  fixtures: TournamentFixture[],
  results: FixtureResult[],
  ids: number[],
) {
  const idSet = new Set(ids)
  const resultById = new Map(results.map((result) => [result.fixtureId, result]))
  return fixtures
    .filter((fixture) => idSet.has(fixture.homeId) && idSet.has(fixture.awayId))
    .map((fixture) => ({ fixture, result: resultById.get(fixture.id) }))
}

function headToHeadRecord(
  playerId: number,
  tiedIds: number[],
  fixtures: TournamentFixture[],
  results: FixtureResult[],
) {
  let points = 0
  let difference = 0
  let pointsFor = 0

  for (const { fixture, result } of fixturesBetween(fixtures, results, tiedIds)) {
    if (!result || result.homeScore === null || result.awayScore === null) continue
    const isHome = fixture.homeId === playerId
    const isAway = fixture.awayId === playerId
    if (!isHome && !isAway) continue

    const scored = isHome ? result.homeScore : result.awayScore
    const conceded = isHome ? result.awayScore : result.homeScore
    pointsFor += scored
    difference += scored - conceded
    if (result.draw) points += 1
    else if (result.winnerId === playerId) points += 3
  }

  return { points, difference, pointsFor }
}

function compareTiedPlayers(
  left: StandingRow,
  right: StandingRow,
  tiedIds: number[],
  fixtures: TournamentFixture[],
  results: FixtureResult[],
  players: CompetitionPlayer[],
) {
  if (left.difference !== right.difference) return right.difference - left.difference

  const leftH2h = headToHeadRecord(left.playerId, tiedIds, fixtures, results)
  const rightH2h = headToHeadRecord(right.playerId, tiedIds, fixtures, results)

  if (leftH2h.points !== rightH2h.points) return rightH2h.points - leftH2h.points
  if (leftH2h.difference !== rightH2h.difference) return rightH2h.difference - leftH2h.difference
  if (left.pointsFor !== right.pointsFor) return right.pointsFor - left.pointsFor

  const leftName = players.find((player) => player.id === left.playerId)?.name ?? ''
  const rightName = players.find((player) => player.id === right.playerId)?.name ?? ''
  return leftName.localeCompare(rightName)
}

function sortCluster(
  cluster: StandingRow[],
  fixtures: TournamentFixture[],
  results: FixtureResult[],
  players: CompetitionPlayer[],
) {
  const tiedIds = cluster.map((row) => row.playerId)
  return [...cluster].sort((left, right) =>
    compareTiedPlayers(left, right, tiedIds, fixtures, results, players),
  )
}

export function rankGroup(
  rows: StandingRow[],
  fixtures: TournamentFixture[],
  results: FixtureResult[],
  players: CompetitionPlayer[],
): StandingRow[] {
  const byPoints = [...rows].sort((left, right) => {
    if (left.points !== right.points) return right.points - left.points
    return left.playerId - right.playerId
  })

  const ranked: StandingRow[] = []
  let index = 0
  while (index < byPoints.length) {
    let end = index
    while (end + 1 < byPoints.length && byPoints[end + 1].points === byPoints[index].points) {
      end += 1
    }
    const cluster = byPoints.slice(index, end + 1)
    ranked.push(...sortCluster(cluster, fixtures, results, players))
    index = end + 1
  }

  return ranked.map((row, position) => ({
    ...row,
    position: position + 1,
  }))
}

export function standingsForGroup(
  playerIds: number[],
  fixtures: TournamentFixture[],
  results: FixtureResult[],
  players: CompetitionPlayer[],
  qualifyPerGroup: number,
): StandingRow[] {
  const groupFixtures = fixtures.filter(
    (fixture) => fixture.stage === 'group' && playerIds.includes(fixture.homeId),
  )
  const accumulators = buildGroupTable(playerIds, groupFixtures, results)
  const preliminary = toStandingRows(
    accumulators,
    playerIds,
    qualifyPerGroup,
    false,
  )
  const ranked = rankGroup(preliminary, groupFixtures, results, players)
  const groupComplete = ranked.every((row) => row.played === (playerIds.length - 1) * 2)
  const withZones = ranked.map((row, index) => ({
    ...row,
    position: index + 1,
    qualifyingZone: index < qualifyPerGroup,
    eliminated: groupComplete && index >= qualifyPerGroup,
  }))
  return applyMathematicalElimination(withZones)
}
