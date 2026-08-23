import type { CataloguePlayer, ClubInfo, ElementType, LivePlayerStats } from '../types/squad'
import type { LeagueEntryPicks, LeaguePick, LeagueStandingRow, LiveFeedBreakdownLine, LiveFeedEvent, LiveOwner } from '../types/league'

export type PlayerMatchState = 'played' | 'out' | 'pending'

const GOAL_POINTS: Record<ElementType, number> = { 1: 6, 2: 6, 3: 5, 4: 4 }
const CLEAN_SHEET_POINTS: Record<ElementType, number> = { 1: 4, 2: 4, 3: 1, 4: 0 }

function asElementType(value: number | undefined): ElementType {
  if (value === 2 || value === 3 || value === 4) return value
  return 1
}

function minutesOf(live: Map<number, LivePlayerStats>, elementId: number) {
  return live.get(elementId)?.minutes ?? 0
}

function pointsOf(live: Map<number, LivePlayerStats>, elementId: number) {
  return live.get(elementId)?.points ?? 0
}

export function playerMatchState(
  elementId: number,
  live: Map<number, LivePlayerStats>,
  finishedByTeam: Map<number, boolean>,
  catalogue: Map<number, CataloguePlayer>,
): PlayerMatchState {
  if (minutesOf(live, elementId) > 0) return 'played'
  const teamId = catalogue.get(elementId)?.teamId
  if (!teamId || !finishedByTeam.has(teamId) || finishedByTeam.get(teamId)) return 'out'
  return 'pending'
}

function formationCounts(picks: LeaguePick[], catalogue: Map<number, CataloguePlayer>) {
  const counts = { gk: 0, def: 0, mid: 0, fwd: 0 }
  for (const pick of picks) {
    const type = asElementType(catalogue.get(pick.element)?.elementType)
    if (type === 1) counts.gk += 1
    else if (type === 2) counts.def += 1
    else if (type === 3) counts.mid += 1
    else counts.fwd += 1
  }
  return counts
}

export function formationIsLegal(picks: LeaguePick[], catalogue: Map<number, CataloguePlayer>) {
  const counts = formationCounts(picks, catalogue)
  return counts.gk === 1 && counts.def >= 3 && counts.mid >= 2 && counts.fwd >= 1
}

function canSubstitute(
  outgoing: LeaguePick,
  incoming: LeaguePick,
  xi: LeaguePick[],
  catalogue: Map<number, CataloguePlayer>,
) {
  const outType = asElementType(catalogue.get(outgoing.element)?.elementType)
  const inType = asElementType(catalogue.get(incoming.element)?.elementType)
  if (outType === 1) return inType === 1
  if (inType === 1) return false
  const next = xi.map((pick) => (pick.element === outgoing.element ? incoming : pick))
  return formationIsLegal(next, catalogue)
}

export function applyAutoSubs(
  picks: LeaguePick[],
  chip: string | null,
  live: Map<number, LivePlayerStats>,
  finishedByTeam: Map<number, boolean>,
  catalogue: Map<number, CataloguePlayer>,
): LeaguePick[] {
  const ordered = [...picks].sort((left, right) => left.position - right.position)
  if (chip === 'bboost') return ordered

  let xi = ordered.filter((pick) => pick.position <= 11)
  const bench = ordered.filter((pick) => pick.position > 11)
  const used = new Set<number>()

  for (const starter of [...xi]) {
    if (playerMatchState(starter.element, live, finishedByTeam, catalogue) !== 'out') continue

    for (const candidate of bench) {
      if (used.has(candidate.element)) continue
      const state = playerMatchState(candidate.element, live, finishedByTeam, catalogue)
      if (state === 'pending') break
      if (state === 'out') continue
      if (!canSubstitute(starter, candidate, xi, catalogue)) continue
      xi = xi.map((pick) => (pick.element === starter.element ? candidate : pick))
      used.add(candidate.element)
      break
    }
  }

  return xi
}

