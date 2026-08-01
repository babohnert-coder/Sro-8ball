import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { recognizeInquiry } from '../src/recognition/index.js';
import { getEligibleResponses } from '../src/selection/eligibility.js';
import { scoreEligibleResponse, emptyVarietySnapshot } from '../src/selection/scoring.js';
import { loadRuntimeData } from '../src/data.js';

const responses = JSON.parse(fs.readFileSync(new URL('../data/runtime/responses.json', import.meta.url), 'utf8')).responses;
const cfg = loadRuntimeData();

function labels(items, field = 'label') {
  return new Set(items.map((item) => item[field]));
}

function admittedResponses(input) {
  const bundle = recognizeInquiry(input);
  const eligible = getEligibleResponses(bundle, responses, 'production', new Set())
    .filter((item) => item.eligible)
    .map((item) => item.response);
  const snapshot = emptyVarietySnapshot();
  const scored = eligible
    .map((response) => ({ response, relevance: scoreEligibleResponse(bundle, response, snapshot).relevanceSubtotal }))
    .filter((item) => item.relevance >= cfg.selectionConfig.relevance_floor)
    .sort((a, b) => b.relevance - a.relevance || a.response.id.localeCompare(b.response.id));
  const normal = scored.filter((item) => item.response.delivery !== 'chaos');
  const best = normal.length ? Math.max(...normal.map((item) => item.relevance)) : -Infinity;
  return {
    bundle,
    responses: normal
      .filter((item) => item.relevance >= best - cfg.selectionConfig.pool_admission_band)
      .map((item) => item.response),
  };
}

const recognitionCases = [
  {
    input: 'can SRO still win',
    intent: 'prediction', primary: 'current_game',
    concepts: ['game_outcome_question'], entities: ['sro'], forbiddenConcepts: [], minPool: 4,
  },
  {
    input: 'did he donate the shutdown',
    intent: 'evaluation', primary: 'fight_dive_trade_shutdown',
    concepts: ['shutdown_given'], entities: [], forbiddenConcepts: [], minPool: 4,
  },
  {
    input: 'was that actually worth it',
    intent: 'evaluation', primary: 'fight_dive_trade_shutdown',
    concepts: ['worth_cope'], entities: [], forbiddenConcepts: [], minPool: 4,
  },
  {
    input: 'is this build troll',
    intent: 'evaluation', primary: 'builds_items_runes',
    concepts: ['build_evaluation'], entities: [], forbiddenConcepts: [], minPool: 4,
  },
  {
    input: 'should they flip Baron',
    intent: 'permission', primary: 'objective_macro',
    concepts: ['objective_flip'], entities: ['baron'], forbiddenConcepts: [], minPool: 4,
  },
  {
    input: 'should he smite Baron',
    intent: 'permission', primary: 'objective_macro',
    concepts: ['smite_objective'], entities: ['baron'], forbiddenConcepts: [], minPool: 4,
  },
  {
    input: 'can Mike carry this game',
    intent: 'prediction', primary: 'current_game',
    concepts: ['carry_game'], entities: ['sro'], forbiddenConcepts: [], minPool: 4,
  },
  {
    input: 'can Mike build a house',
    intent: 'permission', primary: 'ordinary_life',
    concepts: ['structure_building'], entities: ['sro'], forbiddenConcepts: ['build_evaluation'], minPool: 4,
  },
  {
    input: 'can Mike carry groceries',
    intent: 'permission', primary: 'food_health_outside',
    concepts: ['groceries_task'], entities: ['sro'], forbiddenConcepts: ['carry_game'], minPool: 4,
  },
  {
    input: 'should Mike cook dinner',
    intent: 'permission', primary: 'food_health_outside',
    concepts: ['food_decision'], entities: ['sro'], forbiddenConcepts: ['experimental_build'], minPool: 4,
  },
  {
    input: 'is Mike free tomorrow',
    intent: 'evaluation', primary: 'ordinary_life',
    concepts: ['availability_question'], entities: ['sro'], forbiddenConcepts: [], minPool: 4,
  },
  {
    input: 'can I scale this recipe',
    intent: 'permission', primary: 'food_health_outside',
    concepts: ['recipe_scaling'], entities: ['viewer_self'], forbiddenConcepts: ['scaling_question'], minPool: 4,
  },
  {
    input: 'should I proxy this request',
    intent: 'permission', primary: 'general_oracle',
    concepts: [], entities: ['viewer_self'], forbiddenConcepts: ['proxy_lane'], minPool: 4,
  },
  {
    input: 'is top lane over',
    intent: 'evaluation', primary: 'lane_wave_state',
    concepts: ['lane_over'], entities: ['top'], forbiddenConcepts: [], minPool: 4,
  },
  {
    input: 'did he lose the wave',
    intent: 'evaluation', primary: 'lane_wave_state',
    concepts: ['wave_lost'], entities: [], forbiddenConcepts: [], minPool: 4,
  },
  {
    input: 'does this item scale',
    intent: 'evaluation', primary: 'builds_items_runes',
    concepts: ['item_scaling'], entities: [], forbiddenConcepts: ['scaling_question'], minPool: 4,
  },
  {
    input: 'did he run it down',
    intent: 'evaluation', primary: 'fight_dive_trade_shutdown',
    concepts: ['int_feed'], entities: [], forbiddenConcepts: [], minPool: 4,
  },
  {
    input: 'Jax or Renekton',
    intent: 'comparison', primary: 'champion_matchup',
    concepts: ['champion_comparison'], entities: ['jax', 'renekton'], forbiddenConcepts: [], minPool: 4,
  },
];

