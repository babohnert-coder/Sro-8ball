import { loadJson } from '../data.js';

function isStringArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

export function validateFeatureBundle(bundle) {
  const errors = [];
  const required = loadJson('schemas/feature-bundle.schema.json').required;
  for (const key of required) if (!(key in bundle)) errors.push(`missing:${key}`);
  if (typeof bundle.raw !== 'string') errors.push('raw:not_string');
  if (typeof bundle.normalized !== 'string') errors.push('normalized:not_string');
  if (!bundle.intent || typeof bundle.intent.label !== 'string') errors.push('intent:invalid');
  for (const key of ['specificity', 'confidence']) {
    if (typeof bundle[key] !== 'number' || bundle[key] < 0 || bundle[key] > 1) errors.push(`${key}:out_of_range`);
  }
  for (const key of ['domains', 'entities', 'concepts', 'states', 'ambiguities', 'evidence']) {
    if (!Array.isArray(bundle[key])) errors.push(`${key}:not_array`);
  }
  return { valid: errors.length === 0, errors };
}

export function validateResponse(response) {
  const errors = [];
  const schema = loadJson('schemas/response.schema.json');
  for (const key of schema.required) if (!(key in response)) errors.push(`missing:${key}`);
  if (!/^[a-z0-9_]+$/.test(response.id ?? '')) errors.push('id:invalid');
  if (typeof response.text !== 'string' || response.text.length < 2 || response.text.length > 390) errors.push('text:invalid');
  for (const key of [
    'intents', 'domains_any', 'domains_all', 'domains_forbidden', 'entities_required',
    'entities_preferred', 'entities_forbidden', 'concepts_any', 'concepts_all',
    'concepts_forbidden', 'states_any', 'states_forbidden',
  ]) if (!isStringArray(response[key])) errors.push(`${key}:invalid`);
  for (const key of ['league_intensity', 'sro_intensity', 'seriousness', 'chaos']) {
    if (!Number.isInteger(response[key]) || response[key] < 0 || response[key] > 3) errors.push(`${key}:invalid`);
  }
  if (typeof response.min_specificity !== 'number' || typeof response.max_specificity !== 'number' || response.min_specificity > response.max_specificity) errors.push('specificity_range:invalid');
  if (!schema.properties.status.enum.includes(response.status)) errors.push('status:invalid');
  if (!schema.properties.delivery.enum.includes(response.delivery)) errors.push('delivery:invalid');
  const grammar = loadJson('data/ontology/humor_grammar.json');
  const grammarEnums = {
    reply_move: new Set(grammar.reply_moves.map((item) => item.id)),
    twist_family: new Set(grammar.twist_families.map((item) => item.id)),
    target_family: new Set(grammar.target_families),
    payoff_family: new Set(grammar.payoff_families.map((item) => item.id)),
  };
  for (const [key, allowed] of Object.entries(grammarEnums)) {
    if (!allowed.has(response[key])) errors.push(`${key}:invalid`);
  }
  const policy = response.emote_policy;
  if (!policy || typeof policy !== 'object') {
    errors.push('emote_policy:invalid');
  } else {
    for (const key of ['expressions_any', 'expressions_preferred', 'expressions_forbidden', 'discourse_functions_any', 'visual_families_preferred']) {
      if (!isStringArray(policy[key])) errors.push(`emote_policy.${key}:invalid`);
    }
    if (typeof policy.min_intensity !== 'number' || typeof policy.max_intensity !== 'number'
        || policy.min_intensity < 0 || policy.max_intensity > 1 || policy.min_intensity > policy.max_intensity) {
      errors.push('emote_policy.intensity:invalid');
    }
    if (typeof policy.allow_hidden_nonsense !== 'boolean') errors.push('emote_policy.allow_hidden_nonsense:invalid');
    if (!(typeof policy.pinned_emote === 'string' || policy.pinned_emote === null)) errors.push('emote_policy.pinned_emote:invalid');
  }
  return { valid: errors.length === 0, errors };
}

export function validateResponsePool(responses) {
  const seen = new Set();
  const results = [];
  for (const response of responses) {
    const result = validateResponse(response);
    if (seen.has(response.id)) result.errors.push('id:duplicate');
    seen.add(response.id);
    results.push({ id: response.id, valid: result.errors.length === 0, errors: result.errors });
  }
  return { valid: results.every((item) => item.valid), results };
}
