/**
 * Simple in-memory cache for analytics data.
 * Each user gets their own cached result with a TTL.
 */

interface CacheEntry {
  data: any;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function getAnalyticsCache(userId: string): any | null {
  const entry = cache.get(userId);
  if (!entry) return null;

  if (Date.now() - entry.timestamp > DEFAULT_TTL_MS) {
    cache.delete(userId);
    return null;
  }

  return entry.data;
}

export function setAnalyticsCache(userId: string, data: any): void {
  cache.set(userId, {
    data,
    timestamp: Date.now(),
  });
}

export function invalidateAnalyticsCache(userId: string): void {
  cache.delete(userId);
}

export function clearAllAnalyticsCache(): void {
  cache.clear();
}
