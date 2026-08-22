import type { MatchdayMap } from '../lib/types/competition'

export const matchdays: MatchdayMap[] = [
  { matchday: 1, fplGameweek: 1, stage: 'group', label: 'Matchday 1' },
  { matchday: 2, fplGameweek: 2, stage: 'group', label: 'Matchday 2' },
  { matchday: 3, fplGameweek: 3, stage: 'group', label: 'Matchday 3' },
  { matchday: 4, fplGameweek: 4, stage: 'group', label: 'Matchday 4' },
  { matchday: 5, fplGameweek: 5, stage: 'group', label: 'Matchday 5' },
  { matchday: 6, fplGameweek: 6, stage: 'group', label: 'Matchday 6' },
  { matchday: 7, fplGameweek: 7, stage: 'round-of-16', label: 'Round of 16 · Leg 1', leg: 1 },
  { matchday: 8, fplGameweek: 8, stage: 'round-of-16', label: 'Round of 16 · Leg 2', leg: 2 },
  { matchday: 9, fplGameweek: 9, stage: 'quarter-final', label: 'Quarter-final · Leg 1', leg: 1 },
  { matchday: 10, fplGameweek: 10, stage: 'quarter-final', label: 'Quarter-final · Leg 2', leg: 2 },
  { matchday: 11, fplGameweek: 11, stage: 'semi-final', label: 'Semi-final · Leg 1', leg: 1 },
  { matchday: 12, fplGameweek: 12, stage: 'semi-final', label: 'Semi-final · Leg 2', leg: 2 },
  { matchday: 13, fplGameweek: 13, stage: 'final', label: 'Final' },
]

export function matchdayByNumber(matchday: number) {
  return matchdays.find((entry) => entry.matchday === matchday)
}

export function matchdayByGameweek(gameweek: number) {
  return matchdays.find((entry) => entry.fplGameweek === gameweek)
}

export const groupMatchdays = matchdays.filter((entry) => entry.stage === 'group')
