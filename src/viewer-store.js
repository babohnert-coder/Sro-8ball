const memory = new Map();
const MAX_INTERACTIONS = 12;
const TTL_SECONDS = 60 * 60 * 24 * 30;

function cleanUser(user = '') {
  return String(user).toLowerCase().replace(/^@/, '').replace(/[^a-z0-9_]/g, '').slice(0, 40);
}

function emptyProfile(user) {
  return {
    user,
    total: 0,
    firstSeen: Date.now(),
    lastSeen: 0,
    routeCounts: {},
    interactions: []
  };
}

function redisConfigured() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

async function redisCommand(command) {
  const base = process.env.UPSTASH_REDIS_REST_URL.replace(/\/$/, '');
  const response = await fetch(`${base}/${command.map(encodeURIComponent).join('/')}`, {
    headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` }
  });
  if (!response.ok) throw new Error(`Redis ${response.status}`);
  const body = await response.json();
  return body.result;
}

export async function loadViewer(user = '') {
  const id = cleanUser(user);
  if (!id) return null;
  if (redisConfigured()) {
    try {
      const raw = await redisCommand(['GET', `sro8ball:viewer:${id}`]);
      return raw ? JSON.parse(raw) : emptyProfile(id);
    } catch (error) {
      console.warn('viewer-store redis read failed; using memory fallback:', error.message);
    }
  }
  return structuredClone(memory.get(id) || emptyProfile(id));
}

export async function saveViewer(profile) {
  if (!profile?.user) return;
  profile.interactions = profile.interactions.slice(-MAX_INTERACTIONS);
  memory.set(profile.user, structuredClone(profile));
  if (redisConfigured()) {
    try {
      await redisCommand(['SET', `sro8ball:viewer:${profile.user}`, JSON.stringify(profile), 'EX', String(TTL_SECONDS)]);
    } catch (error) {
      console.warn('viewer-store redis write failed; memory fallback retained:', error.message);
    }
  }
}

export function recordInteraction(profile, interaction) {
  if (!profile) return null;
  profile.total += 1;
  profile.lastSeen = Date.now();
  profile.routeCounts[interaction.route] = (profile.routeCounts[interaction.route] || 0) + 1;
  profile.interactions.push(interaction);
  profile.interactions = profile.interactions.slice(-MAX_INTERACTIONS);
  return profile;
}

export function viewerStoreMode() {
  return redisConfigured() ? 'upstash-redis' : 'memory-fallback';
}
