import { loadRuntimeData } from '../data.js';
import { stableHash } from '../text.js';
import { getEligibleResponses } from './eligibility.js';
import { scoreEligibleResponse } from './scoring.js';
import { resolveEmotePolicy } from '../emote-policy.js';
import { selectEmoteForResponse } from '../emotes.js';
import { formStance, stanceCohort } from '../brain.js';

function seededUnit(seed) {
  return Number.parseInt(stableHash(seed), 16) / 0xffffffff;
}

function chooseUniform(candidates, seed) {
  if (candidates.length === 1) return candidates[0];
  const index = Math.min(candidates.length - 1, Math.floor(seededUnit(seed) * candidates.length));
  return candidates[index];
}

export function buildRouteKey(bundle) {
  const primaryDomain = bundle.domains[0]?.label ?? 'general_oracle';
  const family = bundle.route_family ?? `domain:${primaryDomain}`;
  return [bundle.intent.label, family].join(':');
}

function fallbackFilter(bundle, responses, level) {
  if (level === 'same_intent_broad_domain') {
    return responses.filter((response) => response.intents.includes(bundle.intent.label)
      && response.domains_any.some((domain) => bundle.domains.some((bundleDomain) => bundleDomain.label === domain))
      && response.delivery !== 'chaos'
      && response.sro_intensity === 0
      && response.league_intensity <= 1);
  }
  if (level === 'same_intent_general_oracle') {
    return responses.filter((response) => response.intents.includes(bundle.intent.label)
      && response.domains_any.includes('general_oracle')
      && response.delivery !== 'chaos');
  }
  if (level === 'safe_classic_direct') {
    return responses.filter((response) => ['classic', 'direct'].includes(response.delivery)
      && response.sro_intensity === 0
      && response.league_intensity === 0);
  }
  return [];
}

function lastIndex(array, value) {
  return array.lastIndexOf(value);
}

function exactRecencyBurden(array, value, weight) {
  const index = lastIndex(array, value);
  if (index < 0) return 0;
  const age = array.length - 1 - index;
  return Math.max(1, weight - age);
}

function familyRecencyBurden(array, value, weight) {
  if (!value) return 0;
  return exactRecencyBurden(array, value, weight);
}

function varietyBurden(response, snapshot) {
  let burden = 0;
  burden += exactRecencyBurden(snapshot.pathResponseIds ?? [], response.id, 80);
  burden += exactRecencyBurden(snapshot.userResponseIds ?? [], response.id, 60);
  burden += exactRecencyBurden(snapshot.globalResponseIds ?? [], response.id, 25);
  burden += familyRecencyBurden(snapshot.semanticFamilies ?? [], response.semantic_family, 14);
  burden += familyRecencyBurden(snapshot.openingFamilies ?? [], response.opening_family, 7);
  burden += familyRecencyBurden(snapshot.syntaxFamilies ?? [], response.syntax_family, 5);
  burden += familyRecencyBurden(snapshot.replyMoves ?? [], response.reply_move, 8);
  burden += familyRecencyBurden(snapshot.twistFamilies ?? [], response.twist_family, 8);
  burden += familyRecencyBurden(snapshot.targetFamilies ?? [], response.target_family, 5);
  burden += familyRecencyBurden(snapshot.payoffFamilies ?? [], response.payoff_family, 6);
  burden += familyRecencyBurden(snapshot.deliveryModes ?? [], response.delivery, 4);
  if ((response.concepts_any ?? []).some((concept) => (snapshot.conceptFamilies ?? []).includes(concept))) burden += 3;
  if (response.emote && (snapshot.emotes ?? []).includes(response.emote)) burden += 8;
  return burden;
}

function removeImmediateRepeats(candidates, snapshot) {
  if (candidates.length <= 1) return candidates;
  const blocked = new Set([
    snapshot.pathResponseIds?.at(-1),
    snapshot.userResponseIds?.at(-1),
    snapshot.globalResponseIds?.at(-1),
  ].filter(Boolean));
  const fresh = candidates.filter((candidate) => !blocked.has(candidate.response.id));
  return fresh.length ? fresh : candidates;
}

