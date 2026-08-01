const DEFAULT_SRO_TWITCH_ID = '30227322';
const FALLBACK_ACTIVE = new Set([
  'NODDERS','KEKL','Aware','HUH','CAUGHT','NOPERS','NoThanks','AINTNOWAY','Susge','modCheck','RIPBOZO','Deadge','ICANT','MYEYES','SkillIssue','HOPIUM','COPIUM','BOOMWADDUP','LETHIMCOOK','WICKED','GIGACHAD','lookUp','Wp','xxd','Saddies','KEKbald','Clueless'
]);

let cache = { at: 0, set: null };

function parseOverride() {
  const raw = process.env.SEVENTV_EMOTES || process.env.ACTIVE_EMOTES || '';
  if (!raw.trim()) return null;
  return new Set(raw.split(',').map(x => x.trim()).filter(Boolean));
}

function lastToken(text) {
  const m = String(text || '').trim().match(/\b[A-Za-z][A-Za-z0-9_]*$/);
  return m ? m[0] : '';
}

async function getActiveEmotes() {
  const override = parseOverride();
  if (override) return override;
  const ttl = 10 * 60 * 1000;
  if (cache.set && Date.now() - cache.at < ttl) return cache.set;
  if (process.env.DISABLE_7TV_FETCH === '1' || typeof fetch !== 'function') {
    cache = { at: Date.now(), set: FALLBACK_ACTIVE };
    return cache.set;
  }
  try {
    const twitchId = process.env.SRO_TWITCH_ID || DEFAULT_SRO_TWITCH_ID;
    const res = await fetch(`https://7tv.io/v3/users/twitch/${encodeURIComponent(twitchId)}`, { signal: AbortSignal.timeout(1500) });
    if (!res.ok) throw new Error(`7TV ${res.status}`);
    const body = await res.json();
    const names = [];
    for (const e of body?.emote_set?.emotes || []) {
      if (e?.name) names.push(e.name);
    }
    cache = { at: Date.now(), set: new Set(names.length ? names : FALLBACK_ACTIVE) };
    return cache.set;
  } catch (_) {
    cache = { at: Date.now(), set: FALLBACK_ACTIVE };
    return cache.set;
  }
}

async function hasEmoteEnding(text) {
  const token = lastToken(text);
  if (!token) return false;
  const active = await getActiveEmotes();
  return active.has(token);
}

module.exports = { getActiveEmotes, hasEmoteEnding, lastToken };
