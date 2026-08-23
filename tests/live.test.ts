import { describe, expect, it } from 'vitest'
import { indexTeamFinished } from '../lib/engine/club-fixtures'
import {
  applyAutoSubs,
  eventsFromLiveStats,
  gameweekBreakdownFromStats,
  FEED_PAGE_SIZE,
  formatFeedTime,
  liveGameweekPoints,
  liveStandingTotals,
  mergeFeedEvents,
  ownershipFromPicks,
  paginateFeed,
  rankLiveStandings,
  stampFeedEvents,
} from '../lib/engine/live'
import type { CataloguePlayer, ClubInfo, LivePlayerStats } from '../lib/types/squad'
import type { LeaguePick } from '../lib/types/league'

const catalogue = new Map<number, CataloguePlayer>([
  [1, { id: 1, webName: 'Raya', teamId: 1, teamCode: 3, elementType: 1, code: 1 }],
  [2, { id: 2, webName: 'Saliba', teamId: 1, teamCode: 3, elementType: 2, code: 2 }],
  [3, { id: 3, webName: 'Gabriel', teamId: 1, teamCode: 3, elementType: 2, code: 3 }],
  [4, { id: 4, webName: 'White', teamId: 1, teamCode: 3, elementType: 2, code: 4 }],
  [5, { id: 5, webName: 'Saka', teamId: 1, teamCode: 3, elementType: 3, code: 5 }],
  [6, { id: 6, webName: 'Odegaard', teamId: 1, teamCode: 3, elementType: 3, code: 6 }],
  [7, { id: 7, webName: 'Rice', teamId: 1, teamCode: 3, elementType: 3, code: 7 }],
  [8, { id: 8, webName: 'Martinelli', teamId: 1, teamCode: 3, elementType: 3, code: 8 }],
  [9, { id: 9, webName: 'Haaland', teamId: 4, teamCode: 43, elementType: 4, code: 9 }],
  [10, { id: 10, webName: 'Watkins', teamId: 2, teamCode: 7, elementType: 4, code: 10 }],
  [11, { id: 11, webName: 'Isak', teamId: 3, teamCode: 4, elementType: 4, code: 11 }],
  [12, { id: 12, webName: 'Areola', teamId: 5, teamCode: 21, elementType: 1, code: 12 }],
  [13, { id: 13, webName: 'Gvardiol', teamId: 4, teamCode: 43, elementType: 2, code: 13 }],
  [14, { id: 14, webName: 'Foden', teamId: 4, teamCode: 43, elementType: 3, code: 14 }],
  [15, { id: 15, webName: 'Palmer', teamId: 6, teamCode: 8, elementType: 3, code: 15 }],
])

const teams = new Map<number, ClubInfo>([
  [1, { id: 1, shortName: 'ARS', code: 3 }],
  [4, { id: 4, shortName: 'MCI', code: 43 }],
  [5, { id: 5, shortName: 'WHU', code: 21 }],
])

function pick(
  element: number,
  position: number,
  extras: Partial<LeaguePick> = {},
): LeaguePick {
  return {
    element,
    position,
    multiplier: position <= 11 ? 1 : 0,
    isCaptain: false,
    isViceCaptain: false,
    ...extras,
  }
}

function xi(): LeaguePick[] {
  return [
    pick(1, 1),
    pick(2, 2),
    pick(3, 3),
    pick(4, 4),
    pick(5, 5),
    pick(6, 6),
    pick(7, 7),
    pick(8, 8),
    pick(9, 9, { isCaptain: true, multiplier: 2 }),
    pick(10, 10, { isViceCaptain: true }),
    pick(11, 11),
    pick(12, 12),
    pick(13, 13),
    pick(14, 14),
    pick(15, 15),
  ]
}

function liveMap(entries: Array<[number, Partial<LivePlayerStats>]>) {
  return new Map<number, LivePlayerStats>(entries.map(([id, stats]) => [id, {
    minutes: 0,
    points: 0,
    ...stats,
  }]))
}

