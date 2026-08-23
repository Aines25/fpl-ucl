import { setApiCacheHeaders } from '../../utils/fpl'
import { getClassicLeague } from '../../utils/league'
import { getBootstrap, maxAgeForEvents } from '../../utils/scores'

export default defineEventHandler(async (event) => {
  const table = await getClassicLeague()
  let maxAge = 60
  try {
    const bootstrap = await getBootstrap()
    const gameweek = bootstrap.current?.id ?? 1
    maxAge = maxAgeForEvents(bootstrap.events, [gameweek])
  }
  catch {
    maxAge = 60
  }
  setApiCacheHeaders(event, maxAge)
  return table
})
