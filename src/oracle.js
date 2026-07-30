import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadViewer, saveViewer, recordInteraction, viewerStoreMode } from './viewer-store.js';
import { getRoomEmotes, sevenTvStatus } from './seventv.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../data');
const read = (name) => JSON.parse(fs.readFileSync(path.join(DATA_DIR, name), 'utf8'));

const highPriorityRoutes = read('high-priority-routes.json');
const legacyRoutes = read('smart-responses.json');
const legacyFallbacks = read('legacy-fallbacks.json');
const emoteConfig = read('emotes.json');
const championKnowledge = read('champions.json');
const loreMap = read('lore-map.json');
const roomHumor = read('room-humor.json');
const referenceBank = read('reference-fragments.json');
const packageMeta = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf8'));

const CHAMPION_INDEX = championKnowledge.flatMap((champ) => champ.names.map((name) => ({ name, champ }))).sort((a, b) => b.name.length - a.name.length);
const LORE_INDEX = Object.entries(loreMap.entities || {}).flatMap(([id, entity]) => (entity.aliases || []).map((alias) => ({ id, alias, entity }))).sort((a, b) => b.alias.length - a.alias.length);

const KNOWN_EMOTES = [...(emoteConfig.approvedRoomEmotes || []), ...(emoteConfig.legacyEmbeddedEmotes || [])];
const EMOTE_RE = new RegExp(`\\b(?:${KNOWN_EMOTES.map((x) => x.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')).join('|')})\\b`);
const ACTIVE_TEMPORARY_MOTIFS = (roomHumor.temporaryMotifs || []).filter((motif) => motif.active);
const REFERENCE_FRAGMENTS = [
  ...(referenceBank.fragments || []),
  ...ACTIVE_TEMPORARY_MOTIFS.flatMap((motif) => (motif.lines || []).map((text, index) => ({
    id: `${motif.id}_${index}`,
    tags: motif.tags || [],
    text,
    temporary: true
  })))
];

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


function findChampion(text) {
  for (const { name, champ } of CHAMPION_INDEX) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`\\b${escaped.replace(/\\ /g, '\\s+')}\\b`, 'i').test(text)) return champ;
  }
  return null;
}

function championResponse(champ, text) {
  let lead;
  if (/\b(?:good|strong|broken|op|viable|worth|suck|bad)\b/.test(text)) lead = champ.good;
  else if (/\b(?:build|item|items|ap|ad|tank|bruiser|crit|on hit|on-hit)\b/.test(text)) lead = champ.build;
  else if (/\b(?:what|who|explain|does|do|is)\b/.test(text)) lead = `${champ.names[0][0].toUpperCase()+champ.names[0].slice(1)} is ${champ.role}: ${champ.identity}.`;
  else lead = chooseResponse(champ.roasts);
  if (Math.random() < 0.58) return `${lead} ${chooseResponse(champ.roasts)}`;
  return lead;
}

function questionShape(text) {
  if (/\bwhy\b/.test(text)) return 'why';
  if (/\bwhen|how long|what time\b/.test(text)) return 'when';
  if (/\bshould|can|could|may\b/.test(text)) return 'permission';
  if (/\bwho|what is|what are\b/.test(text)) return 'identity';
  if (/\bwill|does|do|is|are|can\b/.test(text) || text.endsWith('?')) return 'prediction';
  return 'reaction';
}

function findLoreTargets(text) {
  const found = [];
  for (const entry of LORE_INDEX) {
    const escaped = entry.alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\ /g, '\\s+');
    if (new RegExp(`\\b${escaped}\\b`, 'i').test(text) && !found.some((x) => x.id === entry.id)) found.push(entry);
  }
  return found;
}

function resolvePronouns(text, profile) {
  const refersBack = /\b(?:he|him|his|she|her|hers|they|them|their|that person|this one)\b/.test(text);
  if (!refersBack) return text;
  if (text.split(/\s+/).length > 12) return text;
  const last = profile?.interactions?.at(-1);
  if (!last || Date.now() - last.at > 1000 * 60 * 20) return text;
  const context = [...(last.targets || [])];
  return context.length ? `${text} ${context.join(' ')}` : text;
}

