import { setApiCacheHeaders } from '../../../utils/fpl'
import { getLiveLeague } from '../../../utils/live-league'
import { getBootstrap, maxAgeForEvents } from '../../../utils/scores'

export default defineEventHandler(async (event) => {
  const table = await getLiveLeague()
  let maxAge = 30
  try {
    const bootstrap = await getBootstrap()
    const gameweek = bootstrap.current?.id ?? table.gameweek
    maxAge = Math.min(60, maxAgeForEvents(bootstrap.events, [gameweek]))
  }
  catch {
    maxAge = 30
  }
  setApiCacheHeaders(event, maxAge)
  return table
})
