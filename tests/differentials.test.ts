import { describe, expect, it } from 'vitest'
import { compareSquads, competitionMultiplier } from '../lib/engine/differentials'
import { emptySquad } from '../lib/engine/squad'
import type { FplSquadView, SquadSlot } from '../lib/types/squad'

function slot(partial: Partial<SquadSlot> & Pick<SquadSlot, 'elementId' | 'webName'>): SquadSlot {
  return {
    pickPosition: 1,
    multiplier: 1,
    isCaptain: false,
    isViceCaptain: false,
    rawPoints: 6,
    points: 6,
    minutes: 90,
    counting: true,
    elementType: 3,
    teamId: 1,
    teamCode: 1,
    photoUrl: '',
    shirtUrl: '',
    fixture: null,
    ...partial,
  }
}

function squad(name: string, starters: SquadSlot[], extras: Partial<FplSquadView> = {}): FplSquadView {
  return {
    ...emptySquad(1, 1, name, 1),
    available: true,
    starters,
    bench: [],
    points: starters.reduce((sum, entry) => sum + entry.rawPoints * Math.min(entry.multiplier, 2), 0),
    netPoints: starters.reduce((sum, entry) => sum + entry.rawPoints * Math.min(entry.multiplier, 2), 0),
    ...extras,
  }
}

describe('compareSquads', () => {
  it('treats a unique starter as a differential swing', () => {
    const home = squad('Home', [slot({ elementId: 9, webName: 'Salah', isCaptain: true, multiplier: 2, rawPoints: 8 })])
    const away = squad('Away', [slot({ elementId: 12, webName: 'Palmer', rawPoints: 5 })])
    const summary = compareSquads(home, away)!
    expect(summary.homeOnly[0].webName).toBe('Salah')
    expect(summary.awayOnly[0].webName).toBe('Palmer')
    expect(summary.playerSwing).toBe(16 - 5)
  })

  it('only counts a shared player when captaincy differs', () => {
    const shared = slot({ elementId: 9, webName: 'Salah', rawPoints: 10 })
    const home = squad('Home', [{ ...shared, isCaptain: true, multiplier: 2 }])
    const away = squad('Away', [{ ...shared, multiplier: 1 }])
    const summary = compareSquads(home, away)!
    expect(summary.shared).toHaveLength(1)
    expect(summary.captainSwing).toBe(10)
    expect(summary.netSwing).toBe(10)
  })

  it('ignores bench boost extras and caps triple captain at 2x', () => {
    const bench = slot({ elementId: 20, webName: 'Bench', pickPosition: 12, multiplier: 1, rawPoints: 7 })
    expect(competitionMultiplier(bench, 'bboost')).toBe(0)
    const triple = slot({ elementId: 9, webName: 'Salah', isCaptain: true, multiplier: 3, rawPoints: 8 })
    expect(competitionMultiplier(triple, '3xc')).toBe(2)
  })

  it('adds transfer cost to the net swing', () => {
    const home = squad('Home', [slot({ elementId: 1, webName: 'A', rawPoints: 4 })], { transferCost: 4 })
    const away = squad('Away', [slot({ elementId: 1, webName: 'A', rawPoints: 4 })], { transferCost: 0 })
    const summary = compareSquads(home, away)!
    expect(summary.playerSwing).toBe(0)
    expect(summary.transferSwing).toBe(-4)
    expect(summary.netSwing).toBe(-4)
  })

  it('marks a unique unplayed pick as pending', () => {
    const fixture = {
      opponent: 'MCI',
      kickoff: '2026-08-23T15:00:00Z',
      started: false,
      finished: false,
    }
    const home = squad('Home', [slot({
      elementId: 9,
      webName: 'Haaland',
      rawPoints: 0,
      minutes: 0,
      fixture,
    })])
    const away = squad('Away', [slot({ elementId: 12, webName: 'Palmer', rawPoints: 5 })])
    const summary = compareSquads(home, away)!
    expect(summary.homeOnly[0]?.pending).toBe(true)
    expect(summary.homeOnly[0]?.fixture).toEqual(fixture)
    expect(summary.awayOnly[0]?.pending).toBe(false)
  })
})