function playedXi(overrides: Array<[number, Partial<LivePlayerStats>]> = []) {
  const extras = new Map(overrides)
  return liveMap([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((id) => {
    const extra = extras.get(id) ?? {}
    return [id, { minutes: extra.minutes ?? 90, points: extra.points ?? 2, ...extra }]
  }).concat([...extras.entries()].filter(([id]) => id > 11)))
}

describe('auto-subs and live scoring', () => {
  it('brings on the first eligible bench player after a starter blanks', () => {
    const live = playedXi([
      [11, { minutes: 0, points: 0 }],
      [13, { minutes: 90, points: 6 }],
    ])
    const finished = new Map([[1, true], [2, true], [3, true], [4, true], [5, true], [6, true]])
    const counting = applyAutoSubs(xi(), null, live, finished, catalogue)
    expect(counting.some((row) => row.element === 11)).toBe(false)
    expect(counting.some((row) => row.element === 13)).toBe(true)
  })

  it('waits when the first bench player is still pending', () => {
    const live = playedXi([
      [11, { minutes: 0, points: 0 }],
      [13, { minutes: 90, points: 6 }],
    ])
    const finished = new Map([[1, true], [2, true], [3, true], [4, true], [5, false], [6, true]])
    const counting = applyAutoSubs(xi(), null, live, finished, catalogue)
    expect(counting.some((row) => row.element === 13)).toBe(false)
    expect(counting.some((row) => row.element === 11)).toBe(true)
  })

  it('skips a blanked bench player and uses the next legal one', () => {
    const live = playedXi([
      [11, { minutes: 0, points: 0 }],
      [14, { minutes: 90, points: 5 }],
    ])
    const finished = new Map([[1, true], [2, true], [3, true], [4, true], [5, true], [6, true]])
    const counting = applyAutoSubs(xi(), null, live, finished, catalogue)
    expect(counting.some((row) => row.element === 12)).toBe(false)
    expect(counting.some((row) => row.element === 13)).toBe(false)
    expect(counting.some((row) => row.element === 14)).toBe(true)
    expect(counting.some((row) => row.element === 11)).toBe(false)
  })

  it('does not use a bench keeper for an outfielder', () => {
    const live = playedXi([
      [11, { minutes: 0, points: 0 }],
      [12, { minutes: 90, points: 2 }],
    ])
    const finished = new Map([[1, true], [2, true], [3, true], [4, true], [5, true], [6, true]])
    const counting = applyAutoSubs(xi(), null, live, finished, catalogue)
    expect(counting.some((row) => row.element === 12)).toBe(false)
    expect(counting.some((row) => row.element === 11)).toBe(true)
  })

  it('keeps every player on a bench boost', () => {
    const live = liveMap([[12, { minutes: 90, points: 2 }]])
    const finished = new Map([[1, true]])
    const counting = applyAutoSubs(xi(), 'bboost', live, finished, catalogue)
    expect(counting).toHaveLength(15)
  })

  it('moves the captain multiplier to the vice when the captain blanks', () => {
    const live = liveMap([
      [10, { minutes: 90, points: 6 }],
      [1, { minutes: 90, points: 2 }],
      [2, { minutes: 90, points: 2 }],
      [3, { minutes: 90, points: 2 }],
      [4, { minutes: 90, points: 2 }],
      [5, { minutes: 90, points: 2 }],
      [6, { minutes: 90, points: 2 }],
      [7, { minutes: 90, points: 2 }],
      [8, { minutes: 90, points: 2 }],
      [11, { minutes: 90, points: 2 }],
    ])
    const finished = new Map([[1, true], [2, true], [3, true], [4, true], [5, true], [6, true]])
    const scored = liveGameweekPoints(xi(), null, 4, live, finished, catalogue)
    expect(scored.counting.find((row) => row.element === 10)?.multiplier).toBe(2)
    expect(scored.counting.find((row) => row.element === 9)?.multiplier).toBe(1)
    expect(scored.points).toBe(30)
    expect(scored.netPoints).toBe(26)
  })

  it('gives the vice a triple-captain multiplier', () => {
    const live = liveMap([
      [10, { minutes: 90, points: 6 }],
      [1, { minutes: 90, points: 2 }],
      [2, { minutes: 90, points: 2 }],
      [3, { minutes: 90, points: 2 }],
      [4, { minutes: 90, points: 2 }],
      [5, { minutes: 90, points: 2 }],
      [6, { minutes: 90, points: 2 }],
      [7, { minutes: 90, points: 2 }],
      [8, { minutes: 90, points: 2 }],
      [11, { minutes: 90, points: 2 }],
    ])
    const finished = new Map([[1, true], [2, true], [3, true], [4, true], [5, true], [6, true]])
    const scored = liveGameweekPoints(xi(), '3xc', 0, live, finished, catalogue)
    expect(scored.counting.find((row) => row.element === 10)?.multiplier).toBe(3)
    expect(scored.points).toBe(36)
  })

  it('rebuilds live totals from the last confirmed league score', () => {
    expect(liveStandingTotals({
      rank: 2,
      lastRank: 3,
      entryId: 1,
      playerName: 'Ada',
      entryName: 'XI',
      eventTotal: 61,
      total: 412,
      competitionPlayerId: 1,
      captain: 'Haaland',
      viceCaptain: 'Saka',
      transfers: 1,
      chip: null,
    }, 48)).toEqual({
      eventTotal: 48,
      total: 399,
    })
  })

  it('ranks by live total and keeps official order as the tie-break', () => {
    const ranked = rankLiveStandings([
      { rank: 2, lastRank: 2, entryId: 2, playerName: 'B', entryName: 'B', eventTotal: 10, total: 100, competitionPlayerId: null, captain: null, viceCaptain: null, transfers: 0, chip: null },
      { rank: 1, lastRank: 1, entryId: 1, playerName: 'A', entryName: 'A', eventTotal: 20, total: 110, competitionPlayerId: null, captain: null, viceCaptain: null, transfers: 0, chip: null },
    ])
    expect(ranked.map((row) => row.entryId)).toEqual([1, 2])
    expect(ranked[0].rank).toBe(1)
  })
})

describe('live feed', () => {
  it('emits one event per goal with a stable id', () => {
    const events = eventsFromLiveStats(liveMap([
      [9, { minutes: 90, points: 13, goalsScored: 2, assists: 1 }],
    ]), catalogue, teams)
    expect(events.map((event) => event.id)).toEqual([
      '9:goals_scored:1',
      '9:goals_scored:2',
      '9:assists:1',
    ])
    expect(events[0]).toMatchObject({
      webName: 'Haaland',
      teamShortName: 'MCI',
      label: 'Goal',
      points: 4,
      gameweekPoints: 13,
    })
    expect(events[2].points).toBe(3)
    expect(events[0].gameweekBreakdown).toEqual([
      { identifier: 'minutes', label: 'Minutes', count: 1, points: 2 },
      { identifier: 'goals_scored', label: 'Goal', count: 2, points: 8 },
      { identifier: 'assists', label: 'Assist', count: 1, points: 3 },
    ])
  })

  it('breaks gameweek points into minutes, actions and leftover', () => {
    expect(gameweekBreakdownFromStats({
      minutes: 90,
      points: 16,
      goalsScored: 2,
      assists: 1,
      bonus: 3,
    }, 4)).toEqual([
      { identifier: 'minutes', label: 'Minutes', count: 1, points: 2 },
      { identifier: 'goals_scored', label: 'Goal', count: 2, points: 8 },
      { identifier: 'assists', label: 'Assist', count: 1, points: 3 },
      { identifier: 'bonus', label: 'Bonus', count: 1, points: 3 },
    ])
    expect(gameweekBreakdownFromStats({
      minutes: 90,
      points: 4,
    }, 3)).toEqual([
      { identifier: 'minutes', label: 'Minutes', count: 1, points: 2 },
      { identifier: 'other', label: 'Other', count: 1, points: 2 },
    ])
  })

  it('keeps the earliest timestamp when the same event is seen again', () => {
    const current = eventsFromLiveStats(liveMap([
      [9, { goalsScored: 2 }],
      [5, { yellowCards: 1 }],
    ]), catalogue, teams)
    const first = stampFeedEvents(current, [], 1000)
    const next = stampFeedEvents([
      ...current,
      { id: '9:goals_scored:3', elementId: 9, webName: 'Haaland', teamShortName: 'MCI', identifier: 'goals_scored', label: 'Goal', points: 4, occurrence: 3 },
    ], first, 2000)
    expect(next.find((event) => event.id === '9:goals_scored:1')?.at).toBe(1000)
    expect(next.find((event) => event.id === '9:goals_scored:3')?.at).toBe(2000)
  })

  it('drops events that FPL later retracts', () => {
    const previous = stampFeedEvents(eventsFromLiveStats(liveMap([
      [9, { bonus: 3 }],
    ]), catalogue, teams), [], 1000)
    const current = eventsFromLiveStats(liveMap([
      [9, { bonus: 0 }],
    ]), catalogue, teams)
    expect(stampFeedEvents(current, previous, 2000)).toEqual([])
  })

  it('updates bonus points without changing the first-seen time', () => {
    const merged = mergeFeedEvents(
      [{ id: '9:bonus:1', at: 1000, elementId: 9, webName: 'Haaland', teamShortName: 'MCI', identifier: 'bonus', label: 'Bonus', points: 2, occurrence: 1, gameweekPoints: 11 }],
      [{ id: '9:bonus:1', at: 2000, elementId: 9, webName: 'Haaland', teamShortName: 'MCI', identifier: 'bonus', label: 'Bonus', points: 3, occurrence: 1, gameweekPoints: 12 }],
    )
    expect(merged).toEqual([{
      id: '9:bonus:1',
      at: 1000,
      elementId: 9,
      webName: 'Haaland',
      teamShortName: 'MCI',
      identifier: 'bonus',
      label: 'Bonus',
      points: 3,
      occurrence: 1,
      gameweekPoints: 12,
    }])
  })

  it('formats feed times in London', () => {
    expect(formatFeedTime(Date.parse('2026-08-23T13:32:00Z'))).toBe('Sun 14:32 23 Aug')
  })

  it('marks events from completed fixtures as finished', () => {
    const events = eventsFromLiveStats(liveMap([
      [9, { goalsScored: 1 }],
      [5, { yellowCards: 1 }],
    ]), catalogue, teams, new Map([[4, true], [1, false]]))
    expect(events.find((event) => event.elementId === 9)?.matchFinished).toBe(true)
    expect(events.find((event) => event.elementId === 5)?.matchFinished).toBe(false)
  })

  it('shows live events first and keeps finished matches behind load more', () => {
    const events = [
      { id: 'live-1', at: 2000, elementId: 5, webName: 'Saka', teamShortName: 'ARS', identifier: 'assists', label: 'Assist', points: 3, occurrence: 1, matchFinished: false },
      { id: 'live-2', at: 1500, elementId: 5, webName: 'Saka', teamShortName: 'ARS', identifier: 'goals_scored', label: 'Goal', points: 5, occurrence: 1, matchFinished: false },
      { id: 'done-1', at: 9000, elementId: 9, webName: 'Haaland', teamShortName: 'MCI', identifier: 'goals_scored', label: 'Goal', points: 4, occurrence: 1, matchFinished: true },
    ]
    expect(FEED_PAGE_SIZE).toBe(5)
    expect(paginateFeed(events, FEED_PAGE_SIZE)).toMatchObject({
      visible: [{ id: 'live-1' }, { id: 'live-2' }],
      remaining: 1,
      liveCount: 2,
      hasFinishedBeyondLive: true,
    })
    expect(paginateFeed(events, Number.POSITIVE_INFINITY).visible.map((event) => event.id)).toEqual(['live-1', 'live-2', 'done-1'])
  })

  it('caps the first page at five live events', () => {
    const events = Array.from({ length: 7 }, (_, index) => ({
      id: `live-${index + 1}`,
      at: 2000 - index,
      elementId: 5,
      webName: 'Saka',
      teamShortName: 'ARS',
      identifier: 'assists',
      label: 'Assist',
      points: 3,
      occurrence: index + 1,
      matchFinished: false,
    }))
    const page = paginateFeed(events, FEED_PAGE_SIZE)
    expect(page.visible).toHaveLength(5)
    expect(page.remaining).toBe(2)
  })
})

describe('ownership', () => {
  it('lists every manager who owns a player, captains first', () => {
    const owners = ownershipFromPicks(
      [
        { entryId: 1, playerName: 'Ada', entryName: 'XI' },
        { entryId: 2, playerName: 'Ben', entryName: 'FC' },
      ],
      new Map([
        [1, { captain: 'Haaland', viceCaptain: 'Saka', transfers: 0, transferCost: 0, chip: null, picks: [pick(9, 9, { isCaptain: true, multiplier: 2 })] }],
        [2, { captain: 'Saka', viceCaptain: 'Haaland', transfers: 1, transferCost: 4, chip: null, picks: [pick(9, 13)] }],
      ]),
    )
    expect(owners[9]).toEqual([
      { entryId: 1, playerName: 'Ada', entryName: 'XI', isCaptain: true, isViceCaptain: false, onBench: false },
      { entryId: 2, playerName: 'Ben', entryName: 'FC', isCaptain: false, isViceCaptain: false, onBench: true },
    ])
  })
})

describe('team completion', () => {
  it('treats a provisional full-time as finished', () => {
    const finished = indexTeamFinished([
      { team_h: 4, team_a: 1, kickoff_time: '2026-08-23T13:00:00Z', started: true, finished: false, finished_provisional: true },
    ])
    expect(finished.get(4)).toBe(true)
    expect(finished.get(1)).toBe(true)
  })

  it('waits until every double-gameweek fixture is done', () => {
    const finished = indexTeamFinished([
      { team_h: 4, team_a: 1, kickoff_time: '2026-08-22T11:30:00Z', started: true, finished: true },
      { team_h: 3, team_a: 4, kickoff_time: '2026-08-23T13:00:00Z', started: true, finished: false },
    ])
    expect(finished.get(4)).toBe(false)
  })
})
