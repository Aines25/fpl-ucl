import { getCompetitionSnapshot, snapshotCacheControl } from '../../utils/snapshot'

export default defineEventHandler(async (event) => {
  const snapshot = await getCompetitionSnapshot()
  setHeader(event, 'cache-control', snapshotCacheControl(snapshot))
  return snapshot
})
