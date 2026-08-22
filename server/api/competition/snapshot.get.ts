import { competition, fixtures, groupIds, groups, knockoutTies, matchdays, players } from '~~/data'
import { determineFixtureResult } from '~~/lib/engine/results'
import { standingsForGroup } from '~~/lib/engine/tiebreakers'
import { resolveKnockoutTie } from '~~/lib/engine/knockout'
import type { FplEventState, GroupId } from '~~/lib/types/competition'

export default defineEventHandler(async () => {
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

  const eventByGameweek = new Map(
    events.map((event) => [event.id, event]),
  )

  const knockout = knockoutTies.map((tie) =>
    resolveKnockoutTie(tie, fixtures, results, eventByGameweek),
  )

  const currentMap = matchdays.find((entry) => entry.fplGameweek === currentGameweek) ?? matchdays[0]

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
    linkedManagers: players.filter((player) => player.fplId > 0).length,
    totalManagers: players.length,
  }
})
