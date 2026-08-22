import type { FplEventState, MatchdayMap } from '../types/competition'

export function nextDeadlineEvent(events: FplEventState[], now = Date.now()) {
  return events
    .filter((event) => event.deadlineTime && new Date(event.deadlineTime).getTime() > now)
    .sort((left, right) => new Date(left.deadlineTime!).getTime() - new Date(right.deadlineTime!).getTime())[0]
}

export function currentLiveEvent(events: FplEventState[]) {
  return events.find((event) => event.isCurrent && !event.finished)
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
