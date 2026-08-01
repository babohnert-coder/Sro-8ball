import { loadRuntimeData } from '../data.js';
import { supportedLeagueIntensity, supportedSroIntensity } from './eligibility.js';

function setOf(items, key) { return new Set(items.map((item) => key ? item[key] : item)); }
function countMatches(values, present) { return values.filter((item) => present.has(item)).length; }

export function emptyVarietySnapshot() {
  return {
    userResponseIds: [], globalResponseIds: [], semanticFamilies: [], openingFamilies: [],
    syntaxFamilies: [], conceptFamilies: [], deliveryModes: [], emotes: [],
    replyMoves: [], twistFamilies: [], targetFamilies: [], payoffFamilies: [],
    emoteFamilies: [], emoteBearingFlags: [], stances: [], motives: [], targets: [], verdicts: [],
    oracleModes: [], values: [], diagnoses: [], relationshipStages: [],
  };
}

function defaultVerdicts(intent) {
  return loadRuntimeData().intents.intents.find((item) => item.id === intent)?.default_verdict_families ?? [];
}

export function scoreEligibleResponse(bundle, response, history = emptyVarietySnapshot()) {
  const cfg = loadRuntimeData().selectionConfig;
  const w = cfg.weights;
  const p = cfg.penalties;
  const domains = setOf(bundle.domains, 'label');
  const entities = setOf(bundle.entities.filter((e) => e.resolution_status === 'verified'), 'value');
  const concepts = setOf(bundle.concepts, 'label');
  const states = setOf(bundle.states, 'label');
  const positive = {};
  const penalties = {};

  positive.intent = response.intents.includes(bundle.intent.label) ? w.intent_exact : 0;
  positive.domainsRequired = countMatches(response.domains_all, domains) * w.domain_required_each;
  positive.domainsAny = Math.min(w.domain_any_cap, countMatches(response.domains_any, domains) * w.domain_any_each);
  positive.entitiesRequired = countMatches(response.entities_required, entities) * w.entity_required_each;
  positive.entitiesPreferred = countMatches(response.entities_preferred, entities) * w.entity_preferred_each;
  positive.conceptsRequired = countMatches(response.concepts_all, concepts) * w.concept_required_each;
  positive.conceptsAny = Math.min(w.concept_any_cap, countMatches(response.concepts_any, concepts) * w.concept_any_each);
  positive.states = Math.min(w.state_match_cap, countMatches(response.states_any, states) * w.state_match_each);
  // Intent compatibility is already a hard eligibility gate. Every eligible
  // authored verdict therefore receives equal credit here. Verdict labels must
  // never collapse a valid route pool or quietly decide the RNG winner.
  positive.verdict = w.verdict_compatibility;
  const center = (response.min_specificity + response.max_specificity) / 2;
  positive.specificity = Math.max(0, w.specificity_fit_max * (1 - Math.abs(bundle.specificity - center)));
  const serious = states.has('serious');
  const desiredDelivery = serious ? ['direct', 'classic'] : bundle.specificity < 0.3 ? ['classic', 'direct'] : ['contextual', 'dry', 'direct', 'classic'];
  positive.delivery = desiredDelivery.includes(response.delivery) ? w.delivery_fit : 0;
  positive.seriousness = serious ? (response.seriousness >= 2 ? w.seriousness_fit : 0) : w.seriousness_fit;
  positive.leagueIntensity = response.league_intensity <= supportedLeagueIntensity(bundle) ? w.league_intensity_fit : 0;
  positive.sroIntensity = response.sro_intensity <= supportedSroIntensity(bundle) ? w.sro_intensity_fit : 0;

  const relevanceSubtotal = Object.values(positive).reduce((a, b) => a + b, 0);
  penalties.userExact = history.userResponseIds.includes(response.id) ? p.exact_response_in_user_window : 0;
  penalties.globalExact = history.globalResponseIds.includes(response.id) ? p.exact_response_in_global_window : 0;
  penalties.semantic = history.semanticFamilies.includes(response.semantic_family) ? p.semantic_family_recent : 0;
  penalties.opening = history.openingFamilies.includes(response.opening_family) ? p.opening_family_recent : 0;
  penalties.syntax = history.syntaxFamilies.includes(response.syntax_family) ? p.syntax_family_recent : 0;
  penalties.concept = (response.concepts_any ?? []).some((c) => history.conceptFamilies.includes(c)) ? p.concept_family_recent : 0;
  penalties.emote = response.emote && history.emotes.includes(response.emote) ? p.emote_recent : 0;
  penalties.delivery = history.deliveryModes.slice(-3).filter((d) => d === response.delivery).length >= 2 ? p.delivery_mode_over_target : 0;
  const totalPenalty = Object.values(penalties).reduce((a, b) => a + b, 0);
  return { responseId: response.id, relevanceSubtotal, positive, penalties, totalPenalty, finalScore: relevanceSubtotal + totalPenalty };
}
