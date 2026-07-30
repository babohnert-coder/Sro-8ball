const CACHE_MS = 10 * 60 * 1000;
let cache = { at: 0, names: null, source: 'none', setId: null };

function parseEnvList(value = '') {
  return new Set(value.split(',').map((x) => x.trim()).filter(Boolean));
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { 'user-agent': 'sro-8ball-oracle/1.3' },
    signal: AbortSignal.timeout(2200)
  });
  if (!response.ok) throw new Error(`7TV ${response.status}`);
  return response.json();
}

function namesFromSet(body) {
  return new Set((body?.emotes || []).map((entry) => entry?.name).filter(Boolean));
}

export async function getRoomEmotes(staticNames = [], config = {}) {
  const now = Date.now();
  if (cache.names && now - cache.at < CACHE_MS) return cache.names;

  const envNames = parseEnvList(process.env.SEVENTV_EMOTES || '');
  if (envNames.size) {
    cache = { at: now, names: envNames, source: 'environment-list', setId: null };
    return envNames;
  }

  try {
    const configuredSetId = process.env.SEVENTV_EMOTE_SET_ID;
    if (configuredSetId) {
      const body = await fetchJson(`https://7tv.io/v3/emote-sets/${encodeURIComponent(configuredSetId)}`);
      const names = namesFromSet(body);
      if (names.size) {
        cache = { at: now, names, source: 'live-set-id', setId: configuredSetId };
        return names;
      }
    }

    const twitchUserId = process.env.SEVENTV_TWITCH_USER_ID || config?.liveRoomSet?.twitchUserId;
    if (twitchUserId) {
      const user = await fetchJson(`https://7tv.io/v3/users/twitch/${encodeURIComponent(twitchUserId)}`);
      const set = user?.emote_set;
      const names = namesFromSet(set);
      if (names.size) {
        cache = { at: now, names, source: 'live-twitch-channel', setId: set?.id || null };
        return names;
      }
    }
  } catch {
    // 7TV outages must never block Nightbot. Serve the curated room list instead.
  }

  const fallback = new Set(staticNames);
  cache = { at: now, names: fallback, source: 'bundled-fallback', setId: null };
  return fallback;
}

export function sevenTvStatus() {
  return {
    source: cache.source,
    setId: cache.setId,
    cachedEmotes: cache.names?.size || 0,
    liveConfigured: Boolean(
      process.env.SEVENTV_EMOTE_SET_ID ||
      process.env.SEVENTV_TWITCH_USER_ID ||
      process.env.SEVENTV_EMOTES
    )
  };
}
