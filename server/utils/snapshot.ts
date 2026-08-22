import { committedFrozenGameweeks } from '~~/data/frozen-scores'
import { competition, fixtures, groupIds, groups, knockoutTies, matchdays, players } from '~~/data'
import { determineFixtureResult } from '~~/lib/engine/results'
import { standingsForGroup } from '~~/lib/engine/tiebreakers'
import { resolveKnockoutTie } from '~~/lib/engine/knockout'
import { scenariosForGroup } from '~~/lib/engine/scenarios'
import type { FplEventState, GroupId, GroupScenarios } from '~~/lib/types/competition'
import { isFresh, readSharedCache, writeSharedCache, type Timed } from './cache'
import { getBootstrap, getScoresForGameweeks, maxAgeForEvents } from './scores'

export async function buildCompetitionSnapshot() {
  let events: FplEventState[] = []
  let current: FplEventState | undefined

  try {
    const bootstrap = await getBootstrap()
    events = bootstrap.events
    current = bootstrap.current
  }
  catch {
    events = []
  }

  const currentGameweek = current?.id ?? 1
  const neededGameweeks = matchdays
    .map((entry) => entry.fplGameweek)
    .filter((gameweek) => gameweek <= currentGameweek)

  let scores = []
  try {
    scores = await getScoresForGameweeks(neededGameweeks)
  }
  catch {
    scores = []
  }

  const scoreMap = new Map(scores.map((score) => [`${score.managerId}:${score.gameweek}`, score]))
  const eventMap = new Map(events.map((event) => [event.id, event]))

  const results = fixtures.map((fixture) =>
    determineFixtureResult(
      fixture,
      scoreMap.get(`${fixture.homeId}:${fixture.fplGameweek}`),
      scoreMap.get(`${fixture.awayId}:${fixture.fplGameweek}`),
      eventMap.get(fixture.fplGameweek),
    ),
  )

  const standings = Object.fromEntries(
    groupIds.map((group) => [
      group,
      standingsForGroup(
        groups[group],
        fixtures,
        results,
        players,
        competition.groupStage.qualifyPerGroup,
      ),
    ]),
  ) as Record<GroupId, ReturnType<typeof standingsForGroup>>

  const knockout = knockoutTies.map((tie) =>
    resolveKnockoutTie(tie, fixtures, results, eventMap),
  )

  const scenarios = Object.fromEntries(
    groupIds.map((group) => [
      group,
      scenariosForGroup(
        group,
        groups[group],
        fixtures,
        results,
        players,
        competition.groupStage.qualifyPerGroup,
      ),
    ]),
  ) as Record<GroupId, GroupScenarios>

  const currentMap = matchdays.find((entry) => entry.fplGameweek === currentGameweek) ?? matchdays[0]
  const liveFrozen = [...new Set(scores.filter((score) => score.frozen).map((score) => score.gameweek))]

  return {
    competition,
    currentMatchday: currentMap.matchday,
    currentGameweek,
    currentLabel: currentMap.label,
    events,
    scores,
    results,
    standings,
    knockout,
    scenarios,
    frozenGameweeks: [...new Set([...committedFrozenGameweeks(), ...liveFrozen])].sort((left, right) => left - right),
    linkedManagers: players.filter((player) => player.fplId > 0).length,
    totalManagers: players.length,
  }
}

export type CompetitionSnapshot = Awaited<ReturnType<typeof buildCompetitionSnapshot>>

const SNAPSHOT_KEY = 'competition:snapshot'

let snapshotMemory: Timed<CompetitionSnapshot> | null = null
let snapshotInflight: Promise<CompetitionSnapshot> | null = null

function snapshotTtlSeconds(snapshot?: CompetitionSnapshot) {
  if (!snapshot) return 60
  const gameweeks = matchdays
    .map((entry) => entry.fplGameweek)
    .filter((gameweek) => gameweek <= snapshot.currentGameweek)
  return maxAgeForEvents(snapshot.events, gameweeks)
}

export function snapshotCacheControl(snapshot: CompetitionSnapshot) {
  const maxAge = snapshotTtlSeconds(snapshot)
  return `public, s-maxage=${maxAge}, stale-while-revalidate=600`
}

export async function getCompetitionSnapshot() {
  if (!snapshotMemory) {
    const shared = await readSharedCache<CompetitionSnapshot>(SNAPSHOT_KEY)
    if (shared) snapshotMemory = shared
  }

  const cached = snapshotMemory
  const ttlMs = snapshotTtlSeconds(cached?.data) * 1000

  if (isFresh(cached, ttlMs) && cached) {
    return cached.data
  }

  if (!snapshotInflight) {
    snapshotInflight = buildCompetitionSnapshot()
      .then(async (data) => {
        snapshotMemory = { at: Date.now(), data }
        await writeSharedCache(SNAPSHOT_KEY, data, Math.max(snapshotTtlSeconds(data), 60 * 60))
        return data
      })
      .catch((error) => {
        if (cached) return cached.data
        throw error
      })
      .finally(() => {
        snapshotInflight = null
      })
  }

  if (cached) return cached.data
  return snapshotInflight
}
