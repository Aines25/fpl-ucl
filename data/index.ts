import { fixtures as groupFixtures } from './fixtures'
import { knockoutFixtures } from './knockout'

export { competition, groupIds } from './competition'
export { groups, getPlayer, playerById, players, playersInGroup } from './players'
export { groupMatchdays, matchdayByGameweek, matchdayByNumber, matchdays } from './matchdays'
export { matchday1Fixtures } from './matchday1'
export { knockoutFixtures, knockoutTies } from './knockout'
export { groupFixtures }

export const fixtures = [...groupFixtures, ...knockoutFixtures]
