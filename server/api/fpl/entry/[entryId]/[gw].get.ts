export default cachedEventHandler(
  async (event) => {
    const entryId = Number(getRouterParam(event, 'entryId'))
    const gw = Number(getRouterParam(event, 'gw'))
    if (!Number.isFinite(entryId) || entryId <= 0 || !Number.isFinite(gw) || gw < 1) {
      throw createError({ statusCode: 400, statusMessage: 'entry id and gameweek are required' })
    }

    const league = await getClassicLeague()
    const row = league.standings.find((standing) => standing.entryId === entryId)
    if (!row) {
      throw createError({ statusCode: 404, statusMessage: 'Unknown league entry' })
    }

    return getSquadByEntry({
      managerId: row.competitionPlayerId ?? 0,
      fplId: entryId,
      name: row.playerName,
      gameweek: gw,
    })
  },
  {
    maxAge: 45,
    swr: true,
    staleMaxAge: 60 * 10,
    getKey: (event) => `fpl:entry:v6:${getRouterParam(event, 'entryId')}:${getRouterParam(event, 'gw')}`,
  },
)
