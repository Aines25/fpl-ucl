export function useFixtures() {
  const { snapshot } = useCompetition()
  const resultById = computed(() => new Map((snapshot.value?.results ?? []).map((result) => [result.fixtureId, result])))
  return { resultById }
}
