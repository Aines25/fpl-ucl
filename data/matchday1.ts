import type { GroupId, TournamentFixture } from '../lib/types/competition'
import { players } from './players'

/**
 * Drawn Matchday 1 fixtures. Do not regenerate.
 * Replace pairings with the real draw; keep ids stable where possible.
 */
function playerId(name: string) {
  const player = players.find((entry) => entry.name === name)
  if (!player) {
    throw new Error(`Unknown competition player: ${name}`)
  }
  return player.id
}

function match(
  group: GroupId,
  pair: 1 | 2,
  home: string,
  away: string,
): TournamentFixture {
  return {
    id: `${group}-MD1-${pair}`,
    stage: 'group',
    group,
    matchday: 1,
    fplGameweek: 1,
    homeId: playerId(home),
    awayId: playerId(away),
  }
}

export const matchday1Fixtures: TournamentFixture[] = [
  match('A', 1, 'Tom Shinton', "Marcus O'Byrne"),
  match('A', 2, 'Samuel Adejokun', 'Steve Joslin'),
  match('B', 1, 'Ryan Kelman', 'Aaron Leaver'),
  match('B', 2, 'Seun Solaja', 'Sam Hilton-Banks'),
  match('C', 1, 'Adrian Johnson', 'Gbenga Sonuga'),
  match('C', 2, 'Simon Thomas', 'Matt Syrett'),
  match('D', 1, 'Samuel Jobbins', 'Jack Wellon'),
  match('D', 2, 'Danny Windsor', 'Christian Smith-Rose'),
  match('E', 1, 'Leon Johnson', 'Ryan Upward'),
  match('E', 2, 'Lee Devonshire', 'Leon Antoine'),
  match('F', 1, 'Preston Edwards', 'Rak Chauda'),
  match('F', 2, 'Sammy Bounaouara', 'Dan Huxley'),
  match('G', 1, 'Cameron Butt', 'Josh Williams'),
  match('G', 2, 'Richard Carr', 'Sam Woodcock'),
  match('H', 1, 'Justin Maynard', 'Luke Mcmanus'),
  match('H', 2, 'Lee Hicks', 'Gbenga Ladega'),
]
