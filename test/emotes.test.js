import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyEmote, inspectEmoteInventory, selectEmoteForResponse } from '../src/emotes.js';
import { deriveEmotePolicy } from '../src/emote-policy.js';

function response(overrides = {}) {
  return {
    id: 'x', text: 'The comeback remains legally possible.', intents: ['prediction'],
    verdict: 'maybe', delivery: 'dry', league_intensity: 1, sro_intensity: 0,
    seriousness: 1, chaos: 0, concepts_any: [], reply_move: 'conditional_verdict',
    payoff_family: 'cope', ...overrides,
  };
}

test('full active set entries are preserved and classified', () => {
  const inventory = inspectEmoteInventory([
    { id: '1', name: 'COPIUM', data: { name: 'COPIUM', tags: ['cope'] } },
    { id: '2', name: 'PepePray', data: { name: 'PepePray', tags: ['prayer'] } },
    { id: '3', name: 'OddOrb', data: { name: 'OddOrb', tags: [] } },
    { id: '4', name: 'OverlayHat', flags: 1, data: { name: 'OverlayHat' } },
  ], { source: 'test', setId: 'set' });
  assert.equal(inventory.totalCount, 4);
  assert.equal(inventory.entries.every((entry) => entry.expressions.length >= 1), true);
  assert.ok(inventory.entries.find((entry) => entry.alias === 'COPIUM').expressions.includes('cope'));
  assert.ok(inventory.entries.find((entry) => entry.alias === 'PepePray').visual_families.includes('pepe'));
  assert.ok(inventory.entries.find((entry) => entry.alias === 'OddOrb').expressions.includes('hidden_nonsense'));
  assert.equal(inventory.entries.find((entry) => entry.alias === 'OverlayHat').standalone_ok, false);
});

test('cope response only selects a compatible active emote', () => {
  const inventory = inspectEmoteInventory([
    { id: '1', name: 'COPIUM' }, { id: '2', name: 'HOPIUM' }, { id: '3', name: 'HUH' },
  ], { source: 'test', setId: 'set' });
  const res = response();
  const policy = deriveEmotePolicy(res);
  const selected = selectEmoteForResponse({
    response: res, policy, inventory,
    snapshot: { emotes: [], emoteFamilies: [], emoteBearingFlags: [] }, seed: 'cope-test',
  });
  assert.ok(['COPIUM', 'HOPIUM'].includes(selected.alias));
});

test('zero-width emotes are never selected standalone', () => {
  const entry = classifyEmote({ id: 'z', name: 'COPIUM', flags: 1 });
  assert.equal(entry.standalone_ok, false);
});

test('manual meaning overrides prevent substring contamination', () => {
  const entry = classifyEmote({ id: 'eyes', name: 'MYEYES' });
  assert.ok(entry.expressions.includes('visual_pain'));
  assert.ok(!entry.expressions.includes('agreement'));
  assert.ok(!entry.expressions.includes('approval'));
});

test('observed room emotes retain distinct conversational functions', () => {
  const xxd = classifyEmote({ id: 'x', name: 'xxd' });
  const sadKek = classifyEmote({ id: 's', name: 'sadKEK' });
  const police = classifyEmote({ id: 'p', name: 'PepePolice' });
  assert.ok(xxd.expressions.includes('goofy_irony'));
  assert.ok(sadKek.expressions.includes('self_own'));
  assert.ok(police.expressions.includes('mock_enforcement'));
});

test('reviewed compound phrases require every active alias', () => {
  const complete = inspectEmoteInventory([
    { id: '1', name: 'xxd' }, { id: '2', name: 'Clap' }, { id: '3', name: 'CrayonTime' },
  ], { source: 'test', setId: 'set' });
  const incomplete = inspectEmoteInventory([{ id: '1', name: 'xxd' }], { source: 'test', setId: 'set' });
  assert.ok(complete.compounds.some((item) => item.output === 'xxd Clap'));
  assert.ok(complete.compounds.some((item) => item.output === 'xxd CrayonTime'));
  assert.equal(incomplete.compounds.length, 0);
});

test('compound selection is reviewed and semantically gated', () => {
  const inventory = inspectEmoteInventory([
    { id: '1', name: 'xxd' }, { id: '2', name: 'Clap' }, { id: '3', name: 'HUH' },
  ], { source: 'test', setId: 'set' });
  const res = response({
    text: 'Emerald expertise has entered the building.',
    reply_move: 'confirm_then_undercut',
    payoff_family: 'recognition',
    verdict: 'unknown',
  });
  const policy = {
    ...deriveEmotePolicy(res),
    expressions_any: ['mock_applause', 'goofy_irony', 'approval'],
    expressions_preferred: ['mock_applause', 'goofy_irony'],
    discourse_functions_any: ['mock_applause', 'mock_pride'],
    compound_roles_any: ['mock_applause', 'mock_pride'],
    target_contexts: ['identity_answer'],
    compound_preferred: true,
  };
  const selected = selectEmoteForResponse({
    response: res, policy, inventory,
    snapshot: { emotes: [], emoteFamilies: [], emoteBearingFlags: [] }, seed: 'compound-test',
  });
  assert.equal(selected.compound, true);
  assert.equal(selected.output, 'xxd Clap');
  assert.deepEqual(selected.tokens, ['xxd', 'Clap']);
});

