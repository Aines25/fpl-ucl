import { describe, expect, it } from 'vitest'
import {
  buildLeagueInsights,
  ownershipBand,
  playerHasAlert,
  templateXi,
} from '../lib/engine/insights'
import type { CataloguePlayer } from '../lib/types/squad'
import type { LiveOwner } from '../lib/types/league'

function owner(name: string, extras: Partial<LiveOwner> = {}): LiveOwner {
  return {
    entryId: extras.entryId ?? name.length,
    playerName: name,
    entryName: `${name} XI`,
    isCaptain: extras.isCaptain ?? false,
    isViceCaptain: false,
    onBench: extras.onBench ?? false,
    competitionPlayerId: extras.competitionPlayerId ?? null,
  }
}

function player(id: number, webName: string, elementType: CataloguePlayer['elementType'], extras: Partial<CataloguePlayer> = {}): CataloguePlayer {
  return { id, webName, teamId: 1, teamCode: 3, elementType, code: id, ...extras }
}

describe('ownership insights', () => {
  it('bands template, popular and differential', () => {
    expect(ownershipBand(0.5)).toBe('template')
    expect(ownershipBand(0.4)).toBe('popular')
    expect(ownershipBand(0.2)).toBe('differential')
  })

  it('builds a legal template XI from most-owned players', () => {
    const catalogue = new Map<number, CataloguePlayer>([
      [1, player(1, 'Raya', 1)],
      [2, player(2, 'Areola', 1)],
      [3, player(3, 'Saliba', 2)],
      [4, player(4, 'Gabriel', 2)],
      [5, player(5, 'Gvardiol', 2)],
      [6, player(6, 'White', 2)],
      [7, player(7, 'Saka', 3)],
      [8, player(8, 'Palmer', 3)],
      [9, player(9, 'Rice', 3)],
      [10, player(10, 'Salah', 3)],
      [11, player(11, 'Haaland', 4)],
      [12, player(12, 'Watkins', 4)],
      [13, player(13, 'Isak', 4)],
    ])
    const ownersByPlayer: Record<number, LiveOwner[]> = {}
    const counts: Record<number, number> = {
      1: 20, 2: 8, 3: 18, 4: 17, 5: 16, 6: 5, 7: 19, 8: 15, 9: 14, 10: 13, 11: 22, 12: 12, 13: 4,
    }
    for (const [id, count] of Object.entries(counts)) {
      ownersByPlayer[Number(id)] = Array.from({ length: count }, (_, index) => owner(`M${id}-${index}`, {
        entryId: Number(id) * 100 + index,
        isCaptain: Number(id) === 11 && index < 10,
      }))
    }

    const insights = buildLeagueInsights({
      gameweek: 1,
      managerCount: 32,
      picksComplete: true,
      ownersByPlayer,
      catalogue,
    })

    expect(insights.mostOwned[0].webName).toBe('Haaland')
    expect(insights.mostCaptained[0].webName).toBe('Haaland')
    expect(insights.templateXi).toHaveLength(11)
    expect(insights.templateXi.filter((slot) => slot.elementType === 1)).toHaveLength(1)
    expect(templateXi(insights.mostOwned.concat(insights.mostCaptained)).length).toBeGreaterThan(0)
    expect(insights.templateFormation).toMatch(/^\d-\d-\d$/)
  })

  it('lists price movers among owned players', () => {
    const catalogue = new Map<number, CataloguePlayer>([
      [1, player(1, 'Saka', 3, { nowCost: 101, costChangeEvent: 1 })],
      [2, player(2, 'Palmer', 3, { nowCost: 105, costChangeEvent: -1 })],
      [3, player(3, 'Joao', 3, { nowCost: 70, costChangeEvent: 2 })],
    ])
    const insights = buildLeagueInsights({
      gameweek: 1,
      managerCount: 10,
      picksComplete: true,
      ownersByPlayer: {
        1: [owner('A'), owner('B')],
        2: [owner('C')],
      },
      catalogue,
    })
    expect(insights.risers.map((row) => row.webName)).toEqual(['Saka'])
    expect(insights.fallers.map((row) => row.webName)).toEqual(['Palmer'])
  })

  it('flags news, price changes and reduced chance of playing', () => {
    expect(playerHasAlert({ news: 'Knock' })).toBe(true)
    expect(playerHasAlert({ costChangeEvent: 1 })).toBe(true)
    expect(playerHasAlert({ chanceOfPlayingNext: 75 })).toBe(true)
    expect(playerHasAlert({})).toBe(false)
  })
})
