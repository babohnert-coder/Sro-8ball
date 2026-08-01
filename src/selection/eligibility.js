import { loadRuntimeData } from '../data.js';
import { validateResponse } from '../validation/index.js';

const LEAGUE_DOMAINS = new Set([
  'current_game', 'sro', 'rank_climb', 'builds_items_runes', 'champion_matchup',
  'lane_wave_state', 'player_role_performance', 'objective_macro', 'fight_dive_trade_shutdown',
]);

const ROOM_PERSON_IDS = new Set(['mtf', 'john_west_gamer', 'teamplay', 'misanthrope', 'bones']);

function setOf(items, key) {
  return new Set(items.map((item) => key ? item[key] : item));
}
function allPresent(required, present) { return required.every((item) => present.has(item)); }
function anyPresent(required, present) { return required.length === 0 || required.some((item) => present.has(item)); }
function nonePresent(forbidden, present) { return forbidden.every((item) => !present.has(item)); }

export function supportedLeagueIntensity(bundle) {
  const domains = setOf(bundle.domains, 'label');
  if (![...domains].some((domain) => LEAGUE_DOMAINS.has(domain))) return 0;
  let level = 1;
  if (bundle.concepts.length > 0 || bundle.entities.some((e) => ['champion', 'objective', 'rank', 'role'].includes(e.type))) level = 2;
  if (bundle.specificity >= 0.85 && bundle.concepts.length >= 2) level = 3;
  return level;
}

export function supportedSroIntensity(bundle) {
  const entities = setOf(bundle.entities, 'value');
  const domains = setOf(bundle.domains, 'label');
  const concepts = setOf(bundle.concepts, 'label');
  let level = entities.has('sro') ? 1 : 0;
  if (domains.has('room_lore') || [...concepts].some((id) => ['plumbing_topic', 'bitcoin_topic', 'jokic_topic', 'old_six_nashors_jax', 'room_doubters_believers'].includes(id))) level = Math.max(level, 2);
  if (bundle.entities.some((e) => ['mtf', 'john_west_gamer', 'teamplay', 'misanthrope', 'bones'].includes(e.value)) && bundle.specificity >= 0.55) level = Math.max(level, 2);
  return level;
}

function referenceTriggerSatisfied(ref, bundle, entityIds, conceptIds, domains, normalized) {
  if (entityIds.has(ref.id) || conceptIds.has(ref.id) || conceptIds.has(`${ref.id}_topic`)) return true;
  if ((ref.aliases ?? []).some((alias) => normalized.includes(alias))) return true;

  for (const trigger of ref.allowed_triggers ?? []) {
    if (trigger === 'creator_origin' && conceptIds.has('creator_origin')) return true;
    if (trigger === 'explicit_topic' && conceptIds.has(`${ref.id}_topic`)) return true;
    if (trigger === 'exact_merch_callback' && entityIds.has('jokic') && /\bmerch\b/.test(normalized)) return true;
    if (trigger === 'explicit_nidalee_request_context' && entityIds.has('mtf') && /\bnidalee\b/.test(normalized)) return true;
    if (trigger === 'explicit_moderation_context' && entityIds.has('teamplay') && domains.has('stream_chat_moderation')) return true;
    if (trigger === 'explicit_john_east_west_callback' && entityIds.has('john_west_gamer') && /\bjohn (east|west)\b/.test(normalized)) return true;
    if (trigger === 'rank_prediction_context' && conceptIds.has('room_doubters_believers') && domains.has('rank_climb')) return true;
    if (trigger === 'explicit_nostalgia_or_build_reference' && conceptIds.has('old_six_nashors_jax')) return true;
    if (trigger === 'build_context' && domains.has('builds_items_runes')) return true;
    if (trigger === 'rank_context' && domains.has('rank_climb')) return true;
    if (trigger === 'shutdown_context' && (conceptIds.has('shutdown_given') || conceptIds.has('shutdown_collected'))) return true;
  }

  if (ref.id === 'doubters_believers' && conceptIds.has('room_doubters_believers')) return true;
  return false;
}

function referencePermission(response, bundle, references) {
  const reasons = [];
  const entityIds = setOf(bundle.entities, 'value');
  const conceptIds = setOf(bundle.concepts, 'label');
  const domains = setOf(bundle.domains, 'label');
  const normalized = bundle.normalized;
  for (const refId of response.reference_ids ?? []) {
    const ref = references.references.find((item) => item.id === refId);
    if (!ref || ref.status !== 'verified') {
      reasons.push(`reference_not_verified:${refId}`);
      continue;
    }
    if (!referenceTriggerSatisfied(ref, bundle, entityIds, conceptIds, domains, normalized)) {
      reasons.push(`reference_trigger_missing:${refId}`);
    }
    for (const candidate of ref.candidate_associations ?? []) {
      if (new RegExp(`\\b${candidate.replace(/_/g, '[ -]?')}\\b`, 'i').test(response.text)) reasons.push(`candidate_association_in_response:${refId}.${candidate}`);
    }
  }
  return reasons;
}

