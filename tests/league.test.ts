import { describe, expect, it } from 'vitest'
import { leagueShareCard, leagueShareDimensions, leagueShareImageParts, leagueShareParts } from '../lib/engine/share-cards'
import type { LeagueStandingRow } from '../lib/types/league'
import { captainsAreLocked, captainsFromPicks, decorateLeagueExtras, extrasFromPicks, normaliseLeagueStanding, withLeagueRowDefaults } from '../server/utils/league'

describe('normaliseLeagueStanding', () => {
  it('maps FPL standings and flags tournament managers', () => {
    const row = normaliseLeagueStanding({
      rank: 2,
      last_rank: 5,
      entry: 12878,
      player_name: 'Christian Smith-Rose',
      entry_name: 'UCL XI',
      event_total: 61,
      total: 412,
    }, new Map([[12878, 16]]))

    expect(row).toEqual({
      rank: 2,
      lastRank: 5,
      entryId: 12878,
      playerName: 'Christian Smith-Rose',
      entryName: 'UCL XI',
      eventTotal: 61,
      total: 412,
      competitionPlayerId: 16,
      captain: null,
      viceCaptain: null,
      transfers: null,
      transferCost: null,
      transfersIn: [],
      transfersOut: [],
      freeTransfers: null,
      chip: null,
      chipsUsed: [],
      chipsRemaining: [],
    })
  })
})

describe('extrasFromPicks', () => {
  it('attaches this gameweek transfer count', () => {
    expect(extrasFromPicks({
      entry_history: { event_transfers: 2, event_transfers_cost: 4 },
      picks: [
        { element: 1, position: 1, multiplier: 2, is_captain: true, is_vice_captain: false },
        { element: 2, position: 2, multiplier: 1, is_captain: false, is_vice_captain: true },
      ],
    }, new Map([[1, 'Haaland'], [2, 'Salah']]))).toEqual({
      captain: 'Haaland',
      viceCaptain: 'Salah',
      transfers: 2,
      transferCost: 4,
      chip: null,
      picks: [
        { element: 1, position: 1, multiplier: 2, isCaptain: true, isViceCaptain: false },
        { element: 2, position: 2, multiplier: 1, isCaptain: false, isViceCaptain: true },
      ],
      transfersIn: [],
      transfersOut: [],
      freeTransfers: null,
      chipsUsed: [],
      chipsRemaining: [],
    })
  })

  it('attaches the active chip when one is played', () => {
    expect(extrasFromPicks({
      active_chip: '3xc',
      entry_history: { event_transfers: 0 },
      picks: [],
    }, new Map())).toEqual({
      captain: null,
      viceCaptain: null,
      transfers: 0,
      transferCost: 0,
      chip: '3xc',
      picks: [],
      transfersIn: [],
      transfersOut: [],
      freeTransfers: null,
      chipsUsed: [],
      chipsRemaining: [],
    })
  })
})

describe('captainsFromPicks', () => {
  it('resolves captain and vice names from the catalogue', () => {
    expect(captainsFromPicks([
      { element: 1, position: 1, multiplier: 2, is_captain: true, is_vice_captain: false },
      { element: 2, position: 2, multiplier: 1, is_captain: false, is_vice_captain: true },
    ], new Map([[1, 'Haaland'], [2, 'Salah']]))).toEqual({
      captain: 'Haaland',
      viceCaptain: 'Salah',
    })
  })

  it('returns nulls when picks are missing', () => {
    expect(captainsFromPicks(undefined, new Map())).toEqual({
      captain: null,
      viceCaptain: null,
    })
  })
})

describe('captainsAreLocked', () => {
  it('treats a current or finished event as locked', () => {
    expect(captainsAreLocked({
      id: 3,
      name: 'Gameweek 3',
      isCurrent: true,
      isNext: false,
      finished: false,
      dataChecked: false,
      deadlineTime: '2099-01-01T11:00:00Z',
    })).toBe(true)
  })

  it('waits until the deadline for the next event', () => {
    expect(captainsAreLocked({
      id: 4,
      name: 'Gameweek 4',
      isCurrent: false,
      isNext: true,
      finished: false,
      dataChecked: false,
      deadlineTime: '2099-01-01T11:00:00Z',
    }, Date.parse('2098-12-31T11:00:00Z'))).toBe(false)

    expect(captainsAreLocked({
      id: 4,
      name: 'Gameweek 4',
      isCurrent: false,
      isNext: true,
      finished: false,
      dataChecked: false,
      deadlineTime: '2099-01-01T11:00:00Z',
    }, Date.parse('2099-01-01T11:00:00Z'))).toBe(true)
  })
})

