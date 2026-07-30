const CACHE_MS = 10 * 60 * 1000;
let cache = { at: 0, names: null };

function parseEnvList(value = '') {
  return new Set(value.split(',').map((x) => x.trim()).filter(Boolean));
}

export async function getRoomEmotes(staticNames = []) {
  const now = Date.now();
  if (cache.names && now - cache.at < CACHE_MS) return cache.names;

  const envNames = parseEnvList(process.env.SEVENTV_EMOTES || '');
  if (envNames.size) {
    cache = { at: now, names: envNames };
    return envNames;
  }

  const setId = process.env.SEVENTV_EMOTE_SET_ID;
  if (setId) {
    try {
      const response = await fetch(`https://7tv.io/v3/emote-sets/${encodeURIComponent(setId)}`, {
        headers: { 'user-agent': 'sro-8ball-oracle/1.2' },
        signal: AbortSignal.timeout(1800)
      });
      if (response.ok) {
        const body = await response.json();
        const names = new Set((body.emotes || []).map((entry) => entry?.name).filter(Boolean));
        if (names.size) {
          cache = { at: now, names };
          return names;
        }
      }
    } catch {
      // Keep serving from the bundled room list when 7TV is unavailable.
    }
  }

  const fallback = new Set(staticNames);
  cache = { at: now, names: fallback };
  return fallback;
}
