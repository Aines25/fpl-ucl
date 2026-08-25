import { leagueShareCard, leagueShareDimensions, leagueShareParts } from '~~/lib/engine/share-cards'
import { activeCompetitionIds } from '~~/lib/engine/qualification'
import { getClassicLeague } from '../../utils/league'
import { leagueNode, renderSharePng } from '../../utils/og'
import { getCompetitionSnapshot } from '../../utils/snapshot'

export default defineEventHandler(async (event) => {
  const [table, snapshot] = await Promise.all([getClassicLeague(), getCompetitionSnapshot()])
  const stillInUcl = activeCompetitionIds(snapshot.standings, snapshot.knockout ?? [])
  const card = leagueShareCard({
    title: table.name,
    kicker: `Champions League · GW ${snapshot.currentGameweek}`,
    standings: table.standings,
    stillInUcl,
  })
  const rawPart = getQuery(event).part
  let renderCard = card
  if (rawPart != null && rawPart !== '') {
    const part = Number(rawPart)
    const slice = Number.isInteger(part) ? leagueShareParts(card)[part - 1] : undefined
    if (!slice) {
      throw createError({ statusCode: 404, statusMessage: 'League image part not found' })
    }
    renderCard = slice
  }
  const png = await renderSharePng(leagueNode(renderCard), leagueShareDimensions(renderCard.rows.length))
  setHeader(event, 'content-type', 'image/png')
  setHeader(event, 'cache-control', 'public, s-maxage=60, stale-while-revalidate=300')
  return png
})
