export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const gameweek = Number(query.gameweek)
  if (!Number.isFinite(gameweek) || gameweek < 1) {
    throw createError({ statusCode: 400, statusMessage: 'gameweek is required' })
  }
  return getScoresForGameweek(gameweek)
})
