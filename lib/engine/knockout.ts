import type {
  FixtureResult,
  FixtureStatus,
  KnockoutTieConfig,
  KnockoutTieResult,
  TournamentFixture,
} from '../types/competition'
import { eventStatus } from './results'

export interface KnockoutGoals {
  playerId: number
  goalsScored: number
  goalsConceded: number
}

function scoreForPlayer(fixture: TournamentFixture, result: FixtureResult, playerId: number) {
  if (result.homeScore === null || result.awayScore === null) return null
  if (fixture.homeId === playerId) return result.homeScore
  if (fixture.awayId === playerId) return result.awayScore
  return null
}

function hashCoinToss(seed: string, leftId: number, rightId: number) {
  let hash = 2166136261
  const value = `${seed}:${leftId}:${rightId}`
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0) % 2 === 0 ? leftId : rightId
}

function combineStatus(statuses: FixtureStatus[]): FixtureStatus {
  if (statuses.includes('scheduled')) return 'scheduled'
  if (statuses.includes('live')) return 'live'
  if (statuses.includes('provisional')) return 'provisional'
  if (statuses.every((status) => status === 'final')) return 'final'
  return 'scheduled'
}

/**
 * Official FPL cup-style knockout tie-breaks, isolated from group ranking.
 * 1. Aggregate net FPL points
 * 2. Most goals scored across the tie (when provided)
 * 3. Fewest goals conceded across the tie (when provided)
 * 4. Highest single-leg score
 * 5. Deterministic coin toss (never Math.random)
 */
export function decideKnockoutWinner(
  tie: KnockoutTieConfig,
  oneScore: number,
  twoScore: number,
  options?: {
    goals?: KnockoutGoals[]
    legScores?: { playerOne: number[]; playerTwo: number[] }
  },
): { winnerId: number, decidedByTiebreak: boolean } {
  const one = tie.playerOneId
  const two = tie.playerTwoId
  if (one === null || two === null) {
    throw new Error(`Tie ${tie.id} is missing participants`)
  }

  if (oneScore > twoScore) return { winnerId: one, decidedByTiebreak: false }
  if (twoScore > oneScore) return { winnerId: two, decidedByTiebreak: false }

  const oneGoals = options?.goals?.find((entry) => entry.playerId === one)
  const twoGoals = options?.goals?.find((entry) => entry.playerId === two)
  if (oneGoals && twoGoals) {
    if (oneGoals.goalsScored !== twoGoals.goalsScored) {
      return {
        winnerId: oneGoals.goalsScored > twoGoals.goalsScored ? one : two,
        decidedByTiebreak: true,
      }
    }
    if (oneGoals.goalsConceded !== twoGoals.goalsConceded) {
      return {
        winnerId: oneGoals.goalsConceded < twoGoals.goalsConceded ? one : two,
        decidedByTiebreak: true,
      }
    }
  }

  const oneBest = Math.max(...(options?.legScores?.playerOne ?? [oneScore]))
  const twoBest = Math.max(...(options?.legScores?.playerTwo ?? [twoScore]))
  if (oneBest !== twoBest) {
    return { winnerId: oneBest > twoBest ? one : two, decidedByTiebreak: true }
  }

  return {
    winnerId: hashCoinToss(tie.id, one, two),
    decidedByTiebreak: true,
  }
}

export function resolveKnockoutTie(
  tie: KnockoutTieConfig,
  fixtures: TournamentFixture[],
  results: FixtureResult[],
  eventByGameweek: Map<number, { isCurrent: boolean, finished: boolean, dataChecked: boolean }>,
  goals?: KnockoutGoals[],
): KnockoutTieResult {
  const fixtureById = new Map(fixtures.map((fixture) => [fixture.id, fixture]))
  const resultById = new Map(results.map((result) => [result.fixtureId, result]))
  const legs = [tie.firstLegFixtureId, tie.secondLegFixtureId].filter(
    (id): id is string => Boolean(id),
  )

  let playerOneAggregate = 0
  let playerTwoAggregate = 0
  let scoredLegs = 0
  const statuses: FixtureStatus[] = []
  const playerOneLegs: number[] = []
  const playerTwoLegs: number[] = []

  for (const fixtureId of legs) {
    const fixture = fixtureById.get(fixtureId)
    const result = resultById.get(fixtureId)
    if (!fixture || !result) {
      statuses.push('scheduled')
      continue
    }
    const event = eventByGameweek.get(fixture.fplGameweek)
    statuses.push(result.status === 'scheduled' ? eventStatus(event as never) : result.status)

    if (tie.playerOneId === null || tie.playerTwoId === null) continue
    const one = scoreForPlayer(fixture, result, tie.playerOneId)
    const two = scoreForPlayer(fixture, result, tie.playerTwoId)
    if (one === null || two === null) continue
    playerOneAggregate += one
    playerTwoAggregate += two
    playerOneLegs.push(one)
    playerTwoLegs.push(two)
    scoredLegs += 1
  }

  const status = combineStatus(statuses)
  const requiredLegs = legs.length
  const completeEnough = scoredLegs === requiredLegs && status !== 'scheduled'

  if (tie.playerOneId === null || tie.playerTwoId === null || !completeEnough) {
    return {
      tieId: tie.id,
      playerOneId: tie.playerOneId,
      playerTwoId: tie.playerTwoId,
      playerOneAggregate: scoredLegs ? playerOneAggregate : null,
      playerTwoAggregate: scoredLegs ? playerTwoAggregate : null,
      winnerId: null,
      status,
      decidedByTiebreak: false,
    }
  }

  const decision = decideKnockoutWinner(tie, playerOneAggregate, playerTwoAggregate, {
    goals,
    legScores: { playerOne: playerOneLegs, playerTwo: playerTwoLegs },
  })

  return {
    tieId: tie.id,
    playerOneId: tie.playerOneId,
    playerTwoId: tie.playerTwoId,
    playerOneAggregate,
    playerTwoAggregate,
    winnerId: decision.winnerId,
    status,
    decidedByTiebreak: decision.decidedByTiebreak,
  }
}
