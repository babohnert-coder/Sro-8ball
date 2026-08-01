import { InMemoryStore } from './in-memory.js';
import { FileMemoryStore } from './file.js';
import { UpstashRestMemoryStore } from './upstash.js';
import { ResilientMemoryStore } from './resilient.js';

export function createMemoryStore(env = process.env) {
  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    return new ResilientMemoryStore(new UpstashRestMemoryStore({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    }));
  }
  if (env.SRO_8BALL_MEMORY_FILE) return new FileMemoryStore(env.SRO_8BALL_MEMORY_FILE);
  return new InMemoryStore();
}
export { InMemoryStore } from './in-memory.js';
export { FileMemoryStore } from './file.js';
export { UpstashRestMemoryStore } from './upstash.js';
export { ResilientMemoryStore } from './resilient.js';