test('serious answers cannot select compound mockery', () => {
  const inventory = inspectEmoteInventory([{ id: '1', name: 'xxd' }, { id: '2', name: 'Clap' }], { source: 'test', setId: 'set' });
  const res = response({ seriousness: 3, text: 'Secure the next step first.', reply_move: 'instruction', payoff_family: 'utility' });
  const policy = { ...deriveEmotePolicy(res), compound_preferred: true, compound_roles_any: ['mock_applause'] };
  const selected = selectEmoteForResponse({
    response: res, policy, inventory,
    snapshot: { emotes: [], emoteFamilies: [], emoteBearingFlags: [] }, seed: 'serious-compound',
  });
  assert.notEqual(selected.compound, true);
});

test('positive quiet-haters line does not become a doom reaction because of the word gone', () => {
  const res = response({
    text: 'The haters have gone quiet. Suspicious.',
    verdict: 'outlook_good',
    reply_move: 'confirm_then_undercut',
    payoff_family: 'recognition',
    concepts_any: ['game_outcome_question'],
  });
  const policy = deriveEmotePolicy(res, {
    concepts: [{ label: 'game_outcome_question', confidence: 1 }],
    domains: [{ label: 'current_game', confidence: 1 }],
    states: [],
    route_family: 'game_outcome_question',
  });
  assert.ok(!policy.context_tags.includes('negative_outcome'));
  assert.ok(!policy.expressions_preferred.includes('doom'));
  assert.ok(!policy.expressions_preferred.includes('failure'));
});

test('viewer games cannot borrow the xxd CrayonTime compound from unrelated roast contexts', () => {
  const inventory = inspectEmoteInventory([
    { id: '1', name: 'xxd' }, { id: '2', name: 'CrayonTime' }, { id: '3', name: 'PauseChamp' },
  ], { source: 'test', setId: 'set' });
  const res = response({
    text: 'Chat has volunteered five new loss conditions.',
    verdict: 'yes',
    delivery: 'room_lore',
    reply_move: 'deadpan_diagnosis',
    payoff_family: 'recognition',
    concepts_any: ['viewer_games'],
  });
  const policy = {
    ...deriveEmotePolicy(res, {
      concepts: [{ label: 'viewer_games', confidence: 1 }],
      domains: [{ label: 'room_lore', confidence: 1 }],
      states: [],
      route_family: 'viewer_games',
    }),
    compound_preferred: true,
  };
  const selected = selectEmoteForResponse({
    response: res, policy, inventory,
    snapshot: { emotes: [], emoteFamilies: [], emoteBearingFlags: [] }, seed: 'viewer-compound-block',
  });
  assert.notEqual(selected.output, 'xxd CrayonTime');
});

test('job decisions are quota-exempt and deliberately un-emoted', () => {
  const res = response({
    text: 'NO — anger is not severance pay.',
    verdict: 'no',
    delivery: 'direct',
    seriousness: 2,
    reply_move: 'deny_then_reframe',
    payoff_family: 'utility',
    concepts_any: ['job_decision'],
  });
  const policy = deriveEmotePolicy(res, {
    concepts: [{ label: 'job_decision', confidence: 1 }],
    domains: [{ label: 'work_money', confidence: 1 }],
    states: [],
    route_family: 'job_decision',
  });
  assert.equal(policy.quota_exempt, true);
  assert.equal(policy.base_probability_override, 0);
});

test('normal room replies cannot create a second consecutive plain answer', () => {
  const inventory = inspectEmoteInventory([
    { id: '1', name: 'COPIUM' }, { id: '2', name: 'HOPIUM' }, { id: '3', name: 'HUH' },
  ], { source: 'test', setId: 'set' });
  const res = response();
  const policy = deriveEmotePolicy(res);
  const selected = selectEmoteForResponse({
    response: res,
    policy,
    inventory,
    snapshot: { emotes: [], emoteFamilies: [], emoteBearingFlags: [true, false] },
    seed: 'plain-streak-guard',
  });
  assert.ok(selected.output);
  assert.equal(selected.forcedByPlainStreak, true);
});
