import { Renderer } from '@takumi-rs/core'
import { container, googleFonts, text, type Node } from '@takumi-rs/helpers'
import type { ShareGroupsCard, ShareLeagueCard, ShareMatchCard, ShareMatchdayCard, ShareSize } from '../../lib/engine/share-cards'
import { shareDimensions } from '../../lib/engine/share-cards'

const COLORS = {
  navy: '#050b1a',
  panel: '#0e1c4a',
  cyan: '#00a3e0',
  silver: '#c8d0dc',
  white: '#f4f7fb',
  star: '#f5c542',
}

const GROUP_COLORS: Record<string, string> = {
  A: '#00a3e0',
  B: '#2ee6c7',
  C: '#7b6cff',
  D: '#e85cff',
  E: '#f5c542',
  F: '#ff6b4a',
  G: '#4ad6ff',
  H: '#c4f25a',
}

let rendererPromise: Promise<Renderer> | null = null

async function getRenderer() {
  if (!rendererPromise) {
    rendererPromise = (async () => {
      const renderer = new Renderer()
      const fonts = await googleFonts([
        { name: 'Cinzel', weight: [600, 700] },
        { name: 'Barlow Condensed', weight: [600, 700] },
        { name: 'Inter', weight: 500 },
      ])
      for (const font of fonts) {
        await renderer.registerFont(font)
      }
      return renderer
    })()
  }
  return rendererPromise
}

function kicker(label: string) {
  return text(label, {
    color: COLORS.cyan,
    fontFamily: 'Barlow Condensed',
    fontSize: 22,
    fontWeight: 600,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
  })
}

function title(label: string, size = 42) {
  return text(label, {
    color: COLORS.white,
    fontFamily: 'Cinzel',
    fontSize: size,
    fontWeight: 700,
    textTransform: 'uppercase',
  })
}

export function matchNode(card: ShareMatchCard, size: ShareSize): Node {
  const scoreSize = size === 'square' ? 96 : 72
  return container({
    style: {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      backgroundColor: COLORS.navy,
      padding: size === 'square' ? 64 : 48,
    },
    children: [
      container({
        style: { display: 'flex', flexDirection: 'column', gap: 12 },
        children: [
          kicker('Champions League · 2026/27'),
          kicker(card.kicker),
        ],
      }),
      container({
        style: {
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
        },
        children: [
          title(card.homeName, size === 'square' ? 36 : 28),
          text(`${card.homeScore}–${card.awayScore}`, {
            color: COLORS.star,
            fontFamily: 'Barlow Condensed',
            fontSize: scoreSize,
            fontWeight: 700,
          }),
          title(card.awayName, size === 'square' ? 36 : 28),
        ],
      }),
      text(card.status.toUpperCase(), {
        color: COLORS.silver,
        fontFamily: 'Barlow Condensed',
        fontSize: 20,
        letterSpacing: '0.18em',
      }),
    ],
  })
}

function groupAccent(label: string) {
  const letter = /^Group\s+([A-H])$/i.exec(label)?.[1]?.toUpperCase()
  return GROUP_COLORS[letter ?? ''] ?? COLORS.cyan
}

function clusterShareLines(lines: ShareMatchdayCard['lines']) {
  const clusters: Array<{ heading: string, accent: string, lines: ShareMatchdayCard['lines'] }> = []
  for (const line of lines) {
    const last = clusters.at(-1)
    if (last && last.heading === line.group) {
      last.lines.push(line)
      continue
    }
    clusters.push({ heading: line.group, accent: groupAccent(line.group), lines: [line] })
  }
  return clusters
}

function shareName(name: string, align: 'left' | 'right', fontSize: number): Node {
  return container({
    style: {
      minWidth: 0,
      overflow: 'hidden',
      display: 'flex',
      justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
    },
    children: [
      text(name, {
        color: COLORS.white,
        fontFamily: 'Barlow Condensed',
        fontSize,
        fontWeight: 600,
        textAlign: align,
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
      }),
    ],
  })
}

