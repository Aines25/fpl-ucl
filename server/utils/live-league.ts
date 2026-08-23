import { indexTeamFinished } from '../../lib/engine/club-fixtures'
import {
  eventsFromLiveStats,
  liveGameweekPoints,
  liveStandingTotals,
  ownershipFromPicks,
  rankLiveStandings,
  stampFeedEvents,
} from '../../lib/engine/live'
import type { LiveFeedEvent, LiveLeagueTable } from '../../lib/types/league'
import { isFresh, readSharedCache, writeSharedCache, type Timed } from './cache'
import { getClassicLeague, getLeagueEntryPicks } from './league'
import { getBootstrap } from './scores'
import { getClubCatalogue, getGameweekFixtures, getLiveStats, getPlayerCatalogue } from './squad'

const LIVE_TTL_MS = 30_000
const FEED_PERSIST_SECONDS = 60 * 60 * 24 * 4

let liveMemory: Timed<LiveLeagueTable> | null = null
let liveInflight: Promise<LiveLeagueTable> | null = null
let feedMemory: { gameweek: number, events: LiveFeedEvent[] } | null = null

function feedKey(gameweek: number) {
  return `fpl:live-feed:${gameweek}`
}

async function loadFeed(gameweek: number) {
  if (feedMemory?.gameweek === gameweek) return feedMemory.events
  const shared = await readSharedCache<LiveFeedEvent[]>(feedKey(gameweek))
  feedMemory = { gameweek, events: shared?.data ?? [] }
  return feedMemory.events
}

async function persistFeed(gameweek: number, events: LiveFeedEvent[]) {
  feedMemory = { gameweek, events }
  await writeSharedCache(feedKey(gameweek), events, FEED_PERSIST_SECONDS)
}

async function buildLiveLeague(): Promise<LiveLeagueTable> {
  const [table, bootstrap] = await Promise.all([getClassicLeague(), getBootstrap()])
  const event = bootstrap.current
  const gameweek = event?.id ?? 1
  const [live, fixtures, catalogue, teams, picksByEntry] = await Promise.all([
    getLiveStats(gameweek),
    getGameweekFixtures(gameweek),
    getPlayerCatalogue(),
    getClubCatalogue(),
    getLeagueEntryPicks(table.standings, event),
  ])

  const finishedByTeam = indexTeamFinished(fixtures)
  const previousFeed = await loadFeed(gameweek)
  const feed = stampFeedEvents(
    eventsFromLiveStats(live, catalogue, teams, finishedByTeam),
    previousFeed,
    Date.now(),
  )
  if (feed.length !== previousFeed.length || feed.some((event, index) => event.id !== previousFeed[index]?.id || event.points !== previousFeed[index]?.points)) {
    await persistFeed(gameweek, feed)
  }

  const standings = rankLiveStandings(table.standings.map((row) => {
    const extras = picksByEntry.get(row.entryId)
    if (!extras?.picks.length) {
      return {
        ...row,
        lastRank: row.rank,
      }
    }
    const scored = liveGameweekPoints(
      extras.picks,
      extras.chip,
      extras.transferCost,
      live,
      finishedByTeam,
      catalogue,
    )
    const totals = liveStandingTotals(row, scored.netPoints)
    return {
      ...row,
      lastRank: row.rank,
      eventTotal: totals.eventTotal,
      total: totals.total,
    }
  }))

  return {
    leagueId: table.leagueId,
    name: table.name,
    gameweek,
    updatedAt: Date.now(),
    picksComplete: table.standings.every((row) => row.entryId <= 0 || Boolean(picksByEntry.get(row.entryId)?.picks.length)),
    standings,
    feed,
    ownersByPlayer: ownershipFromPicks(table.standings, picksByEntry),
  }
}

export async function getLiveLeague() {
  if (isFresh(liveMemory, LIVE_TTL_MS) && liveMemory) {
    return liveMemory.data
  }

  if (!liveInflight) {
    liveInflight = buildLiveLeague()
      .then((data) => {
        liveMemory = { at: Date.now(), data }
        return data
      })
      .catch((error) => {
        if (liveMemory) return liveMemory.data
        throw error
      })
      .finally(() => {
        liveInflight = null
      })
  }

  if (liveMemory) return liveMemory.data
  return liveInflight
}
