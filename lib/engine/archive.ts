import type { CompetitionPlayer, FplGameweekScore } from '../types/competition'

export function archiveIsComplete(
  roster: CompetitionPlayer[],
  scores: FplGameweekScore[],
) {
  const byManager = new Map(scores.map((score) => [score.managerId, score]))
  return roster
    .filter((player) => player.fplId > 0)
    .every((player) => byManager.get(player.id)?.available)
}

export function alignArchivedScores(
  roster: CompetitionPlayer[],
  scores: FplGameweekScore[],
  gameweek: number,
): FplGameweekScore[] {
  const byManager = new Map(scores.map((score) => [score.managerId, score]))
  return roster.map((player) => {
    const existing = byManager.get(player.id)
    if (existing) {
      return {
        ...existing,
        managerId: player.id,
        fplId: player.fplId,
        gameweek,
        frozen: true,
      }
    }
    return {
      managerId: player.id,
      fplId: player.fplId,
      gameweek,
      points: 0,
      transferCost: 0,
      netPoints: 0,
      available: false,
      frozen: true,
    }
  })
}