function classifyIntent(text, targets = []) {
  if (/^(?:prove it|proof|show me|receipts|source|still|again|you sure|are you sure|what about me|and me|how about me)/.test(text)) return 'challenge';
  if (/\b(?:smarter|better|worse|stronger|more|less)\s+than\b|\bwho is (?:better|worse|smarter)\b/.test(text)) return 'comparison';
  if (/\b(?:8 ?ball|bot|oracle|you)\b.*\b(?:suck|stupid|dumb|broken|die|delete|over 400|original)\b/.test(text)) return 'botbait';
  if (targets.length || /\b(?:like|love|hate|trust|date|marry|cute|hot|friend)\b/.test(text)) return 'social';
  if (/\b(?:winnable|winning|losing|doomed|back in it|throw|lead|game|teamfight|ff|surrender)\b/.test(text)) return 'game';
  if (/\b(?:build|item|champion|lane|top|jungle|mid|adc|support|baron|dragon|ward|trinket|flash|ult|cs|cannon)\b/.test(text)) return 'league';
  if (/\b(?:outside|sleep|eat|work|job|money|girlfriend|boyfriend|life)\b/.test(text)) return 'life';
  if (/\b(?:goon|cokebert|drugs|naked|single sock|testicular|balls|degenerate)\b/.test(text)) return 'nonsense';
  return 'reaction';
}

function loreResponse(targets) {
  if (!targets.length) return '';
  if (targets.length >= 2) {
    const ids = new Set(targets.map((x) => x.id));
    const relation = (loreMap.relationships || []).find((r) => r.members.every((m) => ids.has(m)));
    if (relation?.lines?.length) return chooseResponse(relation.lines);
  }
  return chooseResponse(targets[0].entity.lines || []);
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
  const best = matches[0] || null;
  const second = matches[1] || null;
  if (!best) return { route: null, score: -Infinity, margin: 0, confidence: 'none' };
  const margin = best.score - (second?.score ?? -Infinity);
  const confidence = best.route.tier >= 90 && margin >= 0 ? 'high' : best.score >= 70 && margin >= 1.5 ? 'medium' : 'low';
  return { route: best.route, score: best.score, margin, confidence };
}

function responseFamily(text) {
  const lower = text.toLowerCase();
  for (const token of ['the signs', 'the ball', 'the omen', 'chat', 'mike', 'evidence', 'vision', 'content']) {
    if (lower.includes(token)) return token;
  }
  return lower.split(/\s+/).slice(0, 3).join(' ');
}

