import type { GroupId, MatchdayMap, TournamentFixture } from '../types/competition'

type Pair = [number, number]

function reversePair([home, away]: Pair): Pair {
  return [away, home]
}

/**
 * 4-team double round-robin that preserves the supplied Matchday 1 pairings.
 * Teams are labelled from MD1 as A vs B and C vs D, then rotated:
 * MD1 A-B, C-D
 * MD2 A-C, D-B
 * MD3 A-D, B-C
 * MD4–6 reverse fixtures.
 */
export function generateGroupStageFixtures(
  matchday1: TournamentFixture[],
  groupMatchdays: MatchdayMap[],
): TournamentFixture[] {
  const byGroup = new Map<GroupId, TournamentFixture[]>()

  for (const fixture of matchday1) {
    if (fixture.stage !== 'group' || !fixture.group) {
      throw new Error(`Matchday 1 fixture ${fixture.id} is not a group fixture`)
    }
    const list = byGroup.get(fixture.group) ?? []
    list.push(fixture)
    byGroup.set(fixture.group, list)
  }

  const generated: TournamentFixture[] = []

  for (const [group, md1] of byGroup) {
    if (md1.length !== 2) {
      throw new Error(`Group ${group} must have exactly 2 Matchday 1 fixtures`)
    }

    const [first, second] = md1
    const A = first.homeId
    const B = first.awayId
    const C = second.homeId
    const D = second.awayId
    const unique = new Set([A, B, C, D])
    if (unique.size !== 4) {
      throw new Error(`Group ${group} Matchday 1 must involve four distinct players`)
    }

    const rounds: Pair[][] = [
      [[A, B], [C, D]],
      [[A, C], [D, B]],
      [[A, D], [B, C]],
    ]
    const fullRounds = [...rounds, ...rounds.map((pairs) => pairs.map(reversePair))]

    fullRounds.forEach((pairs, index) => {
      const map = groupMatchdays[index]
      if (!map) {
        throw new Error(`Missing group matchday mapping for round ${index + 1}`)
      }

      pairs.forEach(([homeId, awayId], pairIndex) => {
        generated.push({
          id: `${group}-MD${map.matchday}-${pairIndex + 1}`,
          stage: 'group',
          group,
          matchday: map.matchday,
          fplGameweek: map.fplGameweek,
          homeId,
          awayId,
        })
      })
    })
  }

  return generated.sort((left, right) => {
    if (left.matchday !== right.matchday) return left.matchday - right.matchday
    if ((left.group ?? '') !== (right.group ?? '')) {
      return (left.group ?? '').localeCompare(right.group ?? '')
    }
    return left.id.localeCompare(right.id)
  })
}
