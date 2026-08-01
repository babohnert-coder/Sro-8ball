import assert from 'node:assert/strict';
import test from 'node:test';
import { OracleRuntime } from '../src/runtime.js';
import { InMemoryStore } from '../src/memory/in-memory.js';

async function replay(inquiry, count = 18) {
  const runtime = new OracleRuntime({ mode: 'production', memory: new InMemoryStore() });
  const outputs = [];
  for (let index = 0; index < count; index += 1) {
    outputs.push(await runtime.answer({ inquiry, userId: 'live-regression', debug: true, seed: `${inquiry}:${index}` }));
  }
  return outputs;
}

test('live transcript: SRO tomorrow predictions stay SRO-shaped', async () => {
  const outputs = await replay('how will sro do tomorrow');
  assert.ok(outputs.every((item) => item.responseId.startsWith('sro_future_performance_')));
});

test('live transcript: named either-or answers name one supplied side', async () => {
  const outputs = await replay('john east or john west');
  assert.ok(outputs.every((item) => /^(JOHN EAST|JOHN WEST)\b/i.test(item.text)));
});

test('live transcript: gamba outcome answers win or loss', async () => {
  const outputs = await replay('gamba win or losed');
  assert.ok(outputs.every((item) => /^(WIN|LOSS)\b/i.test(item.text)));
});

test('live transcript: person problem does not admit location replies', async () => {
  const outputs = await replay('is misanthrope a problem');
  assert.ok(outputs.every((item) => item.responseId.startsWith('misanthrope_problem_')));
  assert.ok(outputs.every((item) => /^(YES|NO|MAYBE|OUTLOOK|WITHOUT)\b/i.test(item.text)));
});

test('live transcript: person appearance gets a direct verdict', async () => {
  const outputs = await replay('is davey handsome');
  assert.ok(outputs.every((item) => item.responseId.startsWith('person_appearance_')));
  assert.ok(outputs.every((item) => /^(YES|NO|MAYBE|OUTLOOK|THE SIGNS)\b/i.test(item.text)));
});

test('live transcript: win question is prediction-shaped', async () => {
  const outputs = await replay('do we win these');
  assert.ok(outputs.every((item) => item.bundle.intent.label === 'prediction'));
});

test('live transcript: Bones pizza replies state an oracle verdict', async () => {
  const outputs = await replay('does bonesex eat pineapple on pizza');
  assert.ok(outputs.every((item) => item.responseId.startsWith('bones_food_')));
  assert.ok(outputs.every((item) => /^(YES|NO|MAYBE|ASK AGAIN)\b/i.test(item.text)));
});

test('live transcript: short room sequence visibly incorporates contextual emotes', async () => {
  const inquiries = [
    'how will sro do tomorrow',
    'is mtf british',
    'is misanthrope a problem',
    'john east or john west',
    'is davey handsome',
    'do we win these',
    'gamba win or losed',
    'does bonesex eat pineapple on pizza',
  ];
  const env = { ...process.env, DISABLE_7TV_FETCH: '1' };
  const runtime = new OracleRuntime({ mode: 'production', env, memory: new InMemoryStore() });
  const outputs = [];
  for (let index = 0; index < inquiries.length; index += 1) {
    outputs.push(await runtime.answer({
      inquiry: inquiries[index],
      userId: 'live-emote-regression',
      debug: true,
      seed: `live-emote-regression:${index}`,
    }));
  }
  const flags = outputs.map((item) => Boolean(item.emotes?.selected?.output));
  assert.ok(flags.filter(Boolean).length >= 6, `expected at least 6/8 emote-bearing replies; got ${flags.filter(Boolean).length}/8`);
  assert.equal(flags.some((flag, index) => !flag && flags[index - 1] === false), false, 'normal room sequence contained consecutive plain replies');
});
