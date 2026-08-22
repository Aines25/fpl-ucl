import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { FrozenScoresFile, FplGameweekScore } from '../lib/types/competition'
import { matchdays } from '../data/matchdays'
import { players } from '../data/players'
import { archiveIsComplete } from '../lib/engine/archive'
import frozenScores from '../data/frozen-scores.json'
import { FPL_BASE, normaliseGameweekScore, type FplBootstrapResponse, type FplLiveResponse, type FplPicksResponse } from '../server/utils/fpl'

const headers = {
  'User-Agent': 'Mozilla/5.0 (compatible; FPL-UCL/1.0; +https://christiancodes.co.uk)',
  Accept: 'application/json',
}

const force = process.argv.includes('--force')
const archive = frozenScores as FrozenScoresFile

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${FPL_BASE}${path}`, { headers })
  if (!response.ok) {
    throw new Error(`FPL ${path} failed with ${response.status}`)
  }
  return response.json() as Promise<T>
}

async function liveMap(gameweek: number) {
  const payload = await fetchJson<FplLiveResponse>(`/event/${gameweek}/live/`)
  return new Map((payload.elements ?? []).map((element) => [element.id, { points: element.stats?.total_points ?? 0 }]))
}

async function freezeGameweek(gameweek: number): Promise<FplGameweekScore[]> {
  const live = await liveMap(gameweek)
  const scores: FplGameweekScore[] = []
  for (const player of players) {
    if (!player.fplId) {
      scores.push({
        managerId: player.id,
        fplId: 0,
        gameweek,
        points: 0,
        transferCost: 0,
        netPoints: 0,
        available: false,
        frozen: true,
      })
      continue
    }
    const payload = await fetchJson<FplPicksResponse>(`/entry/${player.fplId}/event/${gameweek}/picks/`)
    const score = normaliseGameweekScore(player.id, player.fplId, gameweek, payload, live)
    scores.push({ ...score, frozen: true })
  }
  return scores
}

async function main() {
  const bootstrap = await fetchJson<FplBootstrapResponse>('/bootstrap-static/')
  const checked = new Set(
    (bootstrap.events ?? [])
      .filter((event) => event.data_checked)
      .map((event) => event.id),
  )

  const wanted = [...new Set(matchdays.map((entry) => entry.fplGameweek))]
    .filter((gameweek) => checked.has(gameweek))
    .sort((left, right) => left - right)

  let wrote = 0
  for (const gameweek of wanted) {
    if (!force && archive[String(gameweek)]?.scores.length) {
      continue
    }
    const scores = await freezeGameweek(gameweek)
    if (!archiveIsComplete(players, scores)) {
      console.warn(`Skipping GW${gameweek}: not every linked manager has a score`)
      continue
    }
    archive[String(gameweek)] = {
      frozenAt: new Date().toISOString(),
      scores,
    }
    wrote += 1
    console.log(`Froze GW${gameweek} (${scores.filter((score) => score.available).length} scores)`)
  }

  const target = resolve(process.cwd(), 'data/frozen-scores.json')
  await writeFile(target, `${JSON.stringify(archive, null, 2)}\n`)
  console.log(wrote ? `Wrote ${wrote} gameweek(s) to data/frozen-scores.json` : 'No new data-checked gameweeks to freeze')
}

void main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
