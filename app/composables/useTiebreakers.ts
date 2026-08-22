/**
 * Thin wrapper so UI never imports ranking rules directly.
 * Group ranking and knockout cup tie-breaks live in lib/engine.
 */
export { standingsForGroup } from '../../lib/engine/tiebreakers'
export { decideKnockoutWinner } from '../../lib/engine/knockout'
