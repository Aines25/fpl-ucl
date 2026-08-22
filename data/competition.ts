import type { GroupId } from '../lib/types/competition'

export const competition = {
  name: 'Champions League',
  season: '2026/27',
  host: 'christiancodes.co.uk',
  fplLeagueId: 15643,

  groupStage: {
    teamsPerGroup: 4,
    qualifyPerGroup: 2,
    pointsForWin: 3,
    pointsForDraw: 1,
    pointsForLoss: 0,
    matchdays: 6,
  },

  knockout: {
    roundOf16: {
      legs: 2,
      constraints: {
        winnersVsRunnersUp: true,
        noSameGroup: true,
      },
    },
    quarterFinal: {
      legs: 2,
      constraints: {
        winnersVsRunnersUp: false,
        noSameGroup: false,
      },
    },
    semiFinal: {
      legs: 2,
      constraints: {
        winnersVsRunnersUp: false,
        noSameGroup: false,
      },
    },
    final: {
      legs: 1,
    },
  },
} as const

export const groupIds: GroupId[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
