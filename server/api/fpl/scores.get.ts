export default cachedEventHandler(
  async (event) => {
    const query = getQuery(event)
    const gameweek = Number(query.gameweek)
    if (!Number.isFinite(gameweek) || gameweek < 1) {
      throw createError({ statusCode: 400, statusMessage: 'gameweek is required' })
    }
    return getScoresForGameweek(gameweek)
  },
  {
    maxAge: 60,
    swr: true,
    staleMaxAge: 60 * 60,
    getKey: (event) => `fpl:scores:${getQuery(event).gameweek}`,
  },
)
