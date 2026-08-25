import { groupIds, matchdays } from '~~/data'
import { getPlayer } from '~~/data/players'
import { groupsShareCard } from '~~/lib/engine/share-cards'
import { getCompetitionSnapshot } from '../../utils/snapshot'
import { groupsNode, parseShareSize, renderSharePng } from '../../utils/og'

export default defineEventHandler(async (event) => {
  const snapshot = await getCompetitionSnapshot()
  const md = Number(getQuery(event).md) || snapshot.currentMatchday
  const map = matchdays.find((entry) => entry.matchday === md)
  const size = parseShareSize(getQuery(event).size)
  const card = groupsShareCard({
    title: 'Group tables',
    kicker: map ? `${map.label} · GW ${map.fplGameweek}` : 'Champions League',
    groupIds,
    standings: snapshot.standings,
    nameFor: (id) => getPlayer(id).name,
  })
  const png = await renderSharePng(groupsNode(card, size), size)
  setHeader(event, 'content-type', 'image/png')
  setHeader(event, 'cache-control', 'public, s-maxage=60, stale-while-revalidate=300')
  return png
})