function chaosPermission(response, bundle, deliveryModes) {
  if (response.delivery !== 'chaos') return [];
  const cfg = deliveryModes.chaos_eligibility;
  const domains = setOf(bundle.domains, 'label');
  const states = setOf(bundle.states, 'label');
  const reasons = [];
  if (bundle.confidence < cfg.min_recognition_confidence) reasons.push('chaos_low_confidence');
  if (bundle.specificity > cfg.max_specificity) reasons.push('chaos_specificity_too_high');
  if (cfg.forbidden_states.some((state) => states.has(state))) reasons.push('chaos_forbidden_state');
  if (cfg.forbidden_domains.some((domain) => domains.has(domain))) reasons.push('chaos_forbidden_domain');
  if (cfg.forbidden_if_named_person_unresolved && bundle.ambiguities.some((a) => a.includes('alias') || a.includes('reference'))) reasons.push('chaos_unresolved_person');
  // Chaos is a delivery choice for a clearly understood low-risk prompt, not
  // a substitute for resolving polysemy. Ambiguous inputs stay broad/classic.
  if (bundle.ambiguities.length > 0) reasons.push('chaos_ambiguous_input');
  const exactAnswerShapeConcepts = new Set([
    'sro_future_performance', 'john_direction_choice', 'gamba_outcome',
    'person_appearance', 'person_problem',
  ]);
  if (bundle.concepts.some((concept) => exactAnswerShapeConcepts.has(concept.label))) {
    reasons.push('chaos_exact_answer_shape');
  }
  return reasons;
}

function answerShapePermission(response, bundle) {
  if (!String(bundle.route_family ?? '').startsWith('answer_shape:')) return [];

  const responseEntities = new Set([
    ...(response.entities_required ?? []),
    ...(response.entities_preferred ?? []),
  ]);
  if (![...responseEntities].some((entity) => ROOM_PERSON_IDS.has(entity))) return [];

  const responseConcepts = new Set([
    ...(response.concepts_all ?? []),
    ...(response.concepts_any ?? []),
  ]);
  if (responseConcepts.size > 0) return [];
  return ['named_lore_does_not_answer_requested_form'];
}

export function evaluateEligibility(bundle, response, mode = 'production', activeEmotes = new Set()) {
  const data = loadRuntimeData();
  const reasons = [];
  const validation = validateResponse(response);
  if (!validation.valid) reasons.push(...validation.errors.map((e) => `schema:${e}`));

  const allowedStatuses = mode === 'production' ? data.selectionConfig.production_statuses : data.selectionConfig.test_statuses;
  if (!allowedStatuses.includes(response.status)) reasons.push(`status_not_allowed:${response.status}`);
  if (!response.intents.includes(bundle.intent.label)) reasons.push(`intent_incompatible:${bundle.intent.label}`);

  const domains = setOf(bundle.domains, 'label');
  const entities = setOf(bundle.entities.filter((e) => e.resolution_status === 'verified'), 'value');
  const concepts = setOf(bundle.concepts, 'label');
  const states = setOf(bundle.states, 'label');

  if (!allPresent(response.domains_all, domains)) reasons.push('required_domains_missing');
  if (!response.domains_any.includes('general_oracle') && !anyPresent(response.domains_any, domains)) reasons.push('domains_any_missing');
  if (!nonePresent(response.domains_forbidden, domains)) reasons.push('forbidden_domain_present');
  if (!allPresent(response.entities_required, entities)) reasons.push('required_entities_missing');
  if (!nonePresent(response.entities_forbidden, entities)) reasons.push('forbidden_entity_present');
  if (!allPresent(response.concepts_all, concepts)) reasons.push('required_concepts_missing');
  if (!anyPresent(response.concepts_any, concepts)) reasons.push('concepts_any_missing');
  if (!nonePresent(response.concepts_forbidden, concepts)) reasons.push('forbidden_concept_present');
  if (!anyPresent(response.states_any, states)) reasons.push('states_any_missing');
  if (!nonePresent(response.states_forbidden, states)) reasons.push('forbidden_state_present');
  // Pure general-oracle lines are the explicit safe fallback layer. They may
  // remain eligible above their normal input range so a precise route can
  // degrade gracefully when its specialized pool is unavailable. Relevance
  // scoring still keeps a matching specialized response ahead of them.
  const isGeneralFallback = response.domains_any.includes('general_oracle')
    && response.domains_all.length === 0
    && response.concepts_any.length === 0
    && response.concepts_all.length === 0
    && response.entities_required.length === 0;
  if (bundle.specificity < response.min_specificity
      || (!isGeneralFallback && bundle.specificity > response.max_specificity)) {
    reasons.push('specificity_outside_range');
  }
  if (response.league_intensity > supportedLeagueIntensity(bundle)) reasons.push('league_intensity_unsupported');
  if (response.sro_intensity > supportedSroIntensity(bundle)) reasons.push('sro_intensity_unsupported');
  reasons.push(...answerShapePermission(response, bundle));
  reasons.push(...referencePermission(response, bundle, data.references));
  reasons.push(...chaosPermission(response, bundle, data.deliveryModes));
  const pinnedEmote = response.emote_policy?.pinned_emote ?? response.emote;
  if (pinnedEmote && activeEmotes.size > 0 && !activeEmotes.has(pinnedEmote)) reasons.push('emote_unavailable');

  return { response, eligible: reasons.length === 0, rejectionReasons: reasons };
}

export function getEligibleResponses(bundle, responses, mode = 'production', activeEmotes = new Set()) {
  return responses.map((response) => evaluateEligibility(bundle, response, mode, activeEmotes));
}