function removeRecentExactRepeats(candidates, snapshot) {
  if (candidates.length <= 1) return candidates;
  const blocked = new Set([
    ...(snapshot.userResponseIds ?? []),
    ...(snapshot.globalResponseIds ?? []),
  ]);
  const fresh = candidates.filter((candidate) => !blocked.has(candidate.response.id));
  return fresh.length ? fresh : removeImmediateRepeats(candidates, snapshot);
}

function pathCycleCohort(candidates, snapshot) {
  if (candidates.length <= 1) return { candidates, cycleReset: false, usedInCycle: [] };
  const candidateIds = new Set(candidates.map((candidate) => candidate.response.id));
  const used = new Set();

  // Walk backward through this exact route. A duplicate marks the prior cycle.
  for (let index = (snapshot.pathResponseIds ?? []).length - 1; index >= 0; index -= 1) {
    const id = snapshot.pathResponseIds[index];
    if (!candidateIds.has(id)) continue;
    if (used.has(id)) break;
    used.add(id);
    if (used.size === candidateIds.size) break;
  }

  const unused = candidates.filter((candidate) => !used.has(candidate.response.id));
  if (unused.length) return { candidates: unused, cycleReset: false, usedInCycle: [...used] };

  // Every answer in this route pool has appeared once. Start a new cycle, but do not
  // immediately repeat the line that ended the prior cycle when alternatives exist.
  return {
    candidates: removeImmediateRepeats(candidates, snapshot),
    cycleReset: true,
    usedInCycle: [...used],
  };
}

function grammarFreshnessCohort(candidates, snapshot, responses, selectionConfig) {
  if (candidates.length <= 1) return { candidates, freshnessTierCount: candidates.length, bestFreshness: 0, freshness: [] };
  const cfg = selectionConfig.humor_grammar_freshness ?? {};
  const byId = new Map(responses.map((response) => [response.id, response]));
  const recentPath = (snapshot.pathResponseIds ?? []).map((id) => byId.get(id)).filter(Boolean);

  const recentSets = {
    reply_move: {
      path: new Set(recentPath.slice(-(cfg.path_reply_move_window ?? 4)).map((response) => response.reply_move)),
      global: new Set((snapshot.replyMoves ?? []).slice(-(cfg.global_reply_move_window ?? 6))),
    },
    twist_family: {
      path: new Set(recentPath.slice(-(cfg.path_twist_family_window ?? 4)).map((response) => response.twist_family)),
      global: new Set((snapshot.twistFamilies ?? []).slice(-(cfg.global_twist_family_window ?? 6))),
    },
    target_family: {
      path: new Set(recentPath.slice(-(cfg.path_target_family_window ?? 3)).map((response) => response.target_family)),
      global: new Set((snapshot.targetFamilies ?? []).slice(-(cfg.global_target_family_window ?? 4))),
    },
    payoff_family: {
      path: new Set(recentPath.slice(-(cfg.path_payoff_family_window ?? 3)).map((response) => response.payoff_family)),
      global: new Set((snapshot.payoffFamilies ?? []).slice(-(cfg.global_payoff_family_window ?? 5))),
    },
  };

  const freshness = candidates.map((candidate) => {
    let score = 0;
    const detail = {};
    for (const field of Object.keys(recentSets)) {
      const value = candidate.response[field];
      const pathFresh = !recentSets[field].path.has(value);
      const globalFresh = !recentSets[field].global.has(value);
      const points = (pathFresh ? 2 : 0) + (globalFresh ? 1 : 0);
      detail[field] = { value, pathFresh, globalFresh, points };
      score += points;
    }
    return { candidate, score, detail };
  });
  const bestFreshness = Math.max(...freshness.map((item) => item.score));
  const tier = freshness.filter((item) => item.score === bestFreshness).map((item) => item.candidate);
  return { candidates: tier.length ? tier : candidates, freshnessTierCount: tier.length, bestFreshness, freshness };
}

