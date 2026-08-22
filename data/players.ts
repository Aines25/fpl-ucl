import type { CompetitionPlayer, GroupId } from '../lib/types/competition'
import { groupIds } from './competition'

/**
 * Replace this roster with the real 32 managers.
 *
 * Required per participant:
 * - id: stable internal competition ID (do not reuse)
 * - name: display name
 * - fplId: official FPL manager / team ID
 * - group: A–H as drawn
 *
 * fplId 0 means “not linked yet” — the site will skip FPL fetches for that manager.
 */
export const players: CompetitionPlayer[] = groupIds.flatMap((group, groupIndex) =>
  [1, 2, 3, 4].map((slot) => ({
    id: groupIndex * 4 + slot,
    name: `Manager ${group}${slot}`,
    fplId: 0,
    group,
  })),
)

export const playerById = new Map(players.map((player) => [player.id, player]))

export function getPlayer(id: number) {
  const player = playerById.get(id)
  if (!player) {
    throw new Error(`Unknown competition player id: ${id}`)
  }
  return player
}

export function playersInGroup(group: GroupId) {
  return players.filter((player) => player.group === group)
}

export const groups: Record<GroupId, number[]> = Object.fromEntries(
  groupIds.map((group) => [group, playersInGroup(group).map((player) => player.id)]),
) as Record<GroupId, number[]>
