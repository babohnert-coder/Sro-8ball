import test from 'node:test';
import assert from 'node:assert/strict';
import { OracleRuntime } from '../src/runtime.js';
import { InMemoryStore } from '../src/memory/index.js';

const env = { ...process.env, DISABLE_7TV_FETCH: '1' };

test('runtime returns plain text below hard cap', async () => {
  const runtime = new OracleRuntime({ mode: 'test', env, memory: new InMemoryStore() });
  const result = await runtime.answer({ inquiry: 'what is the outcome of this game', userId: 'a', seed: '1' });
  assert.equal(typeof result, 'string');
  assert.ok(result.length <= 390);
});

test('missing inquiry returns command help', async () => {
  const runtime = new OracleRuntime({ mode: 'test', env, memory: new InMemoryStore() });
  const result = await runtime.answer({ inquiry: '!8ball', userId: 'a' });
  assert.match(result, /ASK A QUESTION/);
});

test('debug includes recognition and candidate evidence', async () => {
  const runtime = new OracleRuntime({ mode: 'test', env, memory: new InMemoryStore() });
  const result = await runtime.answer({ inquiry: 'is he just resetting his gold', userId: 'a', seed: '1', debug: true });
  assert.equal(result.bundle.concepts.some((item) => item.label === 'shutdown_given'), true);
  assert.ok(Array.isArray(result.eligibility));
  assert.equal(typeof result.selectedVarietyBurden, 'number');
});

test('production health reports approved content but remains unready without distributed persistence', async () => {
  const runtime = new OracleRuntime({ mode: 'production', env, memory: new InMemoryStore() });
  const health = await runtime.health();
  assert.equal(health.productionReady, false);
  assert.equal(health.editorialStatus, 'approved_content_present');
  assert.ok(health.responseCounts.approved > 0);
});
