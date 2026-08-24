import { setApiCacheHeaders } from '../../../utils/fpl'
import { getLeagueOwnership } from '../../../utils/live-league'
import { getBootstrap, maxAgeForEvents } from '../../../utils/scores'

export default defineEventHandler(async (event) => {
  const gw = Number(getQuery(event).gw)
  if (!Number.isFinite(gw) || gw < 1) {
    throw createError({ statusCode: 400, statusMessage: 'gameweek is required' })
  }

  const ownership = await getLeagueOwnership(gw)
  let maxAge = 30
  try {
    const bootstrap = await getBootstrap()
    maxAge = Math.min(60, maxAgeForEvents(bootstrap.events, [gw]))
  }
  catch {
    maxAge = 30
  }
  setApiCacheHeaders(event, maxAge)
  return ownership
})
