import { getPlayer } from '~~/data/players'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const gw = Number(getRouterParam(event, 'gw'))
  const player = getPlayer(id)
  return getGameweekScore(player.id, player.fplId, gw)
})
