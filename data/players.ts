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
const linkedPlayers: CompetitionPlayer[] = [
  { id: 1, name: 'Tom Shinton', fplId: 563186, group: 'A' },
  { id: 2, name: "Marcus O'Byrne", fplId: 1188468, group: 'A' },
  { id: 3, name: 'Samuel Adejokun', fplId: 144956, group: 'A' },
  { id: 4, name: 'Steve Joslin', fplId: 1312346, group: 'A' },
  { id: 5, name: 'Ryan Kelman', fplId: 651337, group: 'B' },
  { id: 6, name: 'Aaron Leaver', fplId: 4946618, group: 'B' },
  { id: 7, name: 'Seun Solaja', fplId: 1347929, group: 'B' },
  { id: 8, name: 'Sam Hilton-Banks', fplId: 1126782, group: 'B' },
  { id: 9, name: 'Adrian Johnson', fplId: 1068551, group: 'C' },
  { id: 10, name: 'Gbenga Sonuga', fplId: 328296, group: 'C' },
  { id: 11, name: 'Simon Thomas', fplId: 66841, group: 'C' },
  { id: 12, name: 'Matt Syrett', fplId: 388304, group: 'C' },
  { id: 13, name: 'Samuel Jobbins', fplId: 1472950, group: 'D' },
  { id: 14, name: 'Jack Wellon', fplId: 142150, group: 'D' },
  { id: 15, name: 'Danny Windsor', fplId: 24746, group: 'D' },
  { id: 16, name: 'Christian Smith-Rose', fplId: 12878, group: 'D' },
  { id: 17, name: 'Leon Johnson', fplId: 2754371, group: 'E' },
  { id: 18, name: 'Ryan Upward', fplId: 2722562, group: 'E' },
  { id: 19, name: 'Lee Devonshire', fplId: 559784, group: 'E' },
  { id: 20, name: 'Leon Antoine', fplId: 2634981, group: 'E' },
  { id: 21, name: 'Preston Edwards', fplId: 58801, group: 'F' },
  { id: 22, name: 'Rak Chauda', fplId: 608091, group: 'F' },
  { id: 23, name: 'Sammy Bounaouara', fplId: 1532295, group: 'F' },
  { id: 24, name: 'Dan Huxley', fplId: 1267335, group: 'F' },
  { id: 25, name: 'Cameron Butt', fplId: 233847, group: 'G' },
  { id: 26, name: 'Josh Williams', fplId: 278195, group: 'G' },
  { id: 27, name: 'Richard Carr', fplId: 1987263, group: 'G' },
  { id: 28, name: 'Sam Woodcock', fplId: 86054, group: 'G' },
  { id: 29, name: 'Justin Maynard', fplId: 4191804, group: 'H' },
  { id: 30, name: 'Luke Mcmanus', fplId: 505660, group: 'H' },
  { id: 31, name: 'Lee Hicks', fplId: 2412253, group: 'H' },
  { id: 32, name: 'Gbenga Ladega', fplId: 2737591, group: 'H' },

]

const linkedIds = new Set(linkedPlayers.map((player) => player.id))

export const players: CompetitionPlayer[] = [
  ...linkedPlayers,
  ...groupIds.flatMap((group, groupIndex) =>
    [1, 2, 3, 4]
      .map((slot) => ({
        id: groupIndex * 4 + slot,
        name: `Manager ${group}${slot}`,
        fplId: 0,
        group,
      }))
      .filter((player) => !linkedIds.has(player.id)),
  ),
]

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
