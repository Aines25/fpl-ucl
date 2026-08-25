import { describe, expect, it } from 'vitest'
import {
  chipLabel,
  competitionChipAdjustment,
  elementTypeLabel,
  emptySquad,
  formationFromTypes,
  formatTeamValue,
  formatTransfers,
  hydrateSquad,
  squadMovesFromTransfers,
  summariseChips,
  freeTransfersRemaining,
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
    expect(elementTypeLabel(1)).toBe('GK')
    expect(elementTypeLabel(4)).toBe('FWD')
  })

  it('only strips bench boost and extra triple captain points', () => {
    const picks = [
      { element: 9, position: 9, multiplier: 3 },
      { element: 12, position: 12, multiplier: 1 },
    ]
    expect(competitionChipAdjustment('bboost', picks, live)).toBe(2)
    expect(competitionChipAdjustment('3xc', picks, live)).toBe(8)
    expect(competitionChipAdjustment('freehit', picks, live)).toBe(0)
    expect(competitionChipAdjustment(null, picks, live)).toBe(0)
  })

  it('uses live pick totals when official FPL points are still lagging', () => {
    const squad = hydrateSquad({
      managerId: 15,
      fplId: 24746,
      name: 'Danny Windsor',
      teamName: 'Xabi Wan Kenobi',
      gameweek: 1,
      catalogue,
      live: new Map<number, LivePlayerStats>([
        [1, { minutes: 90, points: 1 }],
        [2, { minutes: 90, points: 9 }],
        [3, { minutes: 90, points: 1 }],
        [4, { minutes: 90, points: 2 }],
        [5, { minutes: 90, points: 0 }],
        [6, { minutes: 90, points: 2 }],
        [7, { minutes: 90, points: 6 }],
        [8, { minutes: 90, points: 9 }],
        [9, { minutes: 90, points: 2 }],
        [10, { minutes: 90, points: 0 }],
        [11, { minutes: 90, points: 2 }],
        [12, { minutes: 90, points: 9 }],
      ]),
      useLivePoints: true,
      payload: {
        active_chip: 'bboost',
        entry_history: {
          points: 35,
          event_transfers: 0,
          event_transfers_cost: 0,
        },
        picks: [
          { element: 1, position: 1, multiplier: 1, is_captain: false, is_vice_captain: false },
          { element: 2, position: 2, multiplier: 1, is_captain: false, is_vice_captain: false },
          { element: 3, position: 3, multiplier: 1, is_captain: false, is_vice_captain: false },
          { element: 4, position: 4, multiplier: 1, is_captain: false, is_vice_captain: false },
          { element: 5, position: 5, multiplier: 1, is_captain: false, is_vice_captain: false },
          { element: 6, position: 6, multiplier: 2, is_captain: true, is_vice_captain: false },
          { element: 7, position: 7, multiplier: 1, is_captain: false, is_vice_captain: false },
          { element: 8, position: 8, multiplier: 1, is_captain: false, is_vice_captain: false },
          { element: 9, position: 9, multiplier: 1, is_captain: false, is_vice_captain: false },
          { element: 10, position: 10, multiplier: 1, is_captain: false, is_vice_captain: false },
          { element: 11, position: 11, multiplier: 1, is_captain: false, is_vice_captain: true },
          { element: 12, position: 12, multiplier: 1, is_captain: false, is_vice_captain: false },
        ],
      },
    })

    const pitchTotal = squad.starters.reduce((sum, slot) => sum + slot.points, 0)
    expect(pitchTotal).toBe(36)
    expect(squad.points).toBe(36)
    expect(squad.netPoints).toBe(36)
    expect(squad.officialPoints).toBe(35)
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
    expect(squad.points).toBe(64)
    expect(squad.netPoints).toBe(60)
    expect(squad.officialPoints).toBe(72)
    expect(squad.officialNetPoints).toBe(68)
    expect(squad.transfers).toBe(2)
    expect(squad.chipLabel).toBe('Triple Captain')
    expect(squad.starters).toHaveLength(11)
    expect(squad.bench).toHaveLength(1)

    const captain = squad.starters.find((slot) => slot.isCaptain)
    expect(captain?.webName).toBe('Haaland')
    expect(captain?.points).toBe(24)
    expect(captain?.counting).toBe(true)
    expect(captain?.teamId).toBe(4)
    expect(captain?.fixture).toBeNull()
    expect(captain?.breakdown).toEqual([
      { identifier: 'minutes', label: 'Minutes', count: 1, points: 2 },
      { identifier: 'other', label: 'Other', count: 1, points: 6 },
    ])

    expect(squad.bench[0]?.points).toBe(2)
    expect(squad.bench[0]?.counting).toBe(false)
  })

  it('drops bench boost points from the competition total but keeps bench scores on the pitch', () => {
    const squad = hydrateSquad({
      managerId: 16,
      fplId: 12878,
      name: 'Christian Smith-Rose',
      teamName: 'Test FC',
      gameweek: 1,
      catalogue,
      live,
      payload: {
        active_chip: 'bboost',
        entry_history: {
          points: 35,
          event_transfers: 0,
          event_transfers_cost: 0,
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
          { element: 9, position: 9, multiplier: 2, is_captain: true, is_vice_captain: false },
          { element: 10, position: 10, multiplier: 1, is_captain: false, is_vice_captain: false },
          { element: 11, position: 11, multiplier: 1, is_captain: false, is_vice_captain: false },
          { element: 12, position: 12, multiplier: 1, is_captain: false, is_vice_captain: false },
        ],
      },
    })

    expect(squad.chipLabel).toBe('Bench Boost')
    expect(squad.points).toBe(33)
    expect(squad.netPoints).toBe(33)
    expect(squad.officialPoints).toBe(35)
    expect(squad.officialNetPoints).toBe(35)
    expect(squad.bench[0]?.points).toBe(2)
    expect(squad.bench[0]?.counting).toBe(true)
  })

  it('attaches the club fixture to each pick', () => {
    const squad = hydrateSquad({
      managerId: 16,
      fplId: 12878,
      name: 'Christian Smith-Rose',
      teamName: 'Test FC',
      gameweek: 1,
      catalogue,
      live,
      fixtures: new Map([
        [4, { opponent: 'ARS', kickoff: '2026-08-23T15:00:00Z', started: false, finished: false }],
      ]),
      payload: {
        entry_history: { points: 8, event_transfers: 0, event_transfers_cost: 0 },
        picks: [
          { element: 9, position: 1, multiplier: 2, is_captain: true, is_vice_captain: false },
        ],
      },
    })

    expect(squad.starters[0]?.fixture?.opponent).toBe('ARS')
    expect(squad.starters[0]?.fixture?.started).toBe(false)
  })

  it('starts with no transfer moves', () => {
    expect(emptySquad(16, 12878, 'Christian Smith-Rose', 1).moves).toEqual([])
  })

  it('maps this gameweek transfers onto catalogue names', () => {
    expect(squadMovesFromTransfers([
      { element_in: 9, element_out: 10, element_in_cost: 145, element_out_cost: 90, event: 2 },
      { element_in: 5, element_out: 8, element_in_cost: 100, element_out_cost: 70, event: 1 },
    ], 2, catalogue)).toEqual([
      {
        inId: 9,
        outId: 10,
        inName: 'Haaland',
        outName: 'Watkins',
        inCost: 145,
        outCost: 90,
      },
    ])
  })

  it('summarises chips used and remaining in the current half', () => {
    expect(summariseChips([
      { name: 'bboost', event: 1 },
      { name: 'wildcard', event: 6 },
    ], 8)).toEqual({
      chipsUsed: [
        { name: 'bboost', label: 'Bench Boost', event: 1 },
        { name: 'wildcard', label: 'Wildcard', event: 6 },
      ],
      chipsRemaining: [
        { name: 'freehit', label: 'Free Hit', half: 'first' },
        { name: '3xc', label: 'Triple Captain', half: 'first' },
      ],
    })
  })

  it('refreshes remaining chips after the half-season reset', () => {
    const summary = summariseChips([
      { name: 'bboost', event: 1 },
      { name: 'wildcard', event: 6 },
      { name: '3xc', event: 22 },
    ], 24)

    expect(summary.chipsUsed.map((chip) => chip.name)).toEqual(['bboost', 'wildcard', '3xc'])
    expect(summary.chipsRemaining.map((chip) => chip.name)).toEqual(['wildcard', 'freehit', 'bboost'])
  })

  it('falls back to Unknown when a transferred player is missing', () => {
    expect(squadMovesFromTransfers([
      { element_in: 99, element_out: 10, event: 1 },
    ], 1, catalogue)).toEqual([
      {
        inId: 99,
        outId: 10,
        inName: 'Unknown',
        outName: 'Watkins',
        inCost: 0,
        outCost: 0,
      },
    ])
  })
})

describe('freeTransfersRemaining', () => {
  it('starts the season with one free transfer', () => {
    expect(freeTransfersRemaining([], [], 1, { transfers: 0 })).toBe(1)
  })

  it('banks unused transfers up to five', () => {
    expect(freeTransfersRemaining([
      { event: 1, event_transfers: 0 },
      { event: 2, event_transfers: 0 },
      { event: 3, event_transfers: 0 },
    ], [], 3)).toBe(3)
  })

  it('does not consume free transfers on a wildcard', () => {
    expect(freeTransfersRemaining([
      { event: 1, event_transfers: 0 },
      { event: 2, event_transfers: 8 },
    ], [{ name: 'wildcard', event: 2 }], 2)).toBe(2)
  })

  it('resets the bank after taking hits', () => {
    expect(freeTransfersRemaining([
      { event: 1, event_transfers: 3 },
    ], [], 1, { transfers: 3 })).toBe(0)
    expect(freeTransfersRemaining([
      { event: 1, event_transfers: 3 },
      { event: 2, event_transfers: 0 },
    ], [], 2)).toBe(1)
  })
})