function immediateFreshnessCohort(candidates, snapshot) {
  if (candidates.length <= 1) return { candidates, applied: [], relaxed: [] };
  const guards = [
    ['semantic_family', snapshot.semanticFamilies?.at(-1)],
    ['opening_family', snapshot.openingFamilies?.at(-1)],
    ['reply_move', snapshot.replyMoves?.at(-1)],
    ['twist_family', snapshot.twistFamilies?.at(-1)],
    ['target_family', snapshot.targetFamilies?.at(-1)],
    ['payoff_family', snapshot.payoffFamilies?.at(-1)],
  ];
  let cohort = candidates;
  const applied = [];
  const relaxed = [];
  for (const [field, previous] of guards) {
    if (!previous) continue;
    const fresh = cohort.filter((candidate) => candidate.response[field] !== previous);
    if (fresh.length) {
      cohort = fresh;
      applied.push(field);
    } else {
      relaxed.push(field);
    }
  }
  return { candidates: cohort, applied, relaxed };
}

function responseMatchTier(response, bundle) {
  const concepts = new Set(bundle.concepts.map((item) => item.label));
  const entities = new Set(bundle.entities.filter((item) => item.resolution_status === 'verified').map((item) => item.value));
  const domains = new Set(bundle.domains.map((item) => item.label));
  const conceptAll = (response.concepts_all ?? []).filter((item) => concepts.has(item)).length;
  const conceptAny = (response.concepts_any ?? []).filter((item) => concepts.has(item)).length;
  const entityRequired = (response.entities_required ?? []).filter((item) => entities.has(item)).length;
  const entityPreferred = (response.entities_preferred ?? []).filter((item) => entities.has(item)).length;
  const domainSpecific = (response.domains_any ?? []).some((item) => item !== 'general_oracle' && domains.has(item));
  const generalOnly = (response.domains_any ?? []).includes('general_oracle')
    && !(response.domains_any ?? []).some((item) => item !== 'general_oracle');

  if (conceptAll > 0 && entityRequired > 0) return 6;
  if (conceptAll > 0) return 5;
  if (conceptAny > 0 && entityRequired > 0) return 5;
  if (conceptAny > 0) return 4;
  if (entityRequired > 0 || entityPreferred > 0) return 3;
  if (domainSpecific) return 2;
  if (generalOnly) return 0;
  return 1;
}

function hierarchicalCohort(scored, bundle, minimumPool = 4) {
  if (!scored.length) return { candidates: [], highestTier: -1, includedTiers: [] };
  const decorated = scored.map((item) => ({ ...item, matchTier: responseMatchTier(item.response, bundle) }));
  const tiers = [...new Set(decorated.map((item) => item.matchTier))].sort((a, b) => b - a);
  const selected = [];
  const includedTiers = [];
  for (const tier of tiers) {
    if (tier === 0 && selected.length > 0) break;
    const items = decorated.filter((item) => item.matchTier === tier);
    if (!items.length) continue;
    selected.push(...items);
    includedTiers.push(tier);
    if (selected.length >= minimumPool || tier <= 2) break;
  }
  return {
    candidates: selected.length ? selected : decorated,
    highestTier: tiers[0] ?? -1,
    includedTiers,
  };
}

function scheduledChaosCountdown(seed, routeKey, deliveryModes) {
  const eligibility = deliveryModes.chaos_eligibility;
  const minInterval = eligibility.schedule_min_interval ?? 10;
  const maxInterval = eligibility.schedule_max_interval ?? 15;
  const width = Math.max(1, maxInterval - minInterval + 1);
  // The countdown stores normal eligible answers remaining, so subtract one
  // from the desired inclusive answer interval.
  return minInterval - 1
    + Math.floor(seededUnit(`${seed ?? Math.random()}:${routeKey}:chaos-spacing`) * width);
}

function deliveryCohort(scored, bundle, routeKey, seed, deliveryModes, snapshot) {
  const chaosCandidates = scored.filter((item) => item.response.delivery === 'chaos');
  const normalCandidates = scored.filter((item) => item.response.delivery !== 'chaos');
  const lastWasChaos = snapshot.deliveryModes?.at(-1) === 'chaos';
  const currentCountdown = Number.isInteger(snapshot.chaosCountdown)
    ? snapshot.chaosCountdown
    : scheduledChaosCountdown(seed, routeKey, deliveryModes);
  const chaosSelected = chaosCandidates.length > 0
    && normalCandidates.length > 0
    && currentCountdown <= 0
    && !lastWasChaos;
  if (chaosSelected) {
    return {
      candidates: chaosCandidates,
      chaosSelected: true,
      chaosCountdown: scheduledChaosCountdown(`${seed ?? Math.random()}:reset`, routeKey, deliveryModes),
    };
  }
  if (normalCandidates.length > 0) {
    return {
      candidates: normalCandidates,
      chaosSelected: false,
      chaosCountdown: chaosCandidates.length > 0 ? Math.max(0, currentCountdown - 1) : currentCountdown,
    };
  }
  return {
    candidates: chaosCandidates,
    chaosSelected: chaosCandidates.length > 0 && !lastWasChaos,
    chaosCountdown: scheduledChaosCountdown(`${seed ?? Math.random()}:reset`, routeKey, deliveryModes),
  };
}

