import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { matchdays } from '../data/matchdays'
import { knockoutTies } from '../data/knockout'
import type { KnockoutTieConfig, Stage, TournamentFixture } from '../lib/types/competition'
import { drawOpen, drawRoundOf16 } from '../lib/engine/draw'
import { qualifiedSides } from '../lib/engine/qualification'
import type { StandingRow } from '../lib/types/competition'
import type { GroupId } from '../lib/types/competition'

/**
 * One-off knockout draw helper.
 *
 * Usage after the group stage is final:
 *   npx tsx scripts/draw-knockout.ts r16 --standings tmp/standings.json
 *   npx tsx scripts/draw-knockout.ts qf --ids 1,4,7,10,13,16,19,22
 *   npx tsx scripts/draw-knockout.ts sf --ids 1,7,13,19
 *
 * The script prints TypeScript you must paste into data/knockout.ts and commit.
 * It is never imported by the website runtime.
 */

function parseArgs() {
  const [, , round, ...rest] = process.argv
  const args: Record<string, string> = {}
  for (let i = 0; i < rest.length; i += 1) {
    const token = rest[i]
    if (token.startsWith('--')) {
      args[token.slice(2)] = rest[i + 1]
      i += 1
    }
  }
  return { round, args }
}

function matchdayFor(stage: Stage, leg: 1 | 2) {
  const entry = matchdays.find((item) => item.stage === stage && (item.leg ?? 1) === leg)
  if (!entry) throw new Error(`No matchday mapping for ${stage} leg ${leg}`)
  return entry
}

function fixtureFor(
  id: string,
  stage: Stage,
  homeId: number,
  awayId: number,
  leg: 1 | 2,
): TournamentFixture {
  const map = matchdayFor(stage, stage === 'final' ? 1 : leg)
  return {
    id,
    stage,
    matchday: map.matchday,
    fplGameweek: map.fplGameweek,
    homeId,
    awayId,
    leg: stage === 'final' ? undefined : leg,
  }
}

function serialize(fixtures: TournamentFixture[], ties: KnockoutTieConfig[]) {
  return JSON.stringify({ fixtures, ties }, null, 2)
}

function writePreview(payload: string) {
  const target = resolve(dirname(fileURLToPath(import.meta.url)), '../tmp/knockout-draw.json')
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, payload)
  console.log(payload)
  console.log(`\nWrote preview to ${target}`)
  console.log('Paste the resulting fixtures/ties into data/knockout.ts and commit. Do not run this at request time.')
}

const { round, args } = parseArgs()

if (round === 'r16') {
  if (!args.standings) {
    console.error('Pass --standings path/to/standings.json with Record<GroupId, StandingRow[]>')
    process.exit(1)
  }
  const { readFileSync } = await import('node:fs')
  const standings = JSON.parse(readFileSync(args.standings, 'utf8')) as Record<GroupId, StandingRow[]>
  const sides = qualifiedSides(standings)
  const drawn = drawRoundOf16(sides)
  const fixtures: TournamentFixture[] = []
  const ties: KnockoutTieConfig[] = drawn.map((tie, index) => {
    const id = `R16-${index + 1}`
    const first = fixtureFor(`${id}-L1`, 'round-of-16', tie.runnerUpId, tie.winnerId, 1)
    const second = fixtureFor(`${id}-L2`, 'round-of-16', tie.winnerId, tie.runnerUpId, 2)
    fixtures.push(first, second)
    return {
      id,
      stage: 'round-of-16',
      playerOneId: tie.winnerId,
      playerTwoId: tie.runnerUpId,
      firstLegFixtureId: first.id,
      secondLegFixtureId: second.id,
    }
  })
  writePreview(serialize(fixtures, [...ties, ...knockoutTies.filter((tie) => tie.stage !== 'round-of-16')]))
}
else if (round === 'qf' || round === 'sf') {
  const ids = (args.ids ?? '').split(',').map((value) => Number(value.trim())).filter(Boolean)
  const pairs = drawOpen(ids)
  const stage = round === 'qf' ? 'quarter-final' : 'semi-final'
  const prefix = round === 'qf' ? 'QF' : 'SF'
  const fixtures: TournamentFixture[] = []
  const ties: KnockoutTieConfig[] = pairs.map((pair, index) => {
    const id = `${prefix}-${index + 1}`
    const first = fixtureFor(`${id}-L1`, stage, pair[0], pair[1], 1)
    const second = fixtureFor(`${id}-L2`, stage, pair[1], pair[0], 2)
    fixtures.push(first, second)
    return {
      id,
      stage,
      playerOneId: pair[0],
      playerTwoId: pair[1],
      firstLegFixtureId: first.id,
      secondLegFixtureId: second.id,
    }
  })
  writePreview(serialize(fixtures, ties))
}
else {
  console.error('Usage: npx tsx scripts/draw-knockout.ts r16|qf|sf ...')
  process.exit(1)
}
