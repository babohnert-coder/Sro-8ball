import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { recognizeInquiry } from '../src/recognition/index.js';
import { validateFeatureBundle } from '../src/validation/index.js';

const fixtureFile = JSON.parse(fs.readFileSync(new URL('./fixtures/golden-router-pilot.json', import.meta.url), 'utf8'));

for (const fixture of fixtureFile.fixtures) {
  test(`recognition ${fixture.id}: ${fixture.input}`, () => {
    const bundle = recognizeInquiry(fixture.input);
    assert.equal(validateFeatureBundle(bundle).valid, true);
    assert.equal(bundle.intent.label, fixture.expected.intent);
    assert.equal(bundle.domains[0]?.label, fixture.expected.primary_domain);
    const domains = new Set(bundle.domains.map((item) => item.label));
    const entities = new Set(bundle.entities.map((item) => item.value));
    const concepts = new Set(bundle.concepts.map((item) => item.label));
    const states = new Set(bundle.states.map((item) => item.label));
    for (const value of fixture.expected.domains_required) assert.ok(domains.has(value), `missing domain ${value}`);
    for (const value of fixture.expected.entities_required) assert.ok(entities.has(value), `missing entity ${value}`);
    for (const value of fixture.expected.concepts_required) assert.ok(concepts.has(value), `missing concept ${value}`);
    for (const value of fixture.expected.states_required) assert.ok(states.has(value), `missing state ${value}`);
    for (const value of fixture.forbidden.domains) assert.ok(!domains.has(value), `forbidden domain ${value}`);
    for (const value of fixture.forbidden.concepts) assert.ok(!concepts.has(value), `forbidden concept ${value}`);
    assert.ok(bundle.specificity >= fixture.expected.specificity_min && bundle.specificity <= fixture.expected.specificity_max, `specificity ${bundle.specificity}`);
    assert.ok(bundle.confidence >= fixture.expected.confidence_min, `confidence ${bundle.confidence}`);
  });
}


test('can + player + win is an outcome prediction, not permission', () => {
  const bundle = recognizeInquiry('can Mike win this game');
  assert.equal(bundle.intent.label, 'prediction');
  assert.equal(bundle.domains[0]?.label, 'current_game');
  assert.ok(bundle.concepts.some((item) => item.label === 'game_outcome_question'));
  assert.ok(bundle.entities.some((item) => item.value === 'sro'));
});
