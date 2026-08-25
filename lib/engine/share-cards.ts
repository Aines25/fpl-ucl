import type { FixtureResult, GroupId, StandingRow, TournamentFixture } from '../types/competition'
import type { LeagueStandingRow } from '../types/league'
import { chipLabel } from './squad'

export type ShareSize = 'og' | 'square'

export function shareDimensions(size: ShareSize) {
  if (size === 'square') return { width: 1080, height: 1080 }
  return { width: 1200, height: 630 }
}

export function leagueShareDimensions(rowCount: number) {
  const width = 1080
  const header = 118
  const rowHeight = 30
  const padding = 56
  const height = header + padding + (rowCount + 1) * rowHeight
  return { width, height: Math.max(720, Math.min(4096, height)) }
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

export interface ShareLeagueRow {
  rank: number
  name: string
  captain: string
  transfersIn: string
  transfersOut: string
  freeTransfers: string
  transferCost: string
  eventTotal: string
  total: string
  chip: string | null
  inUcl: boolean
}

export interface ShareLeagueCard {
  title: string
  kicker: string
  rows: ShareLeagueRow[]
}

function joinNames(names: string[] | null | undefined) {
  return names?.length ? names.join(', ') : '–'
}

export function leagueShareCard(input: {
  title: string
  kicker: string
  standings: LeagueStandingRow[]
  stillInUcl: Set<number>
}): ShareLeagueCard {
  return {
    title: input.title.replace(/\p{Extended_Pictographic}/gu, '').replace(/\s+/g, ' ').trim(),
    kicker: input.kicker,
    rows: input.standings.map((row) => ({
      rank: row.rank,
      name: row.playerName,
      captain: row.captain ?? '–',
      transfersIn: joinNames(row.transfersIn),
      transfersOut: joinNames(row.transfersOut),
      freeTransfers: row.freeTransfers == null ? '–' : String(row.freeTransfers),
      transferCost: row.transferCost == null ? '–' : String(row.transferCost),
      eventTotal: String(row.eventTotal),
      total: String(row.total),
      chip: row.chip ? (chipLabel(row.chip) ?? row.chip) : null,
      inUcl: Boolean(row.competitionPlayerId && input.stillInUcl.has(row.competitionPlayerId)),
    })),
  }
}
