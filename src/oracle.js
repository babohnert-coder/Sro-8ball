import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadViewer, saveViewer, recordInteraction, viewerStoreMode } from './viewer-store.js';
import { getRoomEmotes } from './seventv.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../data');
const read = (name) => JSON.parse(fs.readFileSync(path.join(DATA_DIR, name), 'utf8'));

const highPriorityRoutes = read('high-priority-routes.json');
const legacyRoutes = read('smart-responses.json');
const legacyFallbacks = read('legacy-fallbacks.json');
const emoteConfig = read('emotes.json');

const VERDICT = /^(?:yes|no|maybe|unclear|unlikely|inconclusive)\b/i;
const EMOTE_RE = new RegExp(`\\b(?:${emoteConfig.approvedRoomEmotes.map((x) => x.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')).join('|')})\\b`);

const TYPO_MAP = new Map([
  ['briish', 'british'], ['britsh', 'british'], ['br*tish', 'british'],
  ['winnible', 'winnable'], ['winable', 'winnable'], ['winnabel', 'winnable'],
  ['gamba', 'gambler'], ['degenerit', 'degenerate'], ['degeneret', 'degenerate'],
  ['u', 'you'], ['ur', 'your'], ['r', 'are'], ['y', 'why'],
  ['tho', 'though'], ['rn', 'right now'], ['nvm', 'never mind'],
  ['mtf', 'michaelthefan'], ['michael the fan', 'michaelthefan'],
  ['sro', 'solorenektononly']
]);

