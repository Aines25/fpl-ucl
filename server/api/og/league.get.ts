import { leagueShareCard, leagueShareDimensions } from '~~/lib/engine/share-cards'
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
  const png = await renderSharePng(leagueNode(card), leagueShareDimensions(card.rows.length))
  setHeader(event, 'content-type', 'image/png')
  setHeader(event, 'cache-control', 'public, s-maxage=60, stale-while-revalidate=300')
  return png
})
