import type { ClubFixture, ClubInfo } from '../types/squad'

export interface ClubFixtureInput {
  team_h: number
  team_a: number
  kickoff_time: string | null
  started?: boolean | null
  finished?: boolean | null
  finished_provisional?: boolean | null
}

export function fixtureIsComplete(fixture: Pick<ClubFixtureInput, 'finished' | 'finished_provisional'>) {
  return Boolean(fixture.finished || fixture.finished_provisional)
}

export function indexTeamFinished(fixtures: ClubFixtureInput[]) {
  const byTeam = new Map<number, ClubFixtureInput[]>()
  for (const fixture of fixtures) {
    const home = byTeam.get(fixture.team_h) ?? []
    home.push(fixture)
    byTeam.set(fixture.team_h, home)
    const away = byTeam.get(fixture.team_a) ?? []
    away.push(fixture)
    byTeam.set(fixture.team_a, away)
  }

  const finished = new Map<number, boolean>()
  for (const [teamId, matches] of byTeam) {
    finished.set(teamId, matches.every((match) => fixtureIsComplete(match)))
  }
  return finished
}

export function isPendingFixture(fixture: ClubFixture | null | undefined) {
  return Boolean(fixture && !fixture.started)
}

export function formatFixtureKickoff(iso: string | null | undefined) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const day = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    timeZone: 'Europe/London',
  }).format(date)
  const time = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Europe/London',
  }).format(date)
  return `${day} ${time}`
}

export function formatUpcomingFixture(fixture: ClubFixture) {
  const when = formatFixtureKickoff(fixture.kickoff)
  return when ? `vs ${fixture.opponent} · ${when}` : `vs ${fixture.opponent}`
}

function toClubFixture(
  teamId: number,
  match: ClubFixtureInput,
  teams: Map<number, ClubInfo>,
): ClubFixture {
  const opponentId = match.team_h === teamId ? match.team_a : match.team_h
  return {
    opponent: teams.get(opponentId)?.shortName ?? 'TBD',
    kickoff: match.kickoff_time,
    started: Boolean(match.started),
    finished: Boolean(match.finished),
  }
}

export function pickClubFixture(
  teamId: number,
  fixtures: ClubFixtureInput[],
  teams: Map<number, ClubInfo>,
): ClubFixture | null {
  const matches = fixtures
    .filter((fixture) => fixture.team_h === teamId || fixture.team_a === teamId)
    .sort((left, right) => (left.kickoff_time ?? '').localeCompare(right.kickoff_time ?? ''))

  if (!matches.length) return null

  const next = matches.find((fixture) => !fixture.started) ?? matches[matches.length - 1]
  return toClubFixture(teamId, next, teams)
}

export function indexClubFixtures(
  fixtures: ClubFixtureInput[],
  teams: Map<number, ClubInfo>,
) {
  const index = new Map<number, ClubFixture>()
  const teamIds = new Set<number>()
  for (const fixture of fixtures) {
    teamIds.add(fixture.team_h)
    teamIds.add(fixture.team_a)
  }
  for (const teamId of teamIds) {
    const match = pickClubFixture(teamId, fixtures, teams)
    if (match) index.set(teamId, match)
  }
  return index
}