export function applyCaptainMultiplier(
  counting: LeaguePick[],
  picks: LeaguePick[],
  chip: string | null,
  live: Map<number, LivePlayerStats>,
  finishedByTeam: Map<number, boolean>,
  catalogue: Map<number, CataloguePlayer>,
): LeaguePick[] {
  const capMult = chip === '3xc' ? 3 : 2
  const captain = picks.find((pick) => pick.isCaptain)
  const vice = picks.find((pick) => pick.isViceCaptain)
  const countingIds = new Set(counting.map((pick) => pick.element))

  let captainElement: number | null = null
  if (captain && countingIds.has(captain.element) && playerMatchState(captain.element, live, finishedByTeam, catalogue) !== 'out') {
    captainElement = captain.element
  }
  else if (captain && playerMatchState(captain.element, live, finishedByTeam, catalogue) === 'out' && vice && countingIds.has(vice.element)) {
    captainElement = vice.element
  }

  return counting.map((pick) => ({
    ...pick,
    multiplier: pick.element === captainElement ? capMult : 1,
  }))
}

export function liveCountingPicks(
  picks: LeaguePick[],
  chip: string | null,
  live: Map<number, LivePlayerStats>,
  finishedByTeam: Map<number, boolean>,
  catalogue: Map<number, CataloguePlayer>,
) {
  const counting = applyAutoSubs(picks, chip, live, finishedByTeam, catalogue)
  return applyCaptainMultiplier(counting, picks, chip, live, finishedByTeam, catalogue)
}

export function liveGameweekPoints(
  picks: LeaguePick[],
  chip: string | null,
  transferCost: number,
  live: Map<number, LivePlayerStats>,
  finishedByTeam: Map<number, boolean>,
  catalogue: Map<number, CataloguePlayer>,
) {
  const counting = liveCountingPicks(picks, chip, live, finishedByTeam, catalogue)
  const points = counting.reduce((sum, pick) => sum + pointsOf(live, pick.element) * pick.multiplier, 0)
  return {
    points,
    netPoints: points - transferCost,
    counting,
  }
}

export function liveStandingTotals(row: LeagueStandingRow, liveEventTotal: number) {
  return {
    eventTotal: liveEventTotal,
    total: row.total - row.eventTotal + liveEventTotal,
  }
}

export function rankLiveStandings(rows: LeagueStandingRow[]) {
  const ordered = [...rows].sort((left, right) => {
    if (right.total !== left.total) return right.total - left.total
    if (right.eventTotal !== left.eventTotal) return right.eventTotal - left.eventTotal
    return (left.lastRank ?? left.rank) - (right.lastRank ?? right.rank)
  })
  return ordered.map((row, index) => ({
    ...row,
    rank: index + 1,
  }))
}

export function ownershipFromPicks(
  standings: Array<Pick<LeagueStandingRow, 'entryId' | 'playerName' | 'entryName'>>,
  picksByEntry: Map<number, LeagueEntryPicks>,
) {
  const owners = new Map<number, LiveOwner[]>()
  for (const row of standings) {
    const extras = picksByEntry.get(row.entryId)
    if (!extras) continue
    for (const pick of extras.picks) {
      const list = owners.get(pick.element) ?? []
      list.push({
        entryId: row.entryId,
        playerName: row.playerName,
        entryName: row.entryName,
        isCaptain: pick.isCaptain,
        isViceCaptain: pick.isViceCaptain,
        onBench: pick.position > 11 && extras.chip !== 'bboost',
      })
      owners.set(pick.element, list)
    }
  }

  const payload: Record<number, LiveOwner[]> = {}
  for (const [elementId, list] of owners) {
    payload[elementId] = list.sort((left, right) => {
      if (left.isCaptain !== right.isCaptain) return left.isCaptain ? -1 : 1
      if (left.onBench !== right.onBench) return left.onBench ? 1 : -1
      return left.playerName.localeCompare(right.playerName)
    })
  }
  return payload
}