function shareScore(home: string, away: string, fontSize: number): Node {
  const scoreStyle = {
    color: COLORS.star,
    fontFamily: 'Barlow Condensed',
    fontSize,
    fontWeight: 700 as const,
    fontVariantNumeric: 'tabular-nums' as const,
  }
  return container({
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 16px 1fr',
      alignItems: 'center',
      columnGap: 2,
      width: '100%',
    },
    children: [
      text(home, { ...scoreStyle, textAlign: 'right' }),
      text('–', { ...scoreStyle, textAlign: 'center' }),
      text(away, { ...scoreStyle, textAlign: 'left' }),
    ],
  })
}

function shareFixtureCells(line: ShareMatchdayCard['lines'][number], fontSize: number): Node[] {
  return [
    shareName(line.homeName, 'right', fontSize),
    shareScore(line.homeScore, line.awayScore, fontSize),
    shareName(line.awayName, 'left', fontSize),
  ]
}

function shareResultsGrid(children: Node[], fontSize: number, square: boolean): Node {
  const scoreWidth = fontSize >= 22 ? 120 : 100
  return container({
    style: {
      display: 'grid',
      gridTemplateColumns: `minmax(0, 1fr) ${scoreWidth}px minmax(0, 1fr)`,
      columnGap: 12,
      rowGap: square ? 6 : 8,
      alignItems: 'center',
      alignContent: square ? 'space-evenly' : 'start',
      flexGrow: 1,
      flexBasis: 0,
      minWidth: 0,
      width: '100%',
      height: '100%',
    },
    children,
  })
}

export function matchdayNode(card: ShareMatchdayCard, size: ShareSize): Node {
  const fontSize = size === 'square' ? 22 : 18
  const clusters = clusterShareLines(card.lines)
  const useHeadings = clusters.length > 1
  const headingSize = size === 'square' ? 15 : 13
  const halves = useHeadings
    ? [clusters.slice(0, Math.ceil(clusters.length / 2)), clusters.slice(Math.ceil(clusters.length / 2))]
    : [
        [{ heading: '', accent: COLORS.cyan, lines: card.lines.slice(0, Math.ceil(card.lines.length / 2)) }],
        [{ heading: '', accent: COLORS.cyan, lines: card.lines.slice(Math.ceil(card.lines.length / 2)) }],
      ]

  return container({
    style: {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: COLORS.navy,
      padding: size === 'square' ? 44 : 36,
      gap: 24,
    },
    children: [
      container({
        style: { display: 'flex', flexDirection: 'column', gap: 6 },
        children: [kicker(card.kicker), title(card.title, size === 'square' ? 36 : 28)],
      }),
      container({
        style: { display: 'flex', flexDirection: 'row', gap: 40, flexGrow: 1, minHeight: 0, width: '100%' },
        children: halves.map((column) => shareResultsGrid(
          column.flatMap((cluster, clusterIndex) => [
            ...(useHeadings
              ? [container({
                  style: {
                    gridColumn: '1 / 4',
                    paddingTop: size === 'square' || clusterIndex === 0 ? 0 : 10,
                  },
                  children: [
                    text(cluster.heading.toUpperCase(), {
                      color: cluster.accent,
                      fontFamily: 'Barlow Condensed',
                      fontSize: headingSize,
                      fontWeight: 700,
                      letterSpacing: '0.16em',
                      textTransform: 'uppercase',
                    }),
                  ],
                })]
              : []),
            ...cluster.lines.flatMap((line) => shareFixtureCells(line, fontSize)),
          ]),
          fontSize,
          size === 'square',
        )),
      }),
    ],
  })
}

export function groupsNode(card: ShareGroupsCard, size: ShareSize): Node {
  const cols = size === 'square' ? 2 : 4
  const rows: ShareGroupsCard['groups'][] = []
  for (let index = 0; index < card.groups.length; index += cols) {
    rows.push(card.groups.slice(index, index + cols))
  }
  return container({
    style: {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: COLORS.navy,
      padding: size === 'square' ? 40 : 32,
      gap: 16,
    },
    children: [
      container({
        style: { display: 'flex', flexDirection: 'column', gap: 6 },
        children: [kicker(card.kicker), title(card.title, size === 'square' ? 32 : 26)],
      }),
      ...rows.map((row) => container({
        style: { display: 'flex', flexDirection: 'row', gap: 16, flexGrow: 1 },
        children: row.map((group) => container({
          style: {
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            flexGrow: 1,
            backgroundColor: COLORS.panel,
            padding: 12,
          },
          children: [
            text(`Group ${group.group}`, {
              color: GROUP_COLORS[group.group] ?? COLORS.cyan,
              fontFamily: 'Barlow Condensed',
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }),
            ...group.rows.map((standing) => container({
              style: { display: 'flex', flexDirection: 'row', justifyContent: 'space-between' },
              children: [
                text(`${standing.position}  ${standing.name}`, {
                  color: COLORS.white,
                  fontFamily: 'Barlow Condensed',
                  fontSize: size === 'square' ? 18 : 14,
                }),
                text(String(standing.points), {
                  color: COLORS.star,
                  fontFamily: 'Barlow Condensed',
                  fontSize: size === 'square' ? 18 : 14,
                  fontWeight: 700,
                }),
              ],
            })),
          ],
        })),
      })),
    ],
  })
}

