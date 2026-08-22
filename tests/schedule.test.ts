import { describe, expect, it } from 'vitest'
import { groupMatchdays } from '../data/matchdays'
import { matchday1Fixtures } from '../data/matchday1'
import { groups } from '../data/players'
import { generateGroupStageFixtures } from '../lib/engine/schedule'

describe('generateGroupStageFixtures', () => {
  const fixtures = generateGroupStageFixtures(matchday1Fixtures, groupMatchdays)

  it('keeps Matchday 1 pairings verbatim', () => {
    for (const original of matchday1Fixtures) {
      const generated = fixtures.find((fixture) => fixture.id === original.id)
      expect(generated).toMatchObject({
        homeId: original.homeId,
        awayId: original.awayId,
        matchday: 1,
      })
    }
  })

  it('gives every group 12 fixtures (home and away vs each rival)', () => {
    for (const group of Object.keys(groups)) {
      const groupFixtures = fixtures.filter((fixture) => fixture.group === group)
      expect(groupFixtures).toHaveLength(12)
    }
  })

  it('has each pair play exactly twice, once each way', () => {
    const groupA = fixtures.filter((fixture) => fixture.group === 'A')
    const ids = groups.A
    for (let i = 0; i < ids.length; i += 1) {
      for (let j = i + 1; j < ids.length; j += 1) {
        const a = ids[i]
        const b = ids[j]
        const meetings = groupA.filter(
          (fixture) =>
            (fixture.homeId === a && fixture.awayId === b)
            || (fixture.homeId === b && fixture.awayId === a),
        )
        expect(meetings).toHaveLength(2)
        expect(meetings.some((fixture) => fixture.homeId === a)).toBe(true)
        expect(meetings.some((fixture) => fixture.homeId === b)).toBe(true)
      }
    }
  })
})
