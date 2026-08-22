export function useFpl() {
  const { snapshot } = useCompetition()
  function scoreFor(managerId: number, gameweek: number) {
    return snapshot.value?.scores.find((score) => score.managerId === managerId && score.gameweek === gameweek)
  }
  return { scoreFor }
}
