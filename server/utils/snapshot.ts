import { committedFrozenGameweeks } from '~~/data/frozen-scores'
import { competition, fixtures, groupIds, groups, knockoutTies, matchdays, players } from '~~/data'
import { getPlayer } from '~~/data/players'
import { clampTtlToNextDeadline } from '~~/lib/engine/deadline'
import { goalsFromCountingPicks, resolveKnockoutTie, type KnockoutGoals } from '~~/lib/engine/knockout'
import { determineFixtureResult } from '~~/lib/engine/results'
import { standingsForGroup } from '~~/lib/engine/tiebreakers'
import { scenariosForGroup } from '~~/lib/engine/scenarios'
import type { FplEventState, GroupId, GroupScenarios, KnockoutTieConfig } from '~~/lib/types/competition'
import { isFresh, readSharedCache, writeSharedCache, type Timed } from './cache'
import { fplFetch, setApiCacheHeaders, type FplPicksResponse } from './fpl'
import { getBootstrap, getScoresForGameweeks, maxAgeForEvents } from './scores'
import { getLiveStats } from './squad'

async function knockoutGoalsForManager(managerId: number, gameweeks: number[]): Promise<KnockoutGoals | null> {
  const player = getPlayer(managerId)
  if (!player.fplId) return null
  const legs = await Promise.all(gameweeks.map(async (gameweek) => {
    const [payload, live] = await Promise.all([
      fplFetch<FplPicksResponse>(`/entry/${player.fplId}/event/${gameweek}/picks/`).catch(() => null),
      getLiveStats(gameweek),
    ])
    return goalsFromCountingPicks(payload?.picks ?? [], live)
  }))
  return legs.reduce(
    (total, leg) => ({
      playerId: managerId,
      goalsScored: total.goalsScored + leg.goalsScored,
      goalsConceded: total.goalsConceded + leg.goalsConceded,
    }),
    { playerId: managerId, goalsScored: 0, goalsConceded: 0 },
  )
}

async function knockoutGoalsForTie(tie: KnockoutTieConfig): Promise<KnockoutGoals[] | null> {
  if (tie.playerOneId == null || tie.playerTwoId == null) return null
  const gameweeks = [...new Set(
    [tie.firstLegFixtureId, tie.secondLegFixtureId]
      .filter((id): id is string => Boolean(id))
      .map((id) => fixtures.find((fixture) => fixture.id === id)?.fplGameweek)
      .filter((gameweek): gameweek is number => Number.isFinite(gameweek)),
  )]
  if (!gameweeks.length) return null
  const [one, two] = await Promise.all([
    knockoutGoalsForManager(tie.playerOneId, gameweeks),
    knockoutGoalsForManager(tie.playerTwoId, gameweeks),
  ])
  if (!one || !two) return null
  return [one, two]
}

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

  const knockout = await Promise.all(knockoutTies.map(async (tie) => {
    const preliminary = resolveKnockoutTie(tie, fixtures, results, eventMap)
    if (
      preliminary.winnerId == null
      || !preliminary.decidedByTiebreak
      || preliminary.playerOneAggregate == null
      || preliminary.playerTwoAggregate == null
      || preliminary.playerOneAggregate !== preliminary.playerTwoAggregate
    ) {
      return preliminary
    }
    const goals = await knockoutGoalsForTie(tie)
    if (!goals) return preliminary
    return resolveKnockoutTie(tie, fixtures, results, eventMap, goals)
  }))

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

const SNAPSHOT_KEY = 'competition:snapshot:v3'

let snapshotMemory: Timed<CompetitionSnapshot> | null = null
let snapshotInflight: Promise<CompetitionSnapshot> | null = null

function snapshotTtlSeconds(snapshot?: CompetitionSnapshot) {
  if (!snapshot) return 60
  const gameweeks = matchdays
    .map((entry) => entry.fplGameweek)
    .filter((gameweek) => gameweek <= snapshot.currentGameweek)
  const base = maxAgeForEvents(snapshot.events, gameweeks)
  return clampTtlToNextDeadline(snapshot.events, snapshot.currentGameweek, base)
}

export function snapshotCacheControl(event: Parameters<typeof setApiCacheHeaders>[0], snapshot: CompetitionSnapshot) {
  setApiCacheHeaders(event, snapshotTtlSeconds(snapshot))
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
        await writeSharedCache(SNAPSHOT_KEY, data, snapshotTtlSeconds(data))
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

  // Await the rebuild. Workers cancel floating refresh work after the response.
  return snapshotInflight
}
