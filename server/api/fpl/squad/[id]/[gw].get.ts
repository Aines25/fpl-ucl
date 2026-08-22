import { playerById } from '~~/data/players'

export default cachedEventHandler(
  async (event) => {
    const id = Number(getRouterParam(event, 'id'))
    const gw = Number(getRouterParam(event, 'gw'))
    if (!Number.isFinite(id) || !Number.isFinite(gw) || gw < 1) {
      throw createError({ statusCode: 400, statusMessage: 'manager id and gameweek are required' })
    }
    if (!playerById.has(id)) {
      throw createError({ statusCode: 404, statusMessage: 'Unknown manager' })
    }

    return getSquad(id, gw)
  },
  {
    maxAge: 45,
    swr: true,
    staleMaxAge: 60 * 10,
    getKey: (event) => `fpl:squad:${getRouterParam(event, 'id')}:${getRouterParam(event, 'gw')}`,
  },
)
