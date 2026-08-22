import type { QualifiedSide } from './qualification'
import type { GroupId } from '../types/competition'

export interface DrawnTie {
  winnerId: number
  winnerGroup: GroupId
  runnerUpId: number
  runnerUpGroup: GroupId
}

function eligibleRunners(
  winner: QualifiedSide,
  remaining: QualifiedSide[],
  usedRunnerGroups: Set<GroupId>,
) {
  return remaining.filter(
    (side) => side.group !== winner.group && !usedRunnerGroups.has(side.group),
  )
}

/**
 * Constrained R16 draw: group winners vs runners-up, never the same original group.
 * Uses a provided RNG so runtime pages never call Math.random().
 * Backtracks to avoid an impossible last pairing.
 */
export function drawRoundOf16(
  sides: QualifiedSide[],
  random: () => number = Math.random,
): DrawnTie[] {
  const winners = [...sides]
  const runners = [...sides]

  function shuffle<T>(items: T[]) {
    const copy = [...items]
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1))
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
    }
    return copy
  }

  function search(
    remainingWinners: QualifiedSide[],
    remainingRunners: QualifiedSide[],
    usedRunnerGroups: Set<GroupId>,
  ): DrawnTie[] | null {
    if (remainingWinners.length === 0) return []

    const [winner, ...restWinners] = remainingWinners
    const options = shuffle(eligibleRunners(winner, remainingRunners, usedRunnerGroups))

    for (const runner of options) {
      const nextUsed = new Set(usedRunnerGroups)
      nextUsed.add(runner.group)
      const nextRunners = remainingRunners.filter((side) => side.group !== runner.group)
      const rest = search(restWinners, nextRunners, nextUsed)
      if (rest) {
        return [
          {
            winnerId: winner.winnerId,
            winnerGroup: winner.group,
            runnerUpId: runner.runnerUpId,
            runnerUpGroup: runner.group,
          },
          ...rest,
        ]
      }
    }

    return null
  }

  const result = search(shuffle(winners), runners, new Set())
  if (!result) {
    throw new Error('Unable to produce a valid Round of 16 draw')
  }
  return result
}

export function drawOpen(
  playerIds: number[],
  random: () => number = Math.random,
): Array<[number, number]> {
  const pool = [...playerIds]
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  if (pool.length % 2 !== 0) {
    throw new Error('Open draw requires an even number of participants')
  }
  const pairs: Array<[number, number]> = []
  for (let i = 0; i < pool.length; i += 2) {
    pairs.push([pool[i], pool[i + 1]])
  }
  return pairs
}
