// Thin Redis wrapper. Redis is a cache, not a source of truth — every function
// here fails soft (returns null / no-ops) if REDIS_URL isn't set or the
// connection drops, so the app always works with Supabase alone.
import Redis from "ioredis";

let client: Redis | null = null;
let triedInit = false;

function getClient(): Redis | null {
  if (!triedInit) {
    triedInit = true;
    if (process.env.REDIS_URL) {
      client = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 1,
        lazyConnect: true,
      });
      client.on("error", () => {
        // Swallow — callers treat cache misses/errors the same way.
      });
    }
  }
  return client;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getClient();
  if (!redis) return null;
  try {
    const raw = await redis.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 60): Promise<void> {
  const redis = getClient();
  if (!redis) return;
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    // ignore
  }
}

export async function cacheDel(key: string): Promise<void> {
  const redis = getClient();
  if (!redis) return;
  try {
    await redis.del(key);
  } catch {
    // ignore
  }
}
