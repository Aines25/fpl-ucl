import { describe, expect, it } from 'vitest'
import {
  chipLabel,
  formationFromTypes,
  formatTeamValue,
  formatTransfers,
  hydrateSquad,
} from '../lib/engine/squad'
import type { CataloguePlayer, LivePlayerStats } from '../lib/types/squad'

const catalogue = new Map<number, CataloguePlayer>([
  [1, { id: 1, webName: 'Raya', teamId: 1, teamCode: 3, elementType: 1, code: 101 }],
  [2, { id: 2, webName: 'Saliba', teamId: 1, teamCode: 3, elementType: 2, code: 102 }],
  [3, { id: 3, webName: 'Gabriel', teamId: 1, teamCode: 3, elementType: 2, code: 103 }],
  [4, { id: 4, webName: 'White', teamId: 1, teamCode: 3, elementType: 2, code: 104 }],
  [5, { id: 5, webName: 'Saka', teamId: 1, teamCode: 3, elementType: 3, code: 105 }],
  [6, { id: 6, webName: 'Odegaard', teamId: 1, teamCode: 3, elementType: 3, code: 106 }],
  [7, { id: 7, webName: 'Rice', teamId: 1, teamCode: 3, elementType: 3, code: 107 }],
  [8, { id: 8, webName: 'Martinelli', teamId: 1, teamCode: 3, elementType: 3, code: 108 }],
  [9, { id: 9, webName: 'Haaland', teamId: 4, teamCode: 43, elementType: 4, code: 109 }],
  [10, { id: 10, webName: 'Watkins', teamId: 2, teamCode: 7, elementType: 4, code: 110 }],
  [11, { id: 11, webName: 'Isak', teamId: 3, teamCode: 4, elementType: 4, code: 111 }],
  [12, { id: 12, webName: 'Areola', teamId: 5, teamCode: 21, elementType: 1, code: 112 }],
])

const live = new Map<number, LivePlayerStats>([
  [9, { minutes: 90, points: 8 }],
  [5, { minutes: 90, points: 6 }],
  [12, { minutes: 90, points: 2 }],
])

describe('squad helpers', () => {
  it('builds a 3-4-3 from starter types', () => {
    expect(formationFromTypes([1, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4])).toBe('3-4-3')
  })

  it('labels known chips', () => {
    expect(chipLabel('3xc')).toBe('Triple Captain')
    expect(chipLabel('bboost')).toBe('Bench Boost')
    expect(chipLabel(null)).toBeNull()
  })

  it('formats value and transfers', () => {
    expect(formatTeamValue(1005)).toBe('£100.5m')
    expect(formatTransfers(0, 0)).toBe('0')
    expect(formatTransfers(2, 0)).toBe('2')
    expect(formatTransfers(2, 4)).toBe('2 (−4)')
  })

  it('hydrates picks with captain multiplier and bench points', () => {
    const squad = hydrateSquad({
      managerId: 16,
      fplId: 12878,
      name: 'Christian Smith-Rose',
      teamName: 'Test FC',
      gameweek: 1,
      catalogue,
      live,
      payload: {
        active_chip: '3xc',
        entry_history: {
          points: 72,
          event_transfers: 2,
          event_transfers_cost: 4,
          total_points: 72,
          rank: 800000,
          overall_rank: 123456,
          value: 1005,
          bank: 15,
        },
        picks: [
          { element: 1, position: 1, multiplier: 1, is_captain: false, is_vice_captain: false },
          { element: 2, position: 2, multiplier: 1, is_captain: false, is_vice_captain: false },
          { element: 3, position: 3, multiplier: 1, is_captain: false, is_vice_captain: false },
          { element: 4, position: 4, multiplier: 1, is_captain: false, is_vice_captain: false },
          { element: 5, position: 5, multiplier: 1, is_captain: false, is_vice_captain: true },
          { element: 6, position: 6, multiplier: 1, is_captain: false, is_vice_captain: false },
          { element: 7, position: 7, multiplier: 1, is_captain: false, is_vice_captain: false },
          { element: 8, position: 8, multiplier: 1, is_captain: false, is_vice_captain: false },
          { element: 9, position: 9, multiplier: 3, is_captain: true, is_vice_captain: false },
          { element: 10, position: 10, multiplier: 1, is_captain: false, is_vice_captain: false },
          { element: 11, position: 11, multiplier: 1, is_captain: false, is_vice_captain: false },
          { element: 12, position: 12, multiplier: 0, is_captain: false, is_vice_captain: false },
        ],
      },
    })

    expect(squad.available).toBe(true)
    expect(squad.formation).toBe('3-4-3')
    expect(squad.netPoints).toBe(68)
    expect(squad.transfers).toBe(2)
    expect(squad.chipLabel).toBe('Triple Captain')
    expect(squad.starters).toHaveLength(11)
    expect(squad.bench).toHaveLength(1)

    const captain = squad.starters.find((slot) => slot.isCaptain)
    expect(captain?.webName).toBe('Haaland')
    expect(captain?.points).toBe(24)
    expect(captain?.counting).toBe(true)

    expect(squad.bench[0]?.points).toBe(2)
    expect(squad.bench[0]?.counting).toBe(false)
  })
})
