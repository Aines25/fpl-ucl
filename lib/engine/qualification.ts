import type { GroupId, KnockoutTieResult, StandingRow } from '../types/competition'
import { competition } from '../../data/competition'

export function qualifiedFromGroup(rows: StandingRow[]) {
  const count = competition.groupStage.qualifyPerGroup
  const complete = rows.every((row) => row.played === (rows.length - 1) * 2)
  if (!complete) return []
  return rows
    .slice()
    .sort((left, right) => left.position - right.position)
    .slice(0, count)
}

export interface QualifiedSide {
  group: GroupId
  winnerId: number
  runnerUpId: number
}

export function qualifiedSides(
  standingsByGroup: Record<GroupId, StandingRow[]>,
): QualifiedSide[] {
  return (Object.entries(standingsByGroup) as Array<[GroupId, StandingRow[]]>)
    .map(([group, rows]) => {
      const qualified = qualifiedFromGroup(rows)
      if (qualified.length < 2) return null
      return {
        group,
        winnerId: qualified[0].playerId,
        runnerUpId: qualified[1].playerId,
      }
    })
    .filter((entry): entry is QualifiedSide => entry !== null)
}

export function activeCompetitionIds(
  standingsByGroup: Record<GroupId, StandingRow[]>,
  knockout: KnockoutTieResult[] = [],
) {
  const alive = new Set<number>()
  for (const rows of Object.values(standingsByGroup)) {
    for (const row of rows) {
      if (!row.eliminated) alive.add(row.playerId)
    }
  }

  for (const tie of knockout) {
    if (tie.winnerId == null) continue
    for (const playerId of [tie.playerOneId, tie.playerTwoId]) {
      if (playerId && playerId !== tie.winnerId) alive.delete(playerId)
    }
  }

  return alive
}