function admissionCohort(scored, band) {
  if (!scored.length) return [];
  const bestRelevance = Math.max(...scored.map((item) => item.score.relevanceSubtotal));
  return scored.filter((item) => item.score.relevanceSubtotal >= bestRelevance - band);
}

async function selectResponseUnlocked({ bundle, responses, memory, userId = 'anonymous', seed, mode = 'production', activeEmotes = new Set(), emoteInventory = null, personalityVolume = 6 }) {
  const cfg = loadRuntimeData();
  const userHash = stableHash(userId);
  const inquiryFingerprint = stableHash(bundle.normalized);
  const routeKey = buildRouteKey(bundle);
  const repeatedInquiry = await memory.getInquiryFingerprint(userHash, inquiryFingerprint);
  const snapshot = await memory.getSnapshot(userHash, routeKey);
  const stance = formStance({ bundle, snapshot, seed: seed ?? routeKey, repeatedInquiry, userHash, personalityVolume });
  const eligibility = getEligibleResponses(bundle, responses, mode, activeEmotes);
  let eligible = eligibility.filter((item) => item.eligible).map((item) => item.response);
  let fallbackLevel = 'none';

  if (!eligible.length) {
    for (const level of cfg.selectionConfig.fallback_order) {
      if (level === 'missing_inquiry_help') continue;
      const fallback = fallbackFilter(bundle, responses, level)
        .filter((response) => getEligibleResponses(bundle, [response], mode, activeEmotes)[0].eligible);
      if (fallback.length) {
        eligible = fallback;
        fallbackLevel = level;
        break;
      }
    }
  }

  const scored = eligible
    .map((response) => ({ response, score: scoreEligibleResponse(bundle, response, snapshot) }))
    .filter((item) => item.score.relevanceSubtotal >= cfg.selectionConfig.relevance_floor)
    .sort((a, b) => b.score.relevanceSubtotal - a.score.relevanceSubtotal || a.response.id.localeCompare(b.response.id));

  if (!scored.length) {
    return {
      response: null,
      responseId: null,
      repeatedInquiry,
      routeKey,
      fallbackLevel: fallbackLevel === 'none' ? 'missing_inquiry_help' : fallbackLevel,
      eligibility,
      candidates: [],
      error: 'NO_ELIGIBLE_RESPONSE',
    };
  }

  // Delivery is decided from the full relevance-qualified set before the
  // specificity hierarchy narrows the normal route pool. Chaos has already
  // passed hard eligibility (confidence, low specificity, non-serious,
  // non-ambiguous, non-work), so this preserves the intended rare oracle
  // nonsense path without allowing it to rescue an irrelevant response.
  const delivery = deliveryCohort(scored, bundle, routeKey, seed, cfg.deliveryModes, snapshot);
  const hierarchy = hierarchicalCohort(delivery.candidates, bundle, cfg.selectionConfig.minimum_specific_pool_size ?? 4);
  const admitted = admissionCohort(hierarchy.candidates, cfg.selectionConfig.pool_admission_band ?? 15);

  // Relevance defines the full route cycle. The brain may choose a stance among
  // unused answers, but it must never create a smaller independent cycle.
  const pathCycle = pathCycleCohort(admitted, snapshot);
  const brain = stanceCohort(pathCycle.candidates, stance);
  const rotationPool = removeRecentExactRepeats(brain.candidates, snapshot);
  const immediateFreshness = immediateFreshnessCohort(rotationPool, snapshot);
  const grammarFreshness = grammarFreshnessCohort(immediateFreshness.candidates, snapshot, responses, cfg.selectionConfig);
  const chosen = chooseUniform(grammarFreshness.candidates, `${seed ?? `${Date.now()}:${Math.random()}`}:${routeKey}:${snapshot.pathResponseIds?.length ?? 0}`);
  const baseResponse = chosen.response;
  const emotePolicy = resolveEmotePolicy(baseResponse, bundle);
  const emoteDecision = selectEmoteForResponse({
    response: baseResponse,
    policy: emotePolicy,
    inventory: emoteInventory,
    snapshot,
    seed: `${seed ?? `${Date.now()}:${Math.random()}`}:${routeKey}`,
  });
  const emoteOutput = emoteDecision.output ?? emoteDecision.alias;
  const response = emoteOutput
    ? { ...baseResponse, text: `${baseResponse.text} ${emoteOutput}`, selected_emote: emoteOutput }
    : { ...baseResponse, selected_emote: null };

  await memory.recordSelection({
    userHash,
    routeKey,
    responseId: response.id,
    semanticFamily: response.semantic_family,
    openingFamily: response.opening_family,
    syntaxFamily: response.syntax_family,
    replyMove: response.reply_move,
    twistFamily: response.twist_family,
    targetFamily: response.target_family,
    payoffFamily: response.payoff_family,
    conceptFamilies: response.concepts_any,
    deliveryMode: response.delivery,
    emote: emoteOutput,
    emoteFamily: emoteDecision.family,
    emoteBearing: Boolean(emoteOutput),
    chaosCountdown: delivery.chaosCountdown,
    stance: stance.id,
    motive: stance.motive,
    target: stance.target,
    verdict: stance.verdict,
    oracleMode: stance.oracleMode,
    valueAtStake: stance.valueAtStake,
    diagnosis: stance.diagnosis?.id,
    relationshipStage: stance.relationshipStage,
    oracleProfileDelta: stance.profileDelta,
    decisionPlan: stance,
  });
  await memory.recordInquiryFingerprint(userHash, inquiryFingerprint, cfg.memoryConfig.windows.same_user_inquiry_fingerprint_ttl_seconds);

  return {
    response,
    responseId: response.id,
    repeatedInquiry,
    routeKey,
    fallbackLevel,
    eligibility,
    chaosSelected: delivery.chaosSelected,
    chaosCountdown: delivery.chaosCountdown,
    admittedCount: admitted.length,
    stance,
    stanceBestScore: brain.bestScore,
    stanceRelaxed: brain.relaxed,
    stancePoolCount: brain.candidates.length,
    highestMatchTier: hierarchy.highestTier,
    includedMatchTiers: hierarchy.includedTiers,
    freshnessTierCount: grammarFreshness.freshnessTierCount,
    bestGrammarFreshness: grammarFreshness.bestFreshness,
    hardFreshnessApplied: immediateFreshness.applied,
    hardFreshnessRelaxed: immediateFreshness.relaxed,
    rotationPoolCount: rotationPool.length,
    cycleReset: pathCycle.cycleReset,
    usedInCycle: pathCycle.usedInCycle,
    candidates: scored.map((item) => ({
      responseId: item.response.id,
      delivery: item.response.delivery,
      verdict: item.response.verdict,
      semanticFamily: item.response.semantic_family,
      matchTier: responseMatchTier(item.response, bundle),
      relevanceSubtotal: item.score.relevanceSubtotal,
      finalScore: item.score.finalScore,
      totalPenalty: item.score.totalPenalty,
      varietyBurden: varietyBurden(item.response, snapshot),
      replyMove: item.response.reply_move,
      twistFamily: item.response.twist_family,
      targetFamily: item.response.target_family,
      payoffFamily: item.response.payoff_family,
      stanceScore: brain.scores.find((entry) => entry.candidate.response.id === item.response.id)?.score ?? null,
    })),
    selectedScore: chosen.score,
    selectedVarietyBurden: varietyBurden(baseResponse, snapshot),
    emoteDecision,
    emotePolicy,
  };
}


export async function selectResponse(options) {
  if (typeof options.memory?.withRouteLock === 'function') {
    // One global selection lock keeps route cycles and the rolling emote ratio
    // atomic across simultaneous Twitch requests, including different routes.
    return options.memory.withRouteLock('__global_oracle_selection__', () => selectResponseUnlocked(options));
  }
  return selectResponseUnlocked(options);
}
