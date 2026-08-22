import type { FrozenScoresFile, FplGameweekScore } from '../lib/types/competition'
import archive from './frozen-scores.json'

export const frozenScoresFile = archive as FrozenScoresFile

export function frozenArchiveForGameweek(gameweek: number) {
  return frozenScoresFile[String(gameweek)] ?? null
}

export function committedScoresForGameweek(gameweek: number): FplGameweekScore[] | null {
  const archived = frozenArchiveForGameweek(gameweek)
  if (!archived?.scores.length) return null
  return archived.scores
}

export function committedFrozenGameweeks() {
  return Object.keys(frozenScoresFile)
    .map(Number)
    .filter((gameweek) => Number.isFinite(gameweek) && frozenScoresFile[String(gameweek)]?.scores.length)
    .sort((left, right) => left - right)
}
