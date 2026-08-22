import type { TournamentFixture } from '../lib/types/competition'
import { groupIds } from './competition'
import { groups } from './players'

/**
 * Drawn Matchday 1 fixtures. Do not regenerate.
 * Replace pairings with the real draw; keep ids stable where possible.
 */
export const matchday1Fixtures: TournamentFixture[] = groupIds.flatMap((group) => {
  const [one, two, three, four] = groups[group]
  return [
    {
      id: `${group}-MD1-1`,
      stage: 'group',
      group,
      matchday: 1,
      fplGameweek: 1,
      homeId: one,
      awayId: two,
    },
    {
      id: `${group}-MD1-2`,
      stage: 'group',
      group,
      matchday: 1,
      fplGameweek: 1,
      homeId: three,
      awayId: four,
    },
  ]
})