function stat(live: LivePlayerStats | undefined, key: keyof LivePlayerStats) {
  return live?.[key] ?? 0
}

interface ScoringHit {
  identifier: string
  label: string
  points: number
  occurrence: number
}

function minutesPoints(minutes: number) {
  if (minutes <= 0) return 0
  return minutes >= 60 ? 2 : 1
}

function scoringHits(stats: LivePlayerStats, type: ElementType): ScoringHit[] {
  const hits: ScoringHit[] = []
  const push = (identifier: string, label: string, points: number, occurrence: number) => {
    if (!points) return
    hits.push({ identifier, label, points, occurrence })
  }

  const goals = stat(stats, 'goalsScored')
  for (let index = 1; index <= goals; index += 1) {
    push('goals_scored', 'Goal', GOAL_POINTS[type], index)
  }

  const assists = stat(stats, 'assists')
  for (let index = 1; index <= assists; index += 1) {
    push('assists', 'Assist', 3, index)
  }

  const cleanSheets = stat(stats, 'cleanSheets')
  if (cleanSheets > 0 && CLEAN_SHEET_POINTS[type]) {
    push('clean_sheets', 'Clean sheet', CLEAN_SHEET_POINTS[type], 1)
  }

  if (type === 1 || type === 2) {
    const concededChunks = Math.floor(stat(stats, 'goalsConceded') / 2)
    for (let index = 1; index <= concededChunks; index += 1) {
      push('goals_conceded', 'Goals conceded', -1, index)
    }
  }

  const ownGoals = stat(stats, 'ownGoals')
  for (let index = 1; index <= ownGoals; index += 1) {
    push('own_goals', 'Own goal', -2, index)
  }

  const pensSaved = stat(stats, 'penaltiesSaved')
  for (let index = 1; index <= pensSaved; index += 1) {
    push('penalties_saved', 'Penalty save', 5, index)
  }

  const pensMissed = stat(stats, 'penaltiesMissed')
  for (let index = 1; index <= pensMissed; index += 1) {
    push('penalties_missed', 'Penalty miss', -2, index)
  }

  const yellows = stat(stats, 'yellowCards')
  for (let index = 1; index <= yellows; index += 1) {
    push('yellow_cards', 'Yellow card', -1, index)
  }

  const reds = stat(stats, 'redCards')
  for (let index = 1; index <= reds; index += 1) {
    push('red_cards', 'Red card', -3, index)
  }

  const saveChunks = Math.floor(stat(stats, 'saves') / 3)
  for (let index = 1; index <= saveChunks; index += 1) {
    push('saves', 'Saves', 1, index)
  }

  const bonus = stat(stats, 'bonus')
  if (bonus > 0) push('bonus', 'Bonus', bonus, 1)

  return hits
}

function breakdownFromHits(
  hits: ScoringHit[],
  totalPoints: number,
  minutes: number,
): LiveFeedBreakdownLine[] {
  const lines: LiveFeedBreakdownLine[] = []
  const appearance = minutesPoints(minutes)
  if (appearance) {
    lines.push({ identifier: 'minutes', label: 'Minutes', count: 1, points: appearance })
  }

  const grouped = new Map<string, LiveFeedBreakdownLine>()
  for (const hit of hits) {
    const existing = grouped.get(hit.identifier)
    if (existing) {
      existing.count += 1
      existing.points += hit.points
    }
    else {
      grouped.set(hit.identifier, {
        identifier: hit.identifier,
        label: hit.label,
        count: 1,
        points: hit.points,
      })
    }
  }
  lines.push(...grouped.values())

  const leftover = totalPoints - lines.reduce((sum, line) => sum + line.points, 0)
  if (leftover) {
    lines.push({ identifier: 'other', label: 'Other', count: 1, points: leftover })
  }

  return lines
}

