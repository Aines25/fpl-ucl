export interface Timed<T> {
  at: number
  data: T
}

const SHARED_CACHE_PREFIX = 'https://fpl-ucl.internal/cache/'

export function isFresh<T>(entry: Timed<T> | null | undefined, ttlMs: number) {
  return Boolean(entry && Date.now() - entry.at < ttlMs)
}

function sharedCacheStore(): Cache | null {
  try {
    const stores = (globalThis as { caches?: { default?: Cache } }).caches
    return stores?.default ?? null
  }
  catch {
    return null
  }
}

export async function readSharedCache<T>(key: string): Promise<Timed<T> | null> {
  const cache = sharedCacheStore()
  if (!cache) return null
  try {
    const response = await cache.match(new Request(SHARED_CACHE_PREFIX + key))
    if (!response) return null
    return await response.json() as Timed<T>
  }
  catch {
    return null
  }
}

export async function writeSharedCache<T>(key: string, data: T, persistSeconds = 60 * 60) {
  const cache = sharedCacheStore()
  if (!cache) return
  try {
    const body: Timed<T> = { at: Date.now(), data }
    await cache.put(
      new Request(SHARED_CACHE_PREFIX + key),
      new Response(JSON.stringify(body), {
        headers: {
          'content-type': 'application/json',
          'cache-control': `public, max-age=${persistSeconds}`,
        },
      }),
    )
  }
  catch {
    // Isolate memory cache still applies if the Cache API rejects the write.
  }
}
