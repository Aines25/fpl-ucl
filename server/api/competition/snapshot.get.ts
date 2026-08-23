import { getCompetitionSnapshot, snapshotCacheControl } from '../../utils/snapshot'

export default defineEventHandler(async (event) => {
  const snapshot = await getCompetitionSnapshot()
  snapshotCacheControl(event, snapshot)
  return snapshot
})
