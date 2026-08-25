import type { FixtureResult, GroupId, StandingRow, TournamentFixture } from '../types/competition'

export type ShareSize = 'og' | 'square'

export function shareDimensions(size: ShareSize) {
  if (size === 'square') return { width: 1080, height: 1080 }
  return { width: 1200, height: 630 }
}

export interface ShareMatchCard {
  kicker: string
  homeName: string
  awayName: string
  homeScore: string
  awayScore: string
  status: string
}

export interface ShareFixtureLine {
  group: string
  homeName: string
  awayName: string
  homeScore: string
  awayScore: string
}

export interface ShareMatchdayCard {
  title: string
  kicker: string
  lines: ShareFixtureLine[]
}

export interface ShareGroupRow {
  position: number
  name: string
  played: number
  points: number
}

export interface ShareGroupsCard {
  title: string
  kicker: string
  groups: Array<{ group: GroupId, rows: ShareGroupRow[] }>
}

function scoreLabel(value: number | null | undefined) {
  return value == null ? '–' : String(value)
}

export function matchShareCard(input: {
  homeName: string
  awayName: string
  homeScore: number | null
  awayScore: number | null
  status: string
  kicker: string
}): ShareMatchCard {
  return {
    kicker: input.kicker,
    homeName: input.homeName,
    awayName: input.awayName,
    homeScore: scoreLabel(input.homeScore),
    awayScore: scoreLabel(input.awayScore),
    status: input.status,
  }
}

export function matchdayShareCard(input: {
  title: string
  kicker: string
  fixtures: TournamentFixture[]
  results: Map<string, FixtureResult>
  nameFor: (id: number) => string
}): ShareMatchdayCard {
  const lines = input.fixtures.map((fixture) => {
    const result = input.results.get(fixture.id)
    return {
      group: fixture.group ? `Group ${fixture.group}` : fixture.stage.replaceAll('-', ' '),
      homeName: input.nameFor(fixture.homeId),
      awayName: input.nameFor(fixture.awayId),
      homeScore: scoreLabel(result?.homeScore ?? null),
      awayScore: scoreLabel(result?.awayScore ?? null),
    }
  })
  return { title: input.title, kicker: input.kicker, lines }
}

export function groupsShareCard(input: {
  title: string
  kicker: string
  groupIds: GroupId[]
  standings: Record<GroupId, StandingRow[]>
  nameFor: (id: number) => string
}): ShareGroupsCard {
  return {
    title: input.title,
    kicker: input.kicker,
    groups: input.groupIds.map((group) => ({
      group,
      rows: (input.standings[group] ?? []).map((row) => ({
        position: row.position,
        name: input.nameFor(row.playerId),
        played: row.played,
        points: row.points,
      })),
    })),
  }
}
