import { buildFdrGrid, emptyFdrGrid } from '../../../lib/engine/fdr'
import { setApiCacheHeaders } from '../../utils/fpl'
import { getBootstrap } from '../../utils/scores'
import { getAllFixtures, getClubCatalogue } from '../../utils/squad'

export default defineEventHandler(async (event) => {
  try {
    const [bootstrap, teams, fixtures] = await Promise.all([
      getBootstrap(),
      getClubCatalogue(),
      getAllFixtures(),
    ])
    const maxAge = bootstrap.current?.dataChecked ? 60 * 60 * 12 : 60 * 10
    setApiCacheHeaders(event, maxAge)
    return buildFdrGrid(fixtures, [...teams.values()], bootstrap.events)
  }
  catch {
    setApiCacheHeaders(event, 60)
    return emptyFdrGrid()
  }
})
