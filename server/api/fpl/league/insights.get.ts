import { buildLeagueInsights } from '~~/lib/engine/insights'
import { setApiCacheHeaders } from '../../../utils/fpl'
import { getLeagueOwnership } from '../../../utils/live-league'
import { getBootstrap, maxAgeForEvents } from '../../../utils/scores'
import { getPlayerCatalogue } from '../../../utils/squad'

export default defineEventHandler(async (event) => {
  const gw = Number(getQuery(event).gw)
  if (!Number.isFinite(gw) || gw < 1) {
    throw createError({ statusCode: 400, statusMessage: 'gameweek is required' })
  }

  const [ownership, catalogue, bootstrap] = await Promise.all([
    getLeagueOwnership(gw),
    getPlayerCatalogue(),
    getBootstrap(),
  ])

  const insights = buildLeagueInsights({
    gameweek: ownership.gameweek,
    managerCount: ownership.managerCount,
    picksComplete: ownership.picksComplete,
    ownersByPlayer: ownership.ownersByPlayer,
    catalogue,
  })

  setApiCacheHeaders(event, Math.min(60, maxAgeForEvents(bootstrap.events, [gw])))
  return insights
})
