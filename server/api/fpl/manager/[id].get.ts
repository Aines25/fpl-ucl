import { getPlayer } from '~~/data/players'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const player = getPlayer(id)
  if (!player.fplId) {
    return {
      managerId: player.id,
      fplId: 0,
      name: player.name,
      teamName: null,
    }
  }
  const manager = await getManager(player.fplId)
  return {
    managerId: player.id,
    fplId: player.fplId,
    name: player.name,
    teamName: manager.name,
  }
})
