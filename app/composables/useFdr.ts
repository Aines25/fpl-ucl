import type { FdrGrid } from '../../lib/types/fdr'

export function useFdr() {
  return useFetch<FdrGrid>('/api/fpl/fdr', {
    key: 'fpl-fdr',
    server: true,
    default: () => undefined,
  })
}
