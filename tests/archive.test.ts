import { describe, expect, it } from 'vitest'
import { alignArchivedScores, archiveIsComplete } from '../lib/engine/archive'
import type { CompetitionPlayer, FplGameweekScore } from '../lib/types/competition'

const roster: CompetitionPlayer[] = [
  { id: 1, name: 'Christian', fplId: 10, group: 'A' },
  { id: 2, name: 'Dave', fplId: 20, group: 'A' },
  { id: 3, name: 'Unlinked', fplId: 0, group: 'A' },
]

function score(managerId: number, available = true): FplGameweekScore {
  return {
    managerId,
    fplId: managerId * 10,
    gameweek: 1,
    points: 50,
    transferCost: 0,
    netPoints: 50,
    available,
  }
}

describe('archive helpers', () => {
  it('is complete when every linked manager has an available score', () => {
    expect(archiveIsComplete(roster, [score(1), score(2)])).toBe(true)
    expect(archiveIsComplete(roster, [score(1)])).toBe(false)
    expect(archiveIsComplete(roster, [score(1), score(2, false)])).toBe(false)
  })

  it('aligns archived scores onto the current roster and marks them frozen', () => {
    const aligned = alignArchivedScores(roster, [score(1)], 2)
    expect(aligned).toHaveLength(3)
    expect(aligned[0]).toMatchObject({ managerId: 1, gameweek: 2, frozen: true, available: true })
    expect(aligned[1]).toMatchObject({ managerId: 2, available: false, frozen: true, netPoints: 0 })
    expect(aligned[2].available).toBe(false)
  })
})
