import { loadJson } from './data.js';
import { stableHash } from './text.js';

const config = loadJson('data/config/emotes.json');
const manual = loadJson('data/emotes/manual-overrides.json').overrides;
const rules = loadJson('data/emotes/name-rules.json');
const fallbackPayload = loadJson('data/emotes/fallback-inventory.json');
const compoundConfig = loadJson('data/emotes/compound-pairings.json');
const fallbackEntries = Array.isArray(fallbackPayload.entries)
  ? fallbackPayload.entries
  : (fallbackPayload.aliases ?? []).map((name) => ({ name, provider_status: 'fallback_observed_or_curated' }));

let cache = { expires: 0, inventory: null, source: 'uninitialized', error: null };

function unique(values) {
  return [...new Set((values ?? []).filter(Boolean))];
}

function normalize(value) {
  return String(value ?? '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase();
}

function seededUnit(seed) {
  return Number.parseInt(stableHash(seed), 16) / 0xffffffff;
}

function chooseUniform(items, seed) {
  if (items.length <= 1) return items[0] ?? null;
  return items[Math.min(items.length - 1, Math.floor(seededUnit(seed) * items.length))];
}

function overrideFor(alias) {
  if (manual[alias]) return manual[alias];
  const target = normalize(alias);
  const key = Object.keys(manual).find((name) => normalize(name) === target);
  return key ? manual[key] : null;
}

function parseTags(raw) {
  const tags = raw?.data?.tags ?? raw?.tags ?? [];
  return Array.isArray(tags) ? tags.map(String) : [];
}

function detectAnimated(raw) {
  if (typeof raw?.data?.animated === 'boolean') return raw.data.animated;
  if (typeof raw?.animated === 'boolean') return raw.animated;
  const files = raw?.data?.host?.files ?? raw?.host?.files ?? [];
  return files.some((file) => Number(file?.frame_count ?? file?.frames ?? 1) > 1);
}

function detectZeroWidth(raw) {
  if (typeof raw?.zero_width === 'boolean') return raw.zero_width;
  if (typeof raw?.flags?.zero_width === 'boolean') return raw.flags.zero_width;
  if (typeof raw?.data?.flags?.zero_width === 'boolean') return raw.data.flags.zero_width;
  const flags = Number(raw?.flags ?? 0);
  return Number.isFinite(flags) && (flags & 1) === 1;
}

export function classifyEmote(raw, source = '7tv') {
  const alias = String(raw?.name ?? raw?.alias ?? raw?.active_name ?? '').trim();
  const defaultName = String(raw?.data?.name ?? raw?.default_name ?? alias).trim();
  const tags = parseTags(raw);
  const haystack = normalize([alias, defaultName, ...tags].join(' '));
  const expressions = [];
  const visual = [];
  const functions = [];
  const matchedRules = [];
  let confidence = 0;
  let intensity = detectAnimated(raw) ? 0.68 : 0.45;
  let ironyOk = true;
  let hardBlocks = [];
  let targetAffinity = [];
  let pairingRoles = [];
  let sincerity = 'mixed';
  let providerHint = raw?.provider_hint ?? raw?.provider_status ?? source;

  const explicit = overrideFor(alias);
  if (explicit) {
    expressions.push(...(explicit.expressions ?? []));
    visual.push(...(explicit.visual ?? []));
    functions.push(...(explicit.functions ?? []));
    confidence = Math.max(confidence, explicit.confidence ?? 1);
    intensity = explicit.intensity ?? intensity;
    ironyOk = explicit.irony_ok ?? true;
    hardBlocks = unique(explicit.hard_blocks ?? []);
    targetAffinity = unique(explicit.target_affinity ?? []);
    pairingRoles = unique(explicit.pairing_roles ?? []);
    sincerity = explicit.sincerity ?? sincerity;
    providerHint = explicit.provider_hint ?? providerHint;
    matchedRules.push('manual_override');
  } else {
    for (const rule of rules.rules) {
      if (!new RegExp(rule.pattern, 'i').test(haystack)) continue;
      expressions.push(...(rule.expressions ?? []));
      functions.push(...(rule.functions ?? []));
      confidence = Math.max(confidence, rule.confidence ?? 0.5);
      matchedRules.push(`name_rule:${rule.pattern}`);
    }
  }

  for (const rule of rules.visual_rules) {
    if (new RegExp(rule.pattern, 'i').test(haystack)) visual.push(rule.visual);
  }

  if (/^sro/i.test(alias)) visual.push('sro_custom');
  if (/pepe|peepo|monka|prayge|poggers|nopers/i.test(haystack)) visual.push('pepe');
  if (/renek|nasus|jax|darius|garen|nidalee|ryze|morde|league|baron|dragon/i.test(haystack)) visual.push('league');

  if (!expressions.length) {
    expressions.push(config.inventory.unknown_default_expression);
    confidence = Math.max(confidence, 0.15);
    matchedRules.push('unknown_default');
  }
  if (!visual.length) visual.push(config.inventory.unknown_default_visual_family);
  if (!functions.length) functions.push(expressions.includes('hidden_nonsense') ? 'chaos_oracle' : 'general_reaction');

  const zeroWidth = detectZeroWidth(raw);
  return {
    alias,
    normalized_alias: normalize(alias),
    emote_id: String(raw?.id ?? raw?.data?.id ?? `fallback:${normalize(alias)}`),
    default_name: defaultName,
    tags,
    animated: detectAnimated(raw),
    zero_width: zeroWidth,
    standalone_ok: !zeroWidth,
    expressions: unique(expressions),
    visual_families: unique(visual),
    discourse_functions: unique(functions),
    intensity: Math.max(0, Math.min(1, intensity)),
    confidence: Math.max(0, Math.min(1, confidence)),
    irony_ok: ironyOk,
    sincerity,
    hard_blocks: hardBlocks,
    target_affinity: targetAffinity,
    pairing_roles: pairingRoles,
    provider_hint: providerHint,
    classification_source: matchedRules,
    source,
  };
}

function buildAvailableCompounds(entries) {
  const byAlias = new Map(entries.map((entry) => [entry.alias, entry]));
  return (compoundConfig.compounds ?? []).filter((compound) => compound.required_aliases.every((alias) => {
    const entry = byAlias.get(alias);
    return entry?.standalone_ok;
  })).map((compound) => ({
    ...compound,
    compound: true,
    alias: compound.output,
    normalized_alias: normalize(compound.output),
    emote_id: `compound:${compound.id}`,
    standalone_ok: true,
    expressions: unique(compound.expressions),
    discourse_functions: unique(compound.functions),
    visual_families: unique(compound.visual_families),
    intensity: compound.intensity ?? 0.6,
    confidence: compound.confidence ?? 1,
    source: 'reviewed_compound',
  }));
}

function buildInventory(rawEntries, metadata = {}) {
  const entries = rawEntries.map((entry) => classifyEmote(entry, metadata.source ?? '7tv')).filter((entry) => entry.alias);
  const activeSet = new Set(entries.map((entry) => entry.alias));
  const byExpression = {};
  const byVisual = {};
  const byFunction = {};
  for (const entry of entries) {
    for (const family of entry.expressions) (byExpression[family] ??= []).push(entry);
    for (const family of entry.visual_families) (byVisual[family] ??= []).push(entry);
    for (const fn of entry.discourse_functions) (byFunction[fn] ??= []).push(entry);
  }
  const compounds = buildAvailableCompounds(entries);
  const uncategorized = entries.filter((entry) => entry.expressions.length === 1 && entry.expressions[0] === 'hidden_nonsense');
  return {
    setId: metadata.setId ?? config.set_id,
    setName: metadata.setName ?? null,
    source: metadata.source ?? '7tv',
    fetchedAt: metadata.fetchedAt ?? new Date().toISOString(),
    entries,
    compounds,
    set: activeSet,
    byExpression,
    byVisual,
    byFunction,
    uncategorized,
    categorizedCount: entries.length - uncategorized.length,
    totalCount: entries.length,
    compoundCount: compounds.length,
    coverageRatio: entries.length ? (entries.length - uncategorized.length) / entries.length : 0,
    hash: stableHash(entries.map((entry) => `${entry.alias}:${entry.emote_id}`).sort().join('|')),
  };
}

function fallbackInventory(source = 'fallback') {
  return buildInventory(fallbackEntries, { source, setId: config.set_id });
}

function parseOverride(value) {
  return String(value ?? '').split(',').map((item) => item.trim()).filter(Boolean);
}

function parsePayload(payload) {
  const emotes = Array.isArray(payload?.emotes) ? payload.emotes
    : Array.isArray(payload?.emote_set?.emotes) ? payload.emote_set.emotes
      : [];
  return buildInventory(emotes, {
    source: '7tv',
    setId: payload?.id ?? payload?.emote_set?.id ?? config.set_id,
    setName: payload?.name ?? payload?.emote_set?.name ?? null,
    fetchedAt: new Date().toISOString(),
  });
}

export async function getActiveEmotes(env = process.env) {
  const override = parseOverride(env.SEVENTV_EMOTES);
  if (override.length) {
    const inventory = buildInventory(override.map((name) => ({ name })), { source: 'override', setId: 'override' });
    return { inventory, set: inventory.set, source: 'override', degraded: false, error: null };
  }
  if (env.DISABLE_7TV_FETCH === '1') {
    const inventory = fallbackInventory('fallback_disabled');
    return { inventory, set: inventory.set, source: 'fallback_disabled', degraded: true, error: null };
  }
  if (cache.expires > Date.now() && cache.inventory) {
    return { inventory: cache.inventory, set: cache.inventory.set, source: cache.source, degraded: cache.source !== '7tv', error: cache.error };
  }

  const setId = env.SEVENTV_SET_ID ?? config.set_id;
  const base = (env.SEVENTV_API_BASE ?? config.api_base).replace(/\/$/, '');
  const timeoutMs = Number(env.SEVENTV_FETCH_TIMEOUT_MS ?? 3500);
  try {
    const response = await fetch(`${base}/${encodeURIComponent(setId)}`, { signal: AbortSignal.timeout(timeoutMs) });
    if (!response.ok) throw new Error(`7TV HTTP ${response.status}`);
    const payload = await response.json();
    const inventory = parsePayload(payload);
    if (!inventory.totalCount) throw new Error('7TV returned no active emotes');
    cache = { expires: Date.now() + Number(env.SEVENTV_CACHE_SECONDS ?? config.cache_ttl_seconds) * 1000, inventory, source: '7tv', error: null };
  } catch (error) {
    cache = { expires: Date.now() + config.error_cache_ttl_seconds * 1000, inventory: fallbackInventory('fallback'), source: 'fallback', error: error.message };
  }
  return { inventory: cache.inventory, set: cache.inventory.set, source: cache.source, degraded: cache.source !== '7tv', error: cache.error };
}

function intersects(values, requested) {
  if (!requested?.length) return true;
  const set = new Set(values ?? []);
  return requested.some((value) => set.has(value));
}

function blockedByContext(entry, policy) {
  const tags = new Set(policy?.context_tags ?? []);
  return (entry.hard_blocks ?? []).some((block) => tags.has(block));
}

function candidateScore(entry, policy, snapshot) {
  let score = 0;
  const preferred = new Set(policy.expressions_preferred ?? []);
  const allowed = new Set(policy.expressions_any ?? []);
  const functions = new Set(policy.discourse_functions_any ?? []);
  const visual = new Set(policy.visual_families_preferred ?? []);
  score += entry.expressions.filter((value) => preferred.has(value)).length * 5;
  score += entry.expressions.filter((value) => allowed.has(value)).length * 2;
  score += entry.discourse_functions.filter((value) => functions.has(value)).length * 2;
  score += entry.visual_families.filter((value) => visual.has(value)).length;
  score += entry.confidence * 2;
  if (entry.animated && entry.intensity >= 0.7) score += 0.25;
  if ((snapshot.emoteFamilies ?? []).some((family) => entry.expressions.includes(family))) score -= 1.5;
  return score;
}

function emoteUseDecision(snapshot, seed, candidateCount, policy = {}) {
  const target = config.rolling_target;
  if (!target.enabled || candidateCount === 0) return { use: false, forced: false, reason: candidateCount ? 'target_disabled' : 'no_semantic_candidates' };
  const window = target.window_size;
  const recent = (snapshot.emoteBearingFlags ?? []).slice(-(window - 1));
  const used = recent.filter(Boolean).length;
  const effectiveWindow = Math.min(window, recent.length + 1);
  const required = Math.ceil(effectiveWindow * target.minimum_ratio);
  const maximumPlain = Number.isInteger(target.maximum_consecutive_plain_replies)
    ? target.maximum_consecutive_plain_replies
    : Number.POSITIVE_INFINITY;
  const plainStreak = [...recent].reverse().findIndex(Boolean);
  const consecutivePlain = plainStreak === -1 ? recent.length : plainStreak;
  const forcedByPlainStreak = consecutivePlain >= maximumPlain;
  const forcedByRatio = target.force_when_behind_target && used < required;
  const forced = !policy.quota_exempt && (forcedByRatio || forcedByPlainStreak);
  const roll = seededUnit(`${seed}:emote-rate:${recent.join('')}`);
  const probability = policy.base_probability_override ?? target.base_probability;
  return {
    use: forced || roll < probability,
    forced,
    forcedByRatio,
    forcedByPlainStreak,
    consecutivePlain,
    roll,
    usedBefore: used,
    requiredAfter: required,
    effectiveWindow,
    quotaExempt: Boolean(policy.quota_exempt),
    probability,
  };
}

function filterSemanticCandidates(candidates, response, policy, snapshot) {
  const serious = response.seriousness >= 3;
  const confidenceFloor = policy?.allow_hidden_nonsense
    ? config.selection.minimum_confidence_for_obscure_chaos
    : config.selection.minimum_confidence_for_normal_reply;
  let filtered = candidates.filter((entry) => {
    if (!entry.standalone_ok) return false;
    if (entry.confidence < confidenceFloor) return false;
    if (!policy?.allow_hidden_nonsense && entry.expressions.includes('hidden_nonsense')) return false;
    if (entry.intensity < (policy?.min_intensity ?? 0) || entry.intensity > (policy?.max_intensity ?? 1)) return false;
    if (!intersects(entry.expressions, policy?.expressions_any ?? [])) return false;
    if ((policy?.expressions_forbidden ?? []).some((family) => entry.expressions.includes(family))) return false;
    if (serious && entry.expressions.some((family) => ['laughter', 'hard_laughter', 'light_laughter', 'mockery', 'rage', 'tilt', 'cringe', 'childish_mockery'].includes(family))) return false;
    if (blockedByContext(entry, policy)) return false;
    const affinityContexts = entry.compound
      ? [...(policy?.target_contexts ?? []), ...(policy?.compound_roles_any ?? [])]
      : (policy?.target_contexts ?? []);
    if (entry.target_affinity?.length && !intersects(entry.target_affinity, affinityContexts)) return false;
    if (entry.compound) {
      if (response.seriousness >= (entry.blocked_seriousness ?? 2)) return false;
      if (entry.allowed_reply_moves?.length && !entry.allowed_reply_moves.includes(response.reply_move)) return false;
      if (policy?.compound_roles_any?.length && !intersects(entry.discourse_functions, policy.compound_roles_any)) return false;
    }
    return true;
  });

  const preferred = filtered.filter((entry) => intersects(entry.expressions, policy?.expressions_preferred ?? []));
  if (preferred.length) filtered = preferred;
  const functionCandidates = filtered.filter((entry) => intersects(entry.discourse_functions, policy?.discourse_functions_any ?? []));
  if (functionCandidates.length) filtered = functionCandidates;
  const recent = new Set((snapshot.emotes ?? []).slice(-config.selection.recent_exact_window));
  const fresh = filtered.filter((entry) => !recent.has(entry.alias));
  return fresh.length ? fresh : filtered;
}

export function selectEmoteForResponse({ response, policy, inventory, snapshot, seed = `${Date.now()}:${Math.random()}` }) {
  if (!inventory?.entries?.length) return { alias: null, output: null, family: null, reason: 'no_inventory', candidates: [] };
  const pinned = policy?.pinned_emote;
  if (pinned) {
    const match = inventory.entries.find((entry) => entry.alias === pinned && entry.standalone_ok);
    if (match) return { alias: match.alias, output: match.alias, tokens: [match.alias], compound: false, family: match.expressions[0] ?? null, forced: true, reason: 'pinned', candidates: [match.alias] };
  }

  const singles = filterSemanticCandidates(inventory.entries, response, policy, snapshot);
  const compounds = filterSemanticCandidates(inventory.compounds ?? [], response, policy, snapshot);
  const all = [...singles, ...compounds];
  const decision = emoteUseDecision(snapshot, seed, all.length, policy);
  if (!decision.use) return { alias: null, output: null, family: null, reason: 'rate_skip', candidates: all.map((entry) => entry.alias), ...decision };
  if (!all.length) return { alias: null, output: null, family: null, reason: 'no_semantic_candidates', candidates: [], ...decision };

  const compoundProbability = policy?.compound_preferred ? 1 : (config.selection.compound_probability ?? 0.12);
  const compoundRoll = seededUnit(`${seed}:compound:${response.id}`);
  let cohort = compounds.length && compoundRoll < compoundProbability ? compounds : singles;
  if (!cohort.length) cohort = all;

  const scored = cohort.map((entry) => ({ entry, score: candidateScore(entry, policy, snapshot) }));
  const best = Math.max(...scored.map((item) => item.score));
  const band = config.selection.candidate_score_band;
  const tier = scored.filter((item) => item.score >= best - band);
  const chosen = chooseUniform(tier, `${seed}:emote:${response.id}:${snapshot.emotes?.length ?? 0}`)?.entry ?? null;
  const family = chosen?.expressions?.find((value) => (policy.expressions_preferred ?? []).includes(value))
    ?? chosen?.expressions?.find((value) => (policy.expressions_any ?? []).includes(value))
    ?? chosen?.expressions?.[0]
    ?? null;
  return {
    alias: chosen?.alias ?? null,
    output: chosen?.alias ?? null,
    tokens: chosen?.compound ? chosen.required_aliases : (chosen ? [chosen.alias] : []),
    compound: Boolean(chosen?.compound),
    compoundId: chosen?.compound ? chosen.id : null,
    family,
    visualFamily: chosen?.visual_families?.[0] ?? null,
    reason: chosen ? (chosen.compound ? 'semantic_compound_match' : 'semantic_match') : 'no_semantic_candidates',
    candidates: tier.map((item) => item.entry.alias),
    score: chosen ? candidateScore(chosen, policy, snapshot) : null,
    compoundRoll,
    compoundProbability,
    ...decision,
  };
}

export function inspectEmoteInventory(rawEntries, metadata = {}) {
  return buildInventory(rawEntries, metadata);
}
