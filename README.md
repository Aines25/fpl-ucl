# FPL Champions League

Private Fantasy Premier League competition site. Old UEFA Champions League format: 8 groups of 4, six group matchdays, then two-legged knockouts and a one-leg final.

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000

```bash
npm test
npm run build
npm run preview
```

## Add the real league

Participants were not supplied at build time. Replace the placeholders:

1. Edit [`data/players.ts`](data/players.ts) with each manager’s `name`, official FPL `fplId`, and drawn `group` (`A`–`H`). Keep internal `id` values stable.
2. Edit [`data/matchday1.ts`](data/matchday1.ts) with the **already drawn** Matchday 1 fixtures. Do not regenerate MD1.
3. Run `npm run generate:fixtures` to write Matchdays 2–6 into [`data/fixtures.ts`](data/fixtures.ts) while preserving those MD1 pairings.
4. Redeploy.

`fplId: 0` means “not linked yet” — the UI still renders, but scores stay blank.

## Knockout draws

Draws are one-off scripts. The website never calls `Math.random()` when rendering.

```bash
npx tsx scripts/draw-knockout.ts r16 --standings tmp/standings.json
npx tsx scripts/draw-knockout.ts qf --ids 1,4,7,10,13,16,19,22
npx tsx scripts/draw-knockout.ts sf --ids 1,7,13,19
```

Paste the printed fixtures/ties into [`data/knockout.ts`](data/knockout.ts) and commit.

## Deploy

The live site is a Cloudflare Worker: https://fpl-ucl.christian-8ee.workers.dev

Pushing to GitHub does not update it. Deploy from this repo:

```bash
npm run deploy
```

That builds with the Cloudflare Workers preset and runs Wrangler.

Login uses the **system default browser** (often Chrome). To finish it in Safari:

```bash
npx wrangler login --browser=false
```

Leave that running, copy the printed URL into Safari (where you are logged into Cloudflare), and wait for it to redirect to `localhost:8976`. The terminal must stay open.

To skip the browser entirely, create an API token (Workers Scripts Edit) at https://dash.cloudflare.com/profile/api-tokens and deploy with:

```bash
export CLOUDFLARE_API_TOKEN=your-token
npm run deploy
```

Live snapshots are cached for 60 seconds while a gameweek is in play (12 hours once FPL has checked the data). On Cloudflare Workers the cache is shared via the Cache API, so a WhatsApp group opening the site at once does not each trigger a full FPL burst. No KV namespace is required.

## Stack

Nuxt 4, Vue 3, TypeScript, Tailwind CSS, ShadCN Vue, Nitro server routes. Design tokens live in [`app/assets/css/tokens.css`](app/assets/css/tokens.css). UEFA Champions League colours/type are **inspired** public substitutes (Cinzel, Barlow Condensed, Inter) — official UEFA marks and the Champions typeface are not embedded.
