import { fixtures } from '~~/data'
import { getPlayer } from '~~/data/players'
import { matchShareCard } from '~~/lib/engine/share-cards'
import { getCompetitionSnapshot } from '../../../utils/snapshot'
import { matchNode, parseShareSize, renderSharePng } from '../../../utils/og'

const STATUS_LABEL = {
  scheduled: 'Scheduled',
  live: 'Live',
  provisional: 'Provisional',
  final: 'Confirmed',
} as const

export default defineEventHandler(async (event) => {
  const id = String(getRouterParam(event, 'id') ?? '')
  const fixture = fixtures.find((entry) => entry.id === id)
  if (!fixture) {
    throw createError({ statusCode: 404, statusMessage: 'Fixture not found' })
  }
  const size = parseShareSize(getQuery(event).size)
  const snapshot = await getCompetitionSnapshot()
  const result = snapshot.results.find((entry) => entry.fixtureId === fixture.id)
  const kicker = fixture.group
    ? `Group ${fixture.group} · GW ${fixture.fplGameweek}`
    : `${fixture.stage.replaceAll('-', ' ')} · GW ${fixture.fplGameweek}`
  const card = matchShareCard({
    homeName: getPlayer(fixture.homeId).name,
    awayName: getPlayer(fixture.awayId).name,
    homeScore: result?.homeScore ?? null,
    awayScore: result?.awayScore ?? null,
    status: STATUS_LABEL[result?.status ?? 'scheduled'],
    kicker,
  })
  const png = await renderSharePng(matchNode(card, size), size)
  setHeader(event, 'content-type', 'image/png')
  setHeader(event, 'cache-control', 'public, s-maxage=60, stale-while-revalidate=300')
  return png
})