for (const fixture of recognitionCases) {
  test(`adversarial routing: ${fixture.input}`, () => {
    const { bundle, responses: admitted } = admittedResponses(fixture.input);
    const concepts = labels(bundle.concepts);
    const entities = labels(bundle.entities, 'value');
    assert.equal(bundle.intent.label, fixture.intent);
    assert.equal(bundle.domains[0]?.label, fixture.primary);
    for (const concept of fixture.concepts) assert.ok(concepts.has(concept), `missing concept ${concept}`);
    for (const concept of fixture.forbiddenConcepts) assert.ok(!concepts.has(concept), `forbidden concept ${concept}`);
    for (const entity of fixture.entities) assert.ok(entities.has(entity), `missing entity ${entity}`);
    assert.ok(admitted.length >= fixture.minPool, `only ${admitted.length} admitted responses`);
  });
}

test('champion comparison admits both champion verdicts instead of collapsing to neither', () => {
  const { responses: admitted } = admittedResponses('Jax or Renekton');
  const text = admitted.map((response) => response.text).join('\n');
  assert.match(text, /^jax\b/im);
  assert.match(text, /^renekton\b/im);
});

test('Baron flip admits normal polarity variety instead of one score-favored verdict', () => {
  const { responses: admitted } = admittedResponses('should they flip Baron');
  const openings = new Set(admitted.map((response) => response.text.split(/\s+/)[0]));
  assert.ok(openings.size >= 3, `expected varied verdict openings, got ${[...openings].join(', ')}`);
});

test('Misanthrope location route stays location-shaped', () => {
  const { responses: admitted } = admittedResponses('where is Misanthrope');
  const allowedOpenings = /^(nearby|somewhere in chat|incoming|close|between messages|ask again)\b/i;
  for (const response of admitted) {
    assert.match(response.text, allowedOpenings, `not location-shaped: ${response.text}`);
  }
});

test('unverified MTF facts stay oracle-like without system verification language', () => {
  const { responses: admitted } = admittedResponses('is MTF British');
  const systemVoice = /\bverified\b|\bbiography\b|\brecognized chatter\b|\bproduction\b|\bdatabase\b/i;
  assert.ok(admitted.length >= 4);
  for (const response of admitted) {
    assert.doesNotMatch(response.text, systemVoice);
  }
});


test('live room: Bones pineapple pizza resolves to the Bones food pool', () => {
  const { bundle, responses: admitted } = admittedResponses('does bonesex put pineapples on pizza?');
  assert.equal(bundle.domains[0]?.label, 'stream_chat_moderation');
  assert.ok(labels(bundle.entities, 'value').has('bones'));
  assert.ok(admitted.length >= 4);
  assert.ok(admitted.every((response) => response.id.startsWith('bones_food_')));
  assert.ok(admitted.some((response) => response.text.includes('Bones did it')));
});

test('live room: MTF hater question stays inside MTF lore', () => {
  const { bundle, responses: admitted } = admittedResponses('why is @michaelthefan such a hater');
  assert.equal(bundle.intent.label, 'explanation');
  assert.equal(bundle.domains[0]?.label, 'room_lore');
  assert.ok(labels(bundle.entities, 'value').has('mtf'));
  assert.ok(admitted.length >= 4);
  assert.ok(labels(bundle.concepts).has('mtf_hater'));
  assert.ok(admitted.every((response) => response.id.startsWith('mtf_hater_')));
  assert.ok(admitted.some((response) => response.text.includes('Nidalee dodged')));
});

test('live room: doubt or believe opens the doubter-believer joke pool', () => {
  const { bundle, responses: admitted } = admittedResponses('doubt or believe?');
  assert.equal(bundle.intent.label, 'comparison');
  assert.equal(bundle.domains[0]?.label, 'room_lore');
  assert.ok(labels(bundle.concepts).has('room_doubters_believers'));
  assert.ok(admitted.length >= 4);
  assert.ok(admitted.every((response) => response.id.startsWith('doubters_lore_')));
  assert.ok(admitted.some((response) => response.text === 'Choose the funnier mistake.'));
});

test('live room: Mike Nidalee question opens the specific SRO Nidalee pool', () => {
  const { bundle, responses: admitted } = admittedResponses('should Mike play Nidalee?');
  assert.equal(bundle.intent.label, 'permission');
  assert.ok(labels(bundle.entities, 'value').has('sro'));
  assert.ok(labels(bundle.entities, 'value').has('nidalee'));
  assert.ok(admitted.length >= 4);
  assert.ok(admitted.every((response) => response.id.startsWith('sro_nidalee_pick_')));
});