function chooseResponse(pool) {
  if (!Array.isArray(pool) || !pool.length) return '';
  const recent = new Set(state.recentResponses.slice(-18));
  const recentFamilies = new Set(state.recentResponses.slice(-6).map(responseFamily));
  const discouraged = roomHumor.overusedFrames || [];
  const candidates = pool.map((text) => {
    let weight = 10;
    if (recent.has(text)) weight = 0;
    if (recentFamilies.has(responseFamily(text))) weight -= 4;
    if (discouraged.some((frame) => text.toLowerCase().includes(frame.toLowerCase()))) weight -= 6;
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

function fallback(intent, shape, targets = []) {
  const lore = loreResponse(targets);
  if (lore && Math.random() < 0.72) return lore;
  const pools = {
    challenge: [
      'The ruling stands. Your appeal contained no new gameplay.',
      'You came back for a rematch with a haunted endpoint.',
      'The ball has reviewed your objection and found it emotionally motivated.',
      'Ask again louder. The evidence enjoys confidence.'
    ],
    comparison: [
      'The first one wins by fewer preventable decisions.',
      'One has evidence. The other has volume.',
      'The gap is narrow, petty, and now part of room lore.',
      'Chat requested a comparison and accidentally supplied two warnings.'
    ],
    botbait: [
      'The ball survives. Your premise did not.',
      'You are beefing with an endpoint and currently losing.',
      'The oracle has logged the disrespect under predictable.',
      'Chat built a machine and immediately challenged it to fistfight.'
    ],
    social: [
      'Against better judgment, the ecosystem requires them.',
      'The room has confused repeated exposure with affection again.',
      'The chemistry is real. So is the moderator concern.',
      'This relationship has lore, no supervision, and excellent clip potential.'
    ],
    game: [
      'Winnable until Mike detects content.',
      'The lead is real. Its life expectancy is not.',
      'One clean fight from victory, one normal fight from a documentary.',
      'The game remains alive and visibly unsupervised.'
    ],
    league: [
      'Mechanically possible. Spiritually reportable.',
      'The build has damage, intent, and no adult signature.',
      'Macro objected. The hands proceeded anyway.',
      'The correct play remains available, which is concerning.'
    ],
    life: [
      'Do it before ranked becomes your primary ecosystem.',
      'The sun has issued a welfare check.',
      'Real life remains unpatched and somehow still viable.',
      'Yes. Touch grass before chat theorycrafts your personality.'
    ],
    nonsense: [
      'The premise arrived pre-cursed. I respect the efficiency.',
      'This question has been denied access to normal society.',
      'Chat has once again weaponized literacy.',
      'The ball understood that and wishes it had not.'
    ],
    why: [
      'Because somebody in this room keeps mistaking confidence for pathing.',
      'Because the minimap was decorative and accountability had ads.',
      'Because chat touched the timeline with both hands and no supervision.',
      'Because the simple path produced no content.'
    ],
    when: [
      'Soon. Mike just needs one unnecessary fight to make it content.',
      'After the next cannon falls.',
      'Three queues from now, give or take a surrender vote.',
      'Right after macro returns from its smoke break.'
    ],
    permission: [
      'Do it. Wisdom was never a moderator here.',
      'Proceed. The replay needs a villain.',
      'The path is open and visibly cursed.',
      'Yes, but keep one escape route unmuted.'
    ],
    prediction: [
      'Yeah, until Mike smells a thumbnail.',
      'Two paths: boring success or premium content. Guess which one loaded.',
      'Unclear. Ask again after the next cannon dies.',
      'Probably, which is more dangerous than a no.'
    ],
    identity: [
      'SRO chat compressed into a haunted endpoint.',
      'Part prophecy, part chat damage, fully on cooldown.',
      'A cursed billiard ball with better macro than the lobby.',
      'The replay, arriving early.'
    ],
    reaction: [
      'Chat saw it, clipped it, and somehow learned nothing.',
      'The ball sees what happened and resents the assignment.',
      'Something happened. Competence is denying involvement.',
      'The timeline accepts this under protest.'
    ]
  };
  const focused = pools[intent] || pools[shape] || pools.reaction;
  const mayUseLegacy = ['prediction', 'reaction'].includes(intent) || ['prediction', 'reaction'].includes(shape);
  return chooseResponse(mayUseLegacy ? [...focused, ...legacyFallbacks] : focused);
}

function routeTags(route, intent, response, targets) {
  const tags = new Set([intent, ...(targets || []).map((target) => target.id)]);
  const signature = `${route?.id || ''} ${response}`.toLowerCase();
  if (/vision|trinket|ward/.test(signature)) tags.add('vision');
  if (/\b(?:build|item|items|runes?)\b/.test(signature)) tags.add('build');
  if (/game_|winnable|doomed|comeback/.test(signature)) tags.add('game');
  if (/league_|champion_|build|item/.test(signature)) tags.add('league');
  if (/bot_|oracle|8ball/.test(signature)) tags.add('botbait');
  return tags;
}

function chooseTaggedFragment(tags, response) {
  const entityTags = new Set(Object.keys(loreMap.entities || {}));
  const gatedTags = new Set(['vision', 'build', 'nonsense', ...entityTags]);
  const candidates = REFERENCE_FRAGMENTS
    .map((fragment) => ({
      ...fragment,
      score: (fragment.tags || []).reduce((sum, tag) => sum + (tags.has(tag) ? 1 : 0), 0)
    }))
    .filter((fragment) => fragment.score > 0)
    .filter((fragment) => (fragment.tags || []).filter((tag) => gatedTags.has(tag)).every((tag) => tags.has(tag)))
    .filter((fragment) => !response.toLowerCase().includes(fragment.text.toLowerCase()));
  if (!candidates.length) return '';
  const best = Math.max(...candidates.map((fragment) => fragment.score));
  return chooseResponse(candidates.filter((fragment) => fragment.score === best).map((fragment) => fragment.text));
}

function cleanOneLine(text) {
  return String(text).replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
}

function limitEmbeddedEmotes(text) {
  if (Number(emoteConfig.maxPerResponse) < 1) {
    return cleanOneLine(text.replace(new RegExp(EMOTE_RE.source, 'g'), ''));
  }
  let seen = 0;
  return cleanOneLine(text.replace(new RegExp(EMOTE_RE.source, 'g'), (token) => (++seen === 1 ? token : '')));
}

function composeResponse(base, { route, intent, targets, allowReference = true }) {
  let response = cleanOneLine(base) || 'The ball declines to elaborate.';
  const targetWords = Math.max(8, Number(roomHumor.voice?.targetWords) || 18);
  const maxJokes = Math.max(0, Number(roomHumor.voice?.maxJokes) || 0);
  const tags = routeTags(route, intent, response, targets);
  if (allowReference && maxJokes > 0 && response.split(/\s+/).length < targetWords && Math.random() < 0.32) {
    const fragment = chooseTaggedFragment(tags, response);
    if (fragment) response = `${response} ${fragment}`;
  }
  return limitEmbeddedEmotes(response);
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
  if (/idiot|stupid|suck|worse|trash|cope|excuse|report/.test(s)) return 'roast';
  return route?.id?.startsWith('champion_') ? 'champion' : 'edge';
}

async function maybeEmote(route, response) {
  const category = emoteCategory(route, response);
  if (Number(emoteConfig.maxPerResponse) < 1) return { name: '', category, reason: 'disabled' };
  if (EMOTE_RE.test(response)) return { name: '', category, reason: 'already-present' };
  if (Math.random() > emoteConfig.chance) return { name: '', category, reason: 'chance' };
  if (!category) return { name: '', category: null, reason: 'no-category' };
  const available = await getRoomEmotes(emoteConfig.approvedRoomEmotes || [], emoteConfig);
  const recent = state.recentEmotes.slice(-emoteConfig.cooldown);
  const categoryPool = (emoteConfig.categories[category] || emoteConfig.categories.edge || []).filter((e) => available.has(e));
  if (!categoryPool.length) return { name: '', category, reason: 'no-available-match' };
  let pool = categoryPool.filter((e) => !recent.includes(e));
  if (!pool.length) {
    const last = state.recentEmotes.at(-1);
    pool = categoryPool.filter((e) => e !== last);
  }
  if (!pool.length) pool = categoryPool;
  return { name: pool[Math.floor(Math.random() * pool.length)], category, reason: 'selected' };
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
  const resolvedText = resolvePronouns(text, profile);
  const targets = findLoreTargets(resolvedText);
  const intent = classifyIntent(resolvedText, targets);
  const selection = selectRoute(resolvedText);
  let route = selection.route;
  let effectiveConfidence = selection.confidence;
  const champ = findChampion(resolvedText);
  if (champ && (!route || route.tier <= 72 || /^legacy_(league_state|champ_next|good_bad|why|permission|prediction)/.test(route.id))) {
    route = { id: `champion_${champ.id}`, tier: 74, emote: 'champion' };
    effectiveConfidence = 'medium';
  }
  if (effectiveConfidence === 'low' && route?.tier < 70) route = null;
  let response = route?.id?.startsWith('champion_') ? championResponse(champ, resolvedText) : route ? chooseResponse(route.responses) : fallback(intent, questionShape(resolvedText), targets);
  const callbackText = callback(profile, route, text);
  if (callbackText) {
    response = roomHumor.voice?.directAnswerFirst ? `${response} ${callbackText}` : `${callbackText} ${response}`;
  }
  response = composeResponse(response, { route, intent, targets, allowReference: !callbackText });
  const coreResponse = response;
  const emoteDecision = await maybeEmote(route, response);
  const emote = emoteDecision.name;
  if (emote) response = `${response} ${emote}`;
  response = cleanOneLine(response);
  if (response.length > 380) response = `${response.slice(0, 377).trimEnd()}...`;

  state.recentResponses.push(coreResponse);
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
      resolvedQuestion: resolvedText,
      targets: targets.map((x) => x.id),
      intent,
      route: route?.id || `fallback_${intent}`, 
      coreResponse,
      response,
      at: Date.now()
    });
    await saveViewer(profile);
  }

  const result = {
    response,
    normalized: text,
    resolved: resolvedText,
    intent,
    confidence: effectiveConfidence,
    score: Number.isFinite(selection.score) ? selection.score : null,
    margin: selection.margin,
    targets: targets.map((x) => x.id),
    stableLore: Object.fromEntries(targets.map((target) => {
      const aliases = [target.id, ...(target.entity.aliases || [])];
      const match = Object.entries(roomHumor.fixedLore || {}).find(([key]) => aliases.includes(key));
      return [target.id, match?.[1] || target.entity.traits || []];
    })),
    route: route?.id || `fallback_${intent}`, 
    emote: emote || null,
    emoteCategory: emoteDecision.category,
    emoteDecision: emoteDecision.reason,
    referenceFragment: REFERENCE_FRAGMENTS.find((fragment) => coreResponse.includes(fragment.text))?.id || null,
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
    version: packageMeta.version,
    sevenTv: sevenTvStatus(),
    bundledRoomEmotes: emoteConfig.approvedRoomEmotes.length,
    emoteChance: emoteConfig.chance,
    emoteCooldown: emoteConfig.cooldown,
    maxEmotesPerResponse: emoteConfig.maxPerResponse,
    championProfiles: championKnowledge.length,
    loreEntities: Object.keys(loreMap.entities || {}).length,
    relationshipMaps: (loreMap.relationships || []).length,
    referenceFragments: REFERENCE_FRAGMENTS.length,
    legacyFallbacks: legacyFallbacks.length,
    referenceProvenance: referenceBank.provenance,
    activeTemporaryMotifs: ACTIVE_TEMPORARY_MOTIFS.length,
    voicePolicy: roomHumor.voice,
    viewerContext: viewerStoreMode()
  };
}