describe('decorateLeagueExtras', () => {
  it('attaches this gameweek moves, free transfers and remaining chips', () => {
    const extras = extrasFromPicks({
      entry_history: { event_transfers: 1, event_transfers_cost: 0 },
      picks: [],
    }, new Map())
    const catalogue = new Map([
      [1, { id: 1, webName: 'Haaland', teamId: 1, teamCode: 1, elementType: 4 as const, code: 1 }],
      [2, { id: 2, webName: 'Watkins', teamId: 2, teamCode: 2, elementType: 4 as const, code: 2 }],
    ])

    expect(decorateLeagueExtras(extras, 2, [
      { element_in: 1, element_out: 2, event: 2 },
    ], {
      chips: [{ name: 'bboost', event: 1 }],
      current: [
        { event: 1, event_transfers: 0 },
        { event: 2, event_transfers: 1 },
      ],
    }, catalogue)).toMatchObject({
      transfersIn: ['Haaland'],
      transfersOut: ['Watkins'],
      freeTransfers: 1,
      chipsRemaining: [
        { name: 'wildcard' },
        { name: 'freehit' },
        { name: '3xc' },
      ],
    })
  })
})

describe('withLeagueRowDefaults', () => {
  it('fills transfer fields missing from a pre-deploy cache row', () => {
    const row = {
      rank: 1,
      lastRank: null,
      entryId: 1,
      playerName: 'Jack Wellon',
      entryName: 'Wellon Truly Screwed',
      eventTotal: 82,
      total: 82,
      competitionPlayerId: 14,
      captain: 'B.Fernandes',
      viceCaptain: 'Mbeumo',
      transfers: 0,
      chip: 'bboost',
    } as LeagueStandingRow

    expect(withLeagueRowDefaults(row)).toMatchObject({
      transferCost: null,
      transfersIn: [],
      transfersOut: [],
      freeTransfers: null,
      chipsUsed: [],
      chipsRemaining: [],
    })
  })
})

describe('leagueShareCard', () => {
  it('renders dashes when standings omit transfer arrays', () => {
    const row = {
      rank: 1,
      lastRank: null,
      entryId: 1,
      playerName: 'Jack Wellon',
      entryName: 'Wellon Truly Screwed',
      eventTotal: 82,
      total: 82,
      competitionPlayerId: 14,
      captain: 'B.Fernandes',
      viceCaptain: 'Mbeumo',
      transfers: 0,
      chip: 'bboost',
    } as LeagueStandingRow

    const card = leagueShareCard({
      title: 'Champion Sam Woodcock 25/26 ⚽️',
      kicker: 'Champions League · GW 1',
      standings: [row],
      stillInUcl: new Set([14]),
    })

    expect(card.rows[0]).toMatchObject({
      captain: 'B.Fernandes',
      transfersIn: '–',
      transfersOut: '–',
      freeTransfers: '–',
      transferCost: '–',
      eventTotal: '82',
      total: '82',
      inUcl: true,
    })
  })
})

describe('leagueShareParts', () => {
  function standing(rank: number): LeagueStandingRow {
    return {
      rank,
      lastRank: null,
      entryId: rank,
      playerName: `Manager ${rank}`,
      entryName: `Team ${rank}`,
      eventTotal: 50,
      total: 50,
      competitionPlayerId: null,
      captain: null,
      viceCaptain: null,
      transfers: 0,
      transferCost: 0,
      transfersIn: [],
      transfersOut: [],
      freeTransfers: 1,
      chip: null,
      chipsUsed: [],
      chipsRemaining: [],
    }
  }

  it('splits a full mini-league into three labelled cards', () => {
    const card = leagueShareCard({
      title: 'Classic league',
      kicker: 'Champions League · GW 1',
      standings: Array.from({ length: 61 }, (_, index) => standing(index + 1)),
      stillInUcl: new Set(),
    })
    const parts = leagueShareParts(card)

    expect(parts.map((part) => part.rows.length)).toEqual([21, 21, 19])
    expect(parts[0]?.kicker).toBe('Champions League · GW 1 · 1/3')
    expect(parts[2]?.kicker).toBe('Champions League · GW 1 · 3/3')
    expect(parts[0]?.rows[0]?.rank).toBe(1)
    expect(parts[2]?.rows.at(-1)?.rank).toBe(61)
    expect(leagueShareDimensions(parts[0]!.rows.length).height).toBeLessThan(1200)
  })

  it('drops empty trailing parts for a short table', () => {
    const card = leagueShareCard({
      title: 'Classic league',
      kicker: 'Champions League · GW 1',
      standings: [standing(1)],
      stillInUcl: new Set(),
    })

    expect(leagueShareParts(card)).toHaveLength(1)
    expect(leagueShareImageParts()).toEqual([
      { href: '/api/og/league?part=1', filename: 'league-1.png' },
      { href: '/api/og/league?part=2', filename: 'league-2.png' },
      { href: '/api/og/league?part=3', filename: 'league-3.png' },
    ])
  })
})
