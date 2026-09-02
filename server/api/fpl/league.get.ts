import { setApiCacheHeaders } from '../../utils/fpl'
import { getClassicLeague, leagueCaptainsComplete, officialLeagueTtlSeconds } from '../../utils/league'
import { getBootstrap } from '../../utils/scores'

export default defineEventHandler(async (event) => {
  const table = await getClassicLeague()
  let maxAge = officialLeagueTtlSeconds(undefined, leagueCaptainsComplete(table.standings))
  try {
    const bootstrap = await getBootstrap()
    maxAge = officialLeagueTtlSeconds(bootstrap.current, leagueCaptainsComplete(table.standings))
  }
  catch {
    maxAge = officialLeagueTtlSeconds(undefined, leagueCaptainsComplete(table.standings))
  }
  setApiCacheHeaders(event, maxAge)
  return table
})
