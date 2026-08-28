import type { FplEventState, MatchdayMap } from '../types/competition'

export function nextDeadlineEvent(events: FplEventState[], now = Date.now()) {
  return events
    .filter((event) => event.deadlineTime && new Date(event.deadlineTime).getTime() > now)
    .sort((left, right) => new Date(left.deadlineTime!).getTime() - new Date(right.deadlineTime!).getTime())[0]
}

export function currentLiveEvent(events: FplEventState[]) {
  return events.find((event) => event.isCurrent && !event.finished)
}

const MIN_CLAMPED_TTL_SECONDS = 60

/**
 * Cache entries keyed on the current gameweek must not outlive the next
 * gameweek's deadline: once it passes, "current" changes and long TTLs
 * (e.g. 12h after data check) would keep serving the previous gameweek.
 * Returns a short TTL if that deadline has already passed.
 */
export function clampTtlToNextDeadline(
  events: FplEventState[],
  currentGameweek: number,
  baseSeconds: number,
  now = Date.now(),
) {
  const next = events.find((event) => event.id === currentGameweek + 1)
  if (!next?.deadlineTime) return baseSeconds
  const untilDeadline = Math.ceil((Date.parse(next.deadlineTime) - now) / 1000)
  return Math.max(MIN_CLAMPED_TTL_SECONDS, Math.min(baseSeconds, untilDeadline))
}

export function countdownParts(totalMs: number) {
  const clamped = Math.max(0, totalMs)
  const totalSeconds = Math.floor(clamped / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return { days, hours, minutes, seconds, totalMs: clamped }
}

export function matchdayForEvent(eventsLabel: FplEventState | undefined, matchdays: MatchdayMap[]) {
  if (!eventsLabel) return undefined
  return matchdays.find((entry) => entry.fplGameweek === eventsLabel.id)
}
