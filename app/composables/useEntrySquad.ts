import type { MaybeRefOrGetter } from 'vue'
import { useIntervalFn } from '@vueuse/core'
import type { FplSquadView } from '../../lib/types/squad'

export function useEntrySquad(
  entryId: MaybeRefOrGetter<number | null>,
  gameweek: MaybeRefOrGetter<number>,
) {
  const { isLive } = useCompetition()

  const url = computed(() => {
    const id = toValue(entryId)
    const gw = toValue(gameweek)
    if (!id || id <= 0 || !Number.isFinite(gw) || gw < 1) return ''
    return `/api/fpl/entry/${id}/${gw}`
  })

  const { data, status, error, refresh, execute } = useFetch<FplSquadView>(url, {
    default: () => undefined,
    lazy: true,
    immediate: false,
    watch: false,
  })

  watch(url, (next) => {
    if (next) execute()
  }, { immediate: true })

  const squad = computed(() => {
    const current = data.value
    const id = toValue(entryId)
    if (!current || !id || current.fplId !== id) return undefined
    return current
  })

  const loading = computed(() => Boolean(url.value) && !squad.value && status.value !== 'error')

  if (import.meta.client) {
    const interval = useIntervalFn(() => {
      if (isLive.value && url.value) refresh()
    }, 60_000)
    onUnmounted(() => interval.pause())
  }

  return { squad, status, error, refresh, loading }
}
