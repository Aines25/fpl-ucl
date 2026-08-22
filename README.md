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

The app is a standard Nuxt 4 / Nitro server. It needs SSR (FPL calls are server-side). Pick the host that currently serves the domain and set the matching preset if it is not auto-detected:

| Host | Command / notes |
| --- | --- |
| Vercel | `npm run build` — Nuxt detects Vercel |
| Netlify | `npm run build` — see `netlify.toml` |
| Cloudflare Pages | `NITRO_PRESET=cloudflare_pages npm run build` |
| VPS / Node | `NITRO_PRESET=node-server npm run build` then `node .output/server/index.mjs` |

Point `website` (and the apex if you use it) at that deployment.

## Stack

Nuxt 4, Vue 3, TypeScript, Tailwind CSS, ShadCN Vue, Nitro server routes. Design tokens live in [`app/assets/css/tokens.css`](app/assets/css/tokens.css). UEFA Champions League colours/type are **inspired** public substitutes (Cinzel, Barlow Condensed, Inter) — official UEFA marks and the Champions typeface are not embedded.
