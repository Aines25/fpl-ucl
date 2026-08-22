import type {
  FixtureResult,
  StandingRow,
  TournamentFixture,
} from '../types/competition'
import { competition } from '../../data/competition'
import { resultCountsForStandings } from './results'

interface StandingAccumulator {
  playerId: number
  played: number
  won: number
  drawn: number
  lost: number
  pointsFor: number
  pointsAgainst: number
  points: number
}

function emptyRow(playerId: number): StandingAccumulator {
  return {
    playerId,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    points: 0,
  }
}

export function buildGroupTable(
  playerIds: number[],
  fixtures: TournamentFixture[],
  results: FixtureResult[],
): StandingAccumulator[] {
  const resultById = new Map(results.map((result) => [result.fixtureId, result]))
  const rows = new Map(playerIds.map((id) => [id, emptyRow(id)]))
  const { pointsForWin, pointsForDraw, pointsForLoss } = competition.groupStage

  for (const fixture of fixtures) {
    if (fixture.stage !== 'group') continue
    if (!rows.has(fixture.homeId) || !rows.has(fixture.awayId)) continue

    const result = resultById.get(fixture.id)
    if (!result || !resultCountsForStandings(result) || result.homeScore === null || result.awayScore === null) {
      continue
    }

    const home = rows.get(fixture.homeId)!
    const away = rows.get(fixture.awayId)!

    home.played += 1
    away.played += 1
    home.pointsFor += result.homeScore
    home.pointsAgainst += result.awayScore
    away.pointsFor += result.awayScore
    away.pointsAgainst += result.homeScore

    if (result.draw) {
      home.drawn += 1
      away.drawn += 1
      home.points += pointsForDraw
      away.points += pointsForDraw
    }
    else if (result.winnerId === fixture.homeId) {
      home.won += 1
      away.lost += 1
      home.points += pointsForWin
      away.points += pointsForLoss
    }
    else if (result.winnerId === fixture.awayId) {
      away.won += 1
      home.lost += 1
      away.points += pointsForWin
      home.points += pointsForLoss
    }
  }

  return [...rows.values()].map((row) => ({
    ...row,
    difference: row.pointsFor - row.pointsAgainst,
  }))
}

export function toStandingRows(
  accumulators: Array<StandingAccumulator & { difference?: number }>,
  orderedIds: number[],
  qualifyPerGroup: number,
  groupComplete: boolean,
): StandingRow[] {
  return orderedIds.map((playerId, index) => {
    const row = accumulators.find((entry) => entry.playerId === playerId)!
    const position = index + 1
    return {
      playerId,
      played: row.played,
      won: row.won,
      drawn: row.drawn,
      lost: row.lost,
      pointsFor: row.pointsFor,
      pointsAgainst: row.pointsAgainst,
      difference: row.pointsFor - row.pointsAgainst,
      points: row.points,
      position,
      qualifyingZone: position <= qualifyPerGroup,
      eliminated: groupComplete && position > qualifyPerGroup,
    }
  })
}

export function remainingGroupGames(played: number, teamsPerGroup = 4) {
  return Math.max(0, (teamsPerGroup - 1) * 2 - played)
}

export function applyMathematicalElimination(rows: StandingRow[]): StandingRow[] {
  const qualifyPerGroup = competition.groupStage.qualifyPerGroup
  return rows.map((row) => {
    const ceiling = row.points + remainingGroupGames(row.played) * competition.groupStage.pointsForWin
    const othersClearlyAhead = rows.filter(
      (other) => other.playerId !== row.playerId && other.points > ceiling,
    ).length
    return {
      ...row,
      eliminated: row.eliminated || othersClearlyAhead >= qualifyPerGroup,
    }
  })
}

export { type StandingAccumulator }
