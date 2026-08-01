import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { recognizeInquiry } from '../src/recognition/index.js';
import { getEligibleResponses, selectResponse } from '../src/selection/index.js';
import { InMemoryStore } from '../src/memory/index.js';

const router = JSON.parse(fs.readFileSync(new URL('./fixtures/golden-router-pilot.json', import.meta.url), 'utf8')).fixtures;
const byId = new Map(router.map((fixture) => [fixture.id, fixture]));
const cases = JSON.parse(fs.readFileSync(new URL('./fixtures/golden-selection-cases.json', import.meta.url), 'utf8')).cases;
const responses = JSON.parse(fs.readFileSync(new URL('./fixtures/test-response-pool.json', import.meta.url), 'utf8')).responses;

for (const fixture of cases) {
  test(`selection eligibility ${fixture.id}`, () => {
    const bundle = recognizeInquiry(byId.get(fixture.input_fixture).input);
    const evaluated = getEligibleResponses(bundle, responses, 'test', new Set());
    const allowed = new Set(evaluated.filter((item) => item.eligible).map((item) => item.response.id));
    for (const id of fixture.must_allow) assert.ok(allowed.has(id), `${id} should be allowed`);
    for (const id of fixture.must_forbid) assert.ok(!allowed.has(id), `${id} should be forbidden`);
  });
}

test('selector is deterministic with a seed', async () => {
  const bundle = recognizeInquiry('what is the outcome of this game');
  const first = await selectResponse({ bundle, responses, memory: new InMemoryStore(), userId: 'u', seed: 'same', mode: 'test' });
  const second = await selectResponse({ bundle, responses, memory: new InMemoryStore(), userId: 'u', seed: 'same', mode: 'test' });
  assert.equal(first.responseId, second.responseId);
});

test('production never selects test-only responses', async () => {
  const bundle = recognizeInquiry('what is the outcome of this game');
  const result = await selectResponse({ bundle, responses, memory: new InMemoryStore(), userId: 'u', seed: 'x', mode: 'production' });
  assert.equal(result.response, null);
});

test('same route cycles every admitted answer before repeating', async () => {
  const bundle = recognizeInquiry('what is the outcome of this game');
  const pool = responses.filter((response) => ['t_general_yes', 't_general_no', 't_general_unclear'].includes(response.id));
  const memory = new InMemoryStore();
  const seen = [];
  for (let index = 0; index < pool.length; index += 1) {
    const result = await selectResponse({ bundle, responses: pool, memory, userId: 'cycle-user', seed: `cycle-${index}`, mode: 'test' });
    seen.push(result.responseId);
  }
  assert.equal(new Set(seen).size, pool.length, `expected a full no-repeat cycle, got ${seen.join(', ')}`);
  const next = await selectResponse({ bundle, responses: pool, memory, userId: 'cycle-user', seed: 'cycle-reset', mode: 'test' });
  assert.notEqual(next.responseId, seen.at(-1), 'new cycle must not immediately repeat the prior answer');
});


test('concurrent requests serialize the shared route cycle', async () => {
  const bundle = recognizeInquiry('will Mike win');
  const production = JSON.parse(fs.readFileSync(new URL('../data/runtime/responses.json', import.meta.url), 'utf8')).responses;
  const memory = new InMemoryStore();
  const results = await Promise.all(Array.from({ length: 8 }, (_, index) => selectResponse({
    bundle,
    responses: production,
    memory,
    userId: `concurrent-${index}`,
    seed: 'same-concurrent-seed',
    mode: 'production',
  })));
  const ids = results.map((result) => result.responseId);
  assert.equal(new Set(ids).size, ids.length, `concurrent route repeated before exhaustion: ${ids.join(', ')}`);
});

test('repeated routes rotate humor grammar, not only exact text', async () => {
  const bundle = recognizeInquiry('will Mike win');
  const production = JSON.parse(fs.readFileSync(new URL('../data/runtime/responses.json', import.meta.url), 'utf8')).responses;
  const byId = new Map(production.map((response) => [response.id, response]));
  const memory = new InMemoryStore();
  const selected = [];
  for (let index = 0; index < 8; index += 1) {
    const result = await selectResponse({
      bundle,
      responses: production,
      memory,
      userId: 'grammar-cycle-user',
      seed: `grammar-${index}`,
      mode: 'production',
    });
    selected.push(byId.get(result.responseId));
  }
  assert.ok(new Set(selected.map((response) => response.reply_move)).size >= 4, 'expected multiple retort moves');
  assert.ok(new Set(selected.map((response) => response.twist_family)).size >= 3, 'expected multiple twist mechanisms');
  assert.ok(new Set(selected.map((response) => response.payoff_family)).size >= 3, 'expected multiple comedic payoffs');
});

test('scheduled chaos is spaced 10 to 15 eligible answers apart and never consecutive', async () => {
  const bundle = recognizeInquiry('will it rain');
  const production = JSON.parse(fs.readFileSync(new URL('../data/runtime/responses.json', import.meta.url), 'utf8')).responses;
  const memory = new InMemoryStore();
  const chaosAt = [];
  for (let index = 0; index < 120; index += 1) {
    const result = await selectResponse({
      bundle,
      responses: production,
      memory,
      userId: `chaos-spacing-${index}`,
      seed: `chaos-spacing-${index}`,
      mode: 'production',
    });
    if (result.chaosSelected) chaosAt.push(index);
  }
  assert.ok(chaosAt.length >= 7, `expected recurring scheduled chaos, got ${chaosAt.length}`);
  for (let index = 1; index < chaosAt.length; index += 1) {
    const gap = chaosAt[index] - chaosAt[index - 1];
    assert.ok(gap >= 10 && gap <= 15, `chaos gap ${gap} fell outside 10-15: ${chaosAt.join(', ')}`);
  }
});

test('immediate semantic, opening and humor-device repeats are hard-blocked when alternatives exist', async () => {
  const bundle = recognizeInquiry('will Mike win');
  const production = JSON.parse(fs.readFileSync(new URL('../data/runtime/responses.json', import.meta.url), 'utf8')).responses;
  const memory = new InMemoryStore();
  let prior = null;
  for (let index = 0; index < 12; index += 1) {
    const result = await selectResponse({
      bundle,
      responses: production,
      memory,
      userId: 'hard-freshness-user',
      seed: `hard-freshness-${index}`,
      mode: 'production',
    });
    if (prior) {
      for (const field of result.hardFreshnessApplied) {
        assert.notEqual(result.response[field], prior[field], `${field} repeated despite an admitted alternative`);
      }
    }
    prior = result.response;
  }
});
