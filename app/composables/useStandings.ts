export function useStandings() {
  const { snapshot } = useCompetition()
  const standings = computed(() => snapshot.value?.standings)
  return { standings }
}
