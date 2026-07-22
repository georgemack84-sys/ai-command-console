type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const cache = new Map<string, CacheEntry<unknown>>();

export async function cached<T>(key: string, ttlMs: number, load: () => Promise<T>) {
  const existing = cache.get(key);
  if (existing && existing.expiresAt > Date.now()) {
    return existing.value as T;
  }
  const value = await load();
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

export function cacheStats() {
  return {
    entries: cache.size,
    activeEntries: [...cache.values()].filter((entry) => entry.expiresAt > Date.now()).length,
  };
}