export function gameweekBreakdownFromStats(
  stats: LivePlayerStats,
  elementType?: number,
): LiveFeedBreakdownLine[] {
  const type = asElementType(elementType)
  return breakdownFromHits(scoringHits(stats, type), stats.points, stats.minutes)
}

export function eventsFromLiveStats(
  live: Map<number, LivePlayerStats>,
  catalogue: Map<number, CataloguePlayer>,
  teams: Map<number, ClubInfo>,
  finishedByTeam?: Map<number, boolean>,
): Array<Omit<LiveFeedEvent, 'at'>> {
  const events: Array<Omit<LiveFeedEvent, 'at'>> = []

  for (const [elementId, stats] of live) {
    const player = catalogue.get(elementId)
    const type = asElementType(player?.elementType)
    const webName = player?.webName ?? 'Unknown'
    const teamId = player?.teamId ?? 0
    const teamShortName = teams.get(teamId)?.shortName ?? ''
    const matchFinished = finishedByTeam
      ? !teamId || !finishedByTeam.has(teamId) || Boolean(finishedByTeam.get(teamId))
      : false
    const hits = scoringHits(stats, type)
    const gameweekBreakdown = breakdownFromHits(hits, stats.points, stats.minutes)

    for (const hit of hits) {
      events.push({
        id: `${elementId}:${hit.identifier}:${hit.occurrence}`,
        elementId,
        webName,
        teamShortName,
        identifier: hit.identifier,
        label: hit.label,
        points: hit.points,
        occurrence: hit.occurrence,
        gameweekPoints: stats.points,
        gameweekBreakdown,
        matchFinished,
      })
    }
  }

  return events
}

export function mergeFeedEvents(local: LiveFeedEvent[], incoming: LiveFeedEvent[]): LiveFeedEvent[] {
  const merged = new Map<string, LiveFeedEvent>()
  for (const event of [...local, ...incoming]) {
    const existing = merged.get(event.id)
    if (!existing) {
      merged.set(event.id, event)
      continue
    }
    merged.set(event.id, {
      ...event,
      at: Math.min(existing.at, event.at),
    })
  }
  return [...merged.values()].sort((left, right) => right.at - left.at || left.id.localeCompare(right.id))
}

export function stampFeedEvents(
  current: Array<Omit<LiveFeedEvent, 'at'>>,
  previous: LiveFeedEvent[],
  now: number,
): LiveFeedEvent[] {
  const prior = new Map(previous.map((event) => [event.id, event]))
  return current
    .map((event) => ({
      ...event,
      at: prior.get(event.id)?.at ?? now,
    }))
    .sort((left, right) => right.at - left.at || left.id.localeCompare(right.id))
}

export const FEED_PAGE_SIZE = 5

export function feedDisplayPool(events: LiveFeedEvent[]) {
  const live = events.filter((event) => !event.matchFinished)
  const finished = events.filter((event) => event.matchFinished)
  return {
    live,
    finished,
    pool: [...live, ...finished],
  }
}

export function paginateFeed(events: LiveFeedEvent[], limit: number) {
  const { live, finished, pool } = feedDisplayPool(events)
  const shownLive = live.slice(0, Math.min(limit, live.length))
  const finishedSlots = Math.max(0, limit - Math.max(live.length, FEED_PAGE_SIZE))
  const visible = [...shownLive, ...finished.slice(0, finishedSlots)]
  return {
    visible,
    remaining: Math.max(0, pool.length - visible.length),
    liveCount: live.length,
    hasFinishedBeyondLive: visible.length >= live.length && finished.length > 0 && finishedSlots === 0,
  }
}

export function formatFeedTime(at: number) {
  const date = new Date(at)
  if (Number.isNaN(date.getTime())) return ''
  const weekday = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    timeZone: 'Europe/London',
  }).format(date)
  const time = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Europe/London',
  }).format(date)
  const day = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Europe/London',
  }).format(date)
  return `${weekday} ${time} ${day}`
}
