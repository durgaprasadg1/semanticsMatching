// Producer side of the re-embed job queue. Consumer lives in rag-service
// (not built yet) — until then this just no-ops if Redis isn't configured,
// per the "editor must never block on RAG availability" requirement.
//
// NOTE (see requirement.md §4.2): using a plain Redis Stream (XADD) here
// instead of full BullMQ, since jobs need to be consumed from Python and
// a stream is trivial to speak from both languages.
import Redis from "ioredis";

const STREAM_KEY = "notegraph:reembed";

export async function enqueueReembedJob(fileId: string, userId: string): Promise<void> {
  if (!process.env.REDIS_URL) return; // no-op until rag-service exists

  const redis = new Redis(process.env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 });
  try {
    await redis.xadd(STREAM_KEY, "*", "file_id", fileId, "user_id", userId);
  } catch {
    // Never let a queue failure block the save request.
  } finally {
    redis.disconnect();
  }
}