function leagueCell(label: string, opts: { color?: string, align?: 'left' | 'right' | 'center', size?: number, weight?: 600 | 700 }) {
  return text(label, {
    color: opts.color ?? COLORS.white,
    fontFamily: 'Barlow Condensed',
    fontSize: opts.size ?? 15,
    fontWeight: opts.weight ?? 600,
    textAlign: opts.align ?? 'left',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  })
}

export function leagueNode(card: ShareLeagueCard): Node {
  const header = [
    leagueCell('#', { color: COLORS.silver, size: 12, weight: 700 }),
    leagueCell('Manager', { color: COLORS.silver, size: 12, weight: 700 }),
    leagueCell('C', { color: COLORS.silver, size: 12, weight: 700 }),
    leagueCell('In', { color: COLORS.silver, size: 12, weight: 700 }),
    leagueCell('Out', { color: COLORS.silver, size: 12, weight: 700 }),
    leagueCell('FT', { color: COLORS.silver, size: 12, weight: 700, align: 'right' }),
    leagueCell('Hit', { color: COLORS.silver, size: 12, weight: 700, align: 'right' }),
    leagueCell('GW', { color: COLORS.silver, size: 12, weight: 700, align: 'right' }),
    leagueCell('Tot', { color: COLORS.silver, size: 12, weight: 700, align: 'right' }),
  ]
  const gridColumns = '36px minmax(0, 1.2fr) 88px minmax(0, 1fr) minmax(0, 1fr) 36px 40px 44px 48px'
  return container({
    style: {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: COLORS.navy,
      padding: 28,
      gap: 16,
    },
    children: [
      container({
        style: { display: 'flex', flexDirection: 'column', gap: 4 },
        children: [kicker(card.kicker), title(card.title, 28)],
      }),
      container({
        style: {
          display: 'grid',
          gridTemplateColumns: gridColumns,
          columnGap: 8,
          rowGap: 6,
          alignItems: 'center',
          width: '100%',
        },
        children: [
          ...header,
          ...card.rows.flatMap((row) => {
            const color = row.inUcl ? COLORS.star : COLORS.white
            return [
              leagueCell(String(row.rank), { color: COLORS.silver, align: 'left' }),
              container({
                style: { display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' },
                children: [
                  leagueCell(row.name, { color, size: 16 }),
                  ...(row.chip
                    ? [leagueCell(row.chip, { color: COLORS.cyan, size: 11, weight: 700 })]
                    : []),
                ],
              }),
              leagueCell(row.captain, { color: COLORS.white }),
              leagueCell(row.transfersIn, { color: COLORS.silver }),
              leagueCell(row.transfersOut, { color: COLORS.silver }),
              leagueCell(row.freeTransfers, { color: COLORS.white, align: 'right' }),
              leagueCell(row.transferCost, { color: row.transferCost !== '0' && row.transferCost !== '–' ? COLORS.star : COLORS.silver, align: 'right' }),
              leagueCell(row.eventTotal, { color: COLORS.white, align: 'right' }),
              leagueCell(row.total, { color: COLORS.star, align: 'right', weight: 700 }),
            ]
          }),
        ],
      }),
    ],
  })
}

export async function renderSharePng(node: Node, size: ShareSize | { width: number, height: number }) {
  const renderer = await getRenderer()
  const { width, height } = typeof size === 'string' ? shareDimensions(size) : size
  return renderer.render(node, { width, height, format: 'png' })
}

export function parseShareSize(value: unknown): ShareSize {
  return value === 'square' ? 'square' : 'og'
}
