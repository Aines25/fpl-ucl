import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { groupMatchdays } from '../data/matchdays'
import { matchday1Fixtures } from '../data/matchday1'
import { generateGroupStageFixtures } from '../lib/engine/schedule'
import type { TournamentFixture } from '../lib/types/competition'

function serializeFixture(fixture: TournamentFixture) {
  const group = fixture.group ? `\n    group: '${fixture.group}',` : ''
  const leg = fixture.leg ? `\n    leg: ${fixture.leg},` : ''
  return `  {
    id: '${fixture.id}',
    stage: '${fixture.stage}',${group}
    matchday: ${fixture.matchday},
    fplGameweek: ${fixture.fplGameweek},
    homeId: ${fixture.homeId},
    awayId: ${fixture.awayId},${leg}
  }`
}

const fixtures = generateGroupStageFixtures(matchday1Fixtures, groupMatchdays)
const output = `import type { TournamentFixture } from '../lib/types/competition'

/**
 * Generated group-stage fixtures. Matchday 1 is taken verbatim from data/matchday1.ts.
 * Re-run \`npm run generate:fixtures\` after updating the Matchday 1 draw.
 * Do not edit MD1 pairings here.
 */
export const fixtures: TournamentFixture[] = [
${fixtures.map(serializeFixture).join(',\n')},
]
`

const target = resolve(dirname(fileURLToPath(import.meta.url)), '../data/fixtures.ts')
mkdirSync(dirname(target), { recursive: true })
writeFileSync(target, output)
console.log(`Wrote ${fixtures.length} group-stage fixtures to data/fixtures.ts`)
