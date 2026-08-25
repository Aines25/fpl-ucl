import { fixtures, groupIds, matchdays } from '~~/data'
import { getPlayer } from '~~/data/players'
import { matchdayShareCard } from '~~/lib/engine/share-cards'
import { getCompetitionSnapshot } from '../../../utils/snapshot'
import { matchdayNode, parseShareSize, renderSharePng } from '../../../utils/og'

export default defineEventHandler(async (event) => {
  const md = Number(getRouterParam(event, 'md'))
  const map = matchdays.find((entry) => entry.matchday === md)
  if (!map) {
    throw createError({ statusCode: 404, statusMessage: 'Matchday not found' })
  }
  const size = parseShareSize(getQuery(event).size)
  const snapshot = await getCompetitionSnapshot()
  const results = new Map(snapshot.results.map((result) => [result.fixtureId, result]))
  const visible = fixtures.filter((fixture) => fixture.matchday === md)
  const ordered = groupIds.flatMap((group) => visible.filter((fixture) => fixture.group === group))
    .concat(visible.filter((fixture) => !fixture.group))
  const card = matchdayShareCard({
    title: map.label,
    kicker: `Champions League · GW ${map.fplGameweek}`,
    fixtures: ordered,
    results,
    nameFor: (id) => getPlayer(id).name,
  })
  const png = await renderSharePng(matchdayNode(card, size), size)
  setHeader(event, 'content-type', 'image/png')
  setHeader(event, 'cache-control', 'public, s-maxage=60, stale-while-revalidate=300')
  return png
})
