import test from 'node:test';
import assert from 'node:assert/strict';
import { OracleRuntime } from '../src/runtime.js';
import { InMemoryStore } from '../src/memory/in-memory.js';
import { recognizeInquiry } from '../src/recognition/index.js';

const env = { ...process.env, DISABLE_7TV_FETCH: '1' };

async function answer(inquiry) {
  const runtime = new OracleRuntime({ mode: 'production', env, memory: new InMemoryStore() });
  return runtime.answer({ inquiry, userId: `answer-shape-${inquiry}`, seed: `answer-shape:${inquiry}`, debug: true });
}

function assertSelectedPrefix(result, prefix) {
  assert.ok(
    result.responseId?.startsWith(prefix),
    `${result.responseId} did not start with ${prefix}; text=${result.text}`,
  );
}

function assertAdmittedPrefix(result, prefix) {
  assert.ok(result.candidates?.length > 0, 'debug candidates missing');
  const topTier = result.highestMatchTier ?? Math.max(...result.candidates.map((candidate) => candidate.matchTier ?? 0));
  const admitted = result.candidates.filter((candidate) => (candidate.matchTier ?? 0) === topTier);
  assert.ok(
    admitted.every((candidate) => candidate.responseId.startsWith(prefix)),
    `admitted family was not ${prefix}: ${admitted.map((candidate) => candidate.responseId).join(', ')}`,
  );
}

test('comparison form outranks named room-person lore', async () => {
  for (const inquiry of ['John West or East?', 'JohnWestGamer or Teamplay?', 'MTF or Bones?']) {
    const result = await answer(inquiry);
    assert.equal(result.bundle.intent.label, 'comparison');
    assert.equal(result.bundle.route_family, 'answer_shape:comparison');
    assertAdmittedPrefix(result, 'general_comparison_');
    assertSelectedPrefix(result, 'general_comparison_');
    assert.match(result.text, /^(THE FIRST|THE SECOND|NEITHER|BOTH|UNCLEAR|OUTLOOK UNCLEAR)\b/);
  }
});

test('location and timing forms outrank named room-person lore', async () => {
  const location = await answer('where is MTF?');
  assert.equal(location.bundle.intent.label, 'location');
  assert.equal(location.bundle.route_family, 'answer_shape:location');
  assertAdmittedPrefix(location, 'general_location_');
  assertSelectedPrefix(location, 'general_location_');
  assert.match(location.text, /^(NEARBY|ELSEWHERE|HERE|THERE|ASK AGAIN LATER|CLOSER THAN EXPECTED)\b/);

  const timing = await answer('when will JohnWestGamer win?');
  assert.equal(timing.bundle.intent.label, 'timing');
  assert.equal(timing.bundle.route_family, 'answer_shape:timing');
  assertAdmittedPrefix(timing, 'general_timing_');
  assertSelectedPrefix(timing, 'general_timing_');
  assert.match(timing.text, /^(SOON|NOT YET|ASK AGAIN LATER|UNCLEAR)\b/);
});

test('prediction, quantity-shaped prediction, and yes/no forms do not select entity-only lore', async () => {
  const prediction = await answer('will JohnWestGamer win?');
  assert.equal(prediction.bundle.intent.label, 'prediction');
  assert.equal(prediction.bundle.route_family, 'answer_shape:prediction');
  assertAdmittedPrefix(prediction, 'general_prediction_');
  assertSelectedPrefix(prediction, 'general_prediction_');
  assert.match(prediction.text, /^(YES|NO|MAYBE|LIKELY|UNLIKELY|OUTLOOK|ASK AGAIN LATER|NOT YET|VERY DOUBTFUL)\b/);

  const quantity = await answer('how many wins will JohnWestGamer get?');
  assert.equal(quantity.bundle.intent.label, 'prediction');
  assert.equal(quantity.bundle.route_family, 'answer_shape:prediction');
  assertAdmittedPrefix(quantity, 'general_prediction_');
  assertSelectedPrefix(quantity, 'general_prediction_');
  assert.doesNotMatch(quantity.responseId ?? '', /^john_west_/);

  const yesNo = await answer('is MTF British?');
  assert.equal(yesNo.bundle.intent.label, 'evaluation');
  assert.equal(yesNo.bundle.route_family, 'answer_shape:evaluation');
  assertAdmittedPrefix(yesNo, 'general_evaluation_');
  assertSelectedPrefix(yesNo, 'general_evaluation_');
  assert.match(yesNo.text, /^(YES|NO|MAYBE|OUTLOOK|THE SIGNS|VERY DOUBTFUL|LIKELY|UNLIKELY)\b/);
});

test('specific League and room-native concepts still outrank connective/question words', async () => {
  const cases = [
    ['why did he flash?', 'explanation', 'flash_use', 'flash_use_', /^(Walking|Because|He)\b/i],
    ['should Mike smite Baron?', 'permission', 'smite_objective', 'sro_smite_', /^(Only|No|Yes|Probably|Check)\b/i],
    ['how much are they paying Mike for that collab?', 'explanation', 'creator_collab_money', 'creator_collab_money_', /^(More|Less|Enough|Mike|Chat|Ask again)\b/i],
    ['doubt or believe?', 'comparison', 'room_doubters_believers', 'doubters_lore_', /^(Choose|Doubt|Believe|The)\b/i],
    ['let him cook?', 'reaction', 'reckless_commitment', 'reckless_commitment_', /^(Send|Let|The|Evidence|Yes|No|Maybe)\b/i],
  ];

  for (const [inquiry, intent, routeFamily, responsePrefix, answerShape] of cases) {
    const result = await answer(inquiry);
    assert.equal(result.bundle.intent.label, intent, inquiry);
    assert.equal(result.bundle.route_family, routeFamily, inquiry);
    assertAdmittedPrefix(result, responsePrefix);
    assertSelectedPrefix(result, responsePrefix);
    assert.match(result.text, answerShape);
  }
});

test('recognition exposes answer-shape route before named lore for clear forms', () => {
  const bundle = recognizeInquiry('where is JohnWestGamer?');
  assert.equal(bundle.intent.label, 'location');
  assert.equal(bundle.route_family, 'answer_shape:location');
  assert.ok(bundle.entities.some((entity) => entity.value === 'john_west_gamer'));
});
