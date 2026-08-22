export function useKnockout() {
  const { snapshot } = useCompetition()
  const ties = computed(() => snapshot.value?.knockout ?? [])
  const drawn = computed(() => ties.value.some((tie) => tie.playerOneId && tie.playerTwoId))
  return { ties, drawn }
}
