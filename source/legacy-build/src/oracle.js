const responses = require('../data/responses.json');
const { routeQuestion } = require('./router');
const { MemoryStore } = require('./memory-store');
const { stableHash, normalize, clampText } = require('./text');
const { hasEmoteEnding } = require('./seventv');

const store = new MemoryStore();
const CHAOS_LANES = ['fallback_nonsense', 'fallback_reaction', 'nonsense', 'emote_reaction'];
const FALLBACK_LANES = ['fallback_prediction', 'fallback_permission', 'fallback_why', 'fallback_when', 'fallback_comparison', 'fallback_identity', 'fallback_social', 'fallback_life'];

function seededPick(items, seed) {
  if (!items.length) return null;
  return items[stableHash(String(seed)) % items.length];
}

function shouldUseChaos(question, user) {
  const raw = `${user}|${normalize(question)}|${Math.floor(Date.now() / 60000)}`;
  return stableHash(raw) % 10 === 0;
}

function emoteQuotaPref(history) {
  const window = history.window || [];
  const emotes = window.filter(x => x.usedEmote).length;
  const total = window.length || 0;
  if (total < 20) return emotes < Math.ceil((total + 1) / 2);
  return emotes < 10;
}

function buildPool(lane, preferEmote, includeEmotes) {
  const bank = responses.lanes[lane] || responses.lanes.fallback_prediction;
  const primary = preferEmote && includeEmotes ? bank.emote : bank.plain;
  const secondary = preferEmote && includeEmotes ? bank.plain : bank.emote;
  return [...(primary || []), ...((includeEmotes ? secondary : []) || [])];
}

async function filterEmoteAvailability(pool) {
  const checked = [];
  for (const text of pool) {
    const maybeEmote = /\b[A-Za-z][A-Za-z0-9_]*$/.test(text) && /\b(NODDERS|KEKL|Aware|HUH|CAUGHT|NOPERS|NoThanks|AINTNOWAY|Susge|modCheck|RIPBOZO|Deadge|ICANT|MYEYES|SkillIssue|HOPIUM|COPIUM|BOOMWADDUP|LETHIMCOOK|WICKED|GIGACHAD|lookUp|Wp|xxd|Saddies|KEKbald|Clueless)\b$/.test(text);
    if (!maybeEmote || await hasEmoteEnding(text)) checked.push(text);
  }
  return checked;
}

function scoreCandidate(text, index, history, seed) {
  let score = 1000 - index;
  if (history.laneRecent.includes(text)) score -= 600;
  if (history.userRecent.includes(text)) score -= 450;
  if (history.globalRecent.includes(text)) score -= 200;
  score += stableHash(`${seed}|${text}`) % 97;
  return score;
}

async function ask(question, options = {}) {
  const user = options.user || 'anon';
  const debug = !!options.debug;
  const normalized = normalize(question);
  const questionKey = String(stableHash(normalized.toLowerCase()));

  let route = routeQuestion(normalized);
  if (!normalized) route = { lane: 'bot_commands', confidence: 1, hits: [] };
  const chaos = normalized && shouldUseChaos(normalized, user);
  if (chaos && route.confidence < 1) {
    route = { ...route, originalLane: route.lane, lane: seededPick(CHAOS_LANES, `${normalized}|chaos`) || route.lane, chaos: true };
  }

  let history = store.recentFor(user, route.lane);
  if (history.lastQuestions.includes(questionKey)) {
    route = { ...route, originalLane: route.lane, lane: 'bot_repeat', repeat: true };
    history = store.recentFor(user, route.lane);
  }

  const preferEmote = emoteQuotaPref(history);
  const includeEmotes = options.includeEmotes !== false;
  let pool = buildPool(route.lane, preferEmote, includeEmotes);
  pool = await filterEmoteAvailability(pool);
  if (!pool.length && route.lane !== 'fallback_prediction') pool = buildPool('fallback_prediction', preferEmote, includeEmotes);
  if (!pool.length) pool = FALLBACK_LANES.flatMap(l => buildPool(l, false, false));

  const shuffled = pool
    .map((text, index) => ({ text, score: scoreCandidate(text, index, history, `${user}|${normalized}|${route.lane}`) }))
    .sort((a, b) => b.score - a.score);

  const selected = shuffled[0]?.text || 'UNCLEAR — the oracle failed safely.';
  const usedEmote = await hasEmoteEnding(selected);
  store.remember({ user, lane: route.lane, response: selected, questionKey, usedEmote });

  const answer = clampText(selected, Number(process.env.NIGHTBOT_MAX_CHARS || 390));
  if (!debug) return answer;
  return {
    answer,
    lane: route.lane,
    originalLane: route.originalLane || null,
    confidence: route.confidence,
    chaos: !!route.chaos,
    repeat: !!route.repeat,
    preferEmote,
    usedEmote,
    poolSize: pool.length,
    meta: responses.meta
  };
}

module.exports = { ask, routeQuestion };