function normalize(raw = '') {
  let text = String(raw)
    .replace(/^!8ball\s*/i, '')
    .replace(/https?:\/\/\S+/gi, ' link ')
    .replace(/[“”]/g, '"')
    .replace(/[’]/g, "'")
    .replace(/@/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9_'?;.! -]+/g, ' ')
    .replace(/(.)\1{3,}/g, '$1$1')
    .replace(/\s+/g, ' ')
    .trim();

  for (const [from, to] of TYPO_MAP) {
    const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    text = text.replace(new RegExp(`\\b${escaped}\\b`, 'g'), to);
  }
  return text;
}

function compileLegacy() {
  const tierById = (id) => {
    if (/^(self_destruct|curse_torsion|bot_insult|bot_origin|bot_help_training)/.test(id)) return 84;
    if (/^(mtf_|blame_|cute_|gamba_|washed_|ban_)/.test(id)) return 78;
    if (/^(winnable|doomed|comeback|blue_trinket|vision_ward|build_troll|item_choice|champ_next|darius|kassadin_16|believing|damage_broken|engage_dive|objective|matchup|league_state)/.test(id)) return 72;
    if (/^(bones|misanthrope|copbro|john|sro|mtf|renekton|nasus)/.test(id)) return 50;
    if (/^(why|when|permission|choice|good_bad|identity|food_drink|work_money)/.test(id)) return 30;
    return id === 'g' ? -100 : 20;
  };

  return Object.entries(legacyRoutes).map(([id, spec], order) => ({
    id: `legacy_${id}`,
    tier: tierById(id),
    order,
    pattern: spec.p,
    responses: spec.r,
    emote: null
  }));
}

const allRoutes = [...highPriorityRoutes, ...compileLegacy()].map((route, order) => {
  let regex;
  try { regex = new RegExp(route.pattern, 'i'); }
  catch { regex = /$a/; }
  const signalCount = (route.pattern.match(/[a-z0-9_]{3,}/gi) || []).length;
  return { ...route, regex, order, specificity: Math.min(25, signalCount * 0.45) };
});

const state = {
  recentResponses: [],
  recentEmotes: [],
  recentRoutes: [],
  userHistory: new Map()
};

function questionShape(text) {
  if (/\bwhy\b/.test(text)) return 'why';
  if (/\bwhen|how long|what time\b/.test(text)) return 'when';
  if (/\bshould|can|could|may\b/.test(text)) return 'permission';
  if (/\bwho|what is|what are\b/.test(text)) return 'identity';
  if (/\bwill|does|do|is|are|can\b/.test(text) || text.endsWith('?')) return 'prediction';
  return 'reaction';
}

function topicalBoost(route, text) {
  let score = 0;
  if (/bot|8 ?ball|oracle|yourself|you\b/.test(text) && /^bot_/.test(route.id)) score += 18;
  if (/michaelthefan|teamplay|misanthrope|bones|john|copbro/.test(text) && /social_|mtf|misanthrope|bones|john|copbro/.test(route.id)) score += 12;
  if (/winnable|win|lose|game|build|item|trinket|ward|darius|league|baron|dragon/.test(text) && /game_|league_|vision_|legacy_(winnable|doomed|comeback|blue|vision|build|item|champ|darius|league)/.test(route.id)) score += 10;
  return score;
}

function selectRoute(text) {
  const matches = [];
  for (const route of allRoutes) {
    if (!route.pattern || route.id === 'legacy_g') continue;
    route.regex.lastIndex = 0;
    if (!route.regex.test(text)) continue;
    let score = route.tier + route.specificity + topicalBoost(route, text);
    if (state.recentRoutes.slice(-3).includes(route.id)) score -= 2;
    matches.push({ route, score });
  }
  matches.sort((a, b) => b.score - a.score || a.route.order - b.route.order);
  return matches[0]?.route || null;
}

function responseFamily(text) {
  const lower = text.toLowerCase();
  for (const token of ['the signs', 'the ball', 'the omen', 'chat', 'mike', 'evidence', 'vision', 'content']) {
    if (lower.includes(token)) return token;
  }
  return lower.split(/\s+/).slice(0, 3).join(' ');
}

function chooseResponse(pool) {
  const recent = new Set(state.recentResponses.slice(-18));
  const recentFamilies = new Set(state.recentResponses.slice(-6).map(responseFamily));
  const candidates = pool.map((text) => {
    let weight = 10;
    if (recent.has(text)) weight = 0;
    if (recentFamilies.has(responseFamily(text))) weight -= 4;
    return { text, weight: Math.max(0, weight) };
  });
  const total = candidates.reduce((sum, x) => sum + x.weight, 0);
  if (!total) return pool[Math.floor(Math.random() * pool.length)];
  let roll = Math.random() * total;
  for (const candidate of candidates) {
    roll -= candidate.weight;
    if (roll <= 0) return candidate.text;
  }
  return candidates.at(-1).text;
}

function fallback(shape) {
  const pools = {
    why: [
      'Because the signs prefer consequences to explanations.',
      'The reason is hidden behind poor vision.',
      'Because chat touched the timeline again.',
      'The omen knows why and has declined to testify.',
      'Because the simple path produced no content.'
    ],
    when: [
      'Soon, but not before one unnecessary fight.',
      'After the next cannon falls.',
      'When the signs stop laughing.',
      'Three queues from now, give or take a surrender vote.',
      'The timing is obscured by poor macro.'
    ],
    permission: [
      'The ball permits it. Wisdom has filed an objection.',
      'You may. The omen did not say you should.',
      'Proceed carefully; chat has mistaken permission for prophecy before.',
      'The path is open and visibly cursed.',
      'Yes, but keep one escape route unmuted.'
    ],
    prediction: [
      'The signs lean yes, but chat has already contaminated the reading.',
      'Maybe. The outcome is hiding behind poor vision.',
      'The ball sees two paths. Both contain unnecessary confidence.',
      'Unclear. Ask again after the next cannon dies.',
      'The omen refuses certainty while Mike retains agency.',
      'Probably, which is more dangerous than a no.'
    ],
    identity: [
      'A cursed League oracle with access to public records.',
      'Part prophecy, part chat damage, fully on cooldown.',
      'The room speaking through a green triangle.',
      'A witness with no subpoena power.',
      'The replay, arriving early.'
    ],
    reaction: [
      'The signs acknowledge this and offer no comfort.',
      'Chat has spoken. The omen remains professionally distant.',
      'The ball sees what happened and resents the assignment.',
      'A development has occurred. Wisdom was not involved.',
      'The timeline accepts this under protest.'
    ]
  };
  return chooseResponse(pools[shape] || pools.prediction);
}

function emoteCategory(route, response) {
  if (route?.emote) return route.emote;
  const s = response.toLowerCase();
  if (/ward|vision|trinket|bush/.test(s)) return 'vision';
  if (/gamb|points|odds|bankroll/.test(s)) return 'gamba';
  if (/date|cute|love|kiss|short|tall|handle me/.test(s)) return 'romance';
  if (/doomed|dead|lost|failure|cooked/.test(s)) return 'failure';
  if (/maybe|unclear|suspicious|allegation/.test(s)) return 'suspicion';
  if (/bald|dome|hair/.test(s)) return 'bald';
  if (/yes|favorable|win|back in/.test(s)) return 'approval';
  if (/league|lane|build|champ|darius|renekton|cannon|baron|dragon/.test(s)) return 'league';
  return null;
}

async function maybeEmote(route, response) {
  if (EMOTE_RE.test(response) || Math.random() > emoteConfig.chance) return '';
  const category = emoteCategory(route, response);
  if (!category) return '';
  const available = await getRoomEmotes(emoteConfig.approvedRoomEmotes || []);
  const recent = state.recentEmotes.slice(-emoteConfig.cooldown);
  const pool = (emoteConfig.categories[category] || []).filter((e) => available.has(e) && !recent.includes(e));
  if (!pool.length) return '';
  return pool[Math.floor(Math.random() * pool.length)];
}

function callback(profile, route, text) {
  if (!profile || !route) return '';
  const history = profile.interactions || [];
  const last = history.at(-1);
  const sameQuestion = [...history].reverse().find((item) => item.question === text);
  if (sameQuestion && Date.now() - sameQuestion.at < 1000 * 60 * 60 * 24) {
    const lines = [
      'The ball remembers this question.',
      'You already shook the ball on this one.',
      'Same question. The signs remain disrespectful.',
      'The second consultation has been entered into the lore.'
    ];
    return lines[Math.floor(Math.random() * lines.length)];
  }
  if (last?.route === route.id && Math.random() < 0.28) {
    const lines = [
      'Still on this?',
      'The obsession has been noted.',
      'Back to the same omen, naturally.',
      'You have returned to your specialty.'
    ];
    return lines[Math.floor(Math.random() * lines.length)];
  }
  const count = profile.routeCounts?.[route.id] || 0;
  if (count >= 3 && Math.random() < 0.12) {
    return 'The ball recognizes your usual line of inquiry.';
  }
  return '';
}

export async function answerOracle(rawQuestion, { user = '', debug = false } = {}) {
  const text = normalize(rawQuestion);
  if (!text) return debug ? { response: 'You brought the command but forgot the question.', route: 'empty' } : 'You brought the command but forgot the question.';

  const profile = await loadViewer(user);
  const route = selectRoute(text);
  let response = route ? chooseResponse(route.responses) : fallback(questionShape(text));
  const prefix = callback(profile, route, text);
  if (prefix) response = `${prefix} ${response}`;
  const emote = await maybeEmote(route, response);
  if (emote) response = `${response} ${emote}`;
  if (response.length > 380) response = `${response.slice(0, 377).trimEnd()}...`;

  state.recentResponses.push(response);
  if (state.recentResponses.length > 40) state.recentResponses.shift();
  if (emote) {
    state.recentEmotes.push(emote);
    if (state.recentEmotes.length > 20) state.recentEmotes.shift();
  }
  if (route) {
    state.recentRoutes.push(route.id);
    if (state.recentRoutes.length > 20) state.recentRoutes.shift();
  }
  if (user) state.userHistory.set(user.toLowerCase(), { route: route?.id || 'fallback', at: Date.now() });
  if (profile) {
    recordInteraction(profile, {
      question: text,
      route: route?.id || `fallback_${questionShape(text)}`,
      response,
      at: Date.now()
    });
    await saveViewer(profile);
  }

  const result = {
    response,
    normalized: text,
    route: route?.id || `fallback_${questionShape(text)}`,
    emote: emote || null,
    viewer: profile ? { total: profile.total, recent: profile.interactions.slice(-4), routeCounts: profile.routeCounts } : null
  };
  return debug ? result : response;
}

export function health() {
  return {
    ok: true,
    routes: allRoutes.length,
    highPriorityRoutes: highPriorityRoutes.length,
    legacyRoutes: Object.keys(legacyRoutes).length,
    version: '1.2.0',
    sevenTv: Boolean(process.env.SEVENTV_EMOTE_SET_ID || process.env.SEVENTV_EMOTES),
    bundledRoomEmotes: emoteConfig.approvedRoomEmotes.length,
    viewerContext: viewerStoreMode()
  };
}
