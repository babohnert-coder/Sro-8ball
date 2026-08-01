import fs from 'node:fs';
import { deriveEmotePolicy } from '../src/emote-policy.js';

const targets = [
  new URL('../data/runtime/responses.json', import.meta.url),
  new URL('../test/fixtures/test-response-pool.json', import.meta.url),
];

const lineOverrides = {
  love_question_01: ['smug', 'recognition'],
  love_question_02: ['confusion', 'smug'],
  love_question_03: ['smug', 'approval'],
  love_question_04: ['recognition', 'smug'],
  love_question_05: ['anticipation', 'smug'],
  love_question_06: ['disbelief', 'smug'],
  bot_completion_01: ['waiting', 'smug'],
  bot_completion_02: ['waiting', 'anticipation'],
  bot_completion_03: ['smug', 'waiting'],
  bot_completion_04: ['waiting', 'anticipation'],
  bot_completion_05: ['recognition', 'waiting'],
  bot_completion_06: ['waiting', 'smug'],
  creator_collab_money_01: ['suspicion', 'smug'],
  creator_collab_money_02: ['smug', 'recognition'],
  creator_collab_money_03: ['suspicion', 'recognition'],
  creator_collab_money_04: ['smug', 'recognition'],
  creator_collab_money_05: ['recognition', 'suspicion'],
  creator_collab_money_06: ['suspicion', 'smug'],
};

let total = 0;
let overridden = 0;
for (const target of targets) {
  if (!fs.existsSync(target)) continue;
  const payload = JSON.parse(fs.readFileSync(target, 'utf8'));
  for (const response of payload.responses ?? []) {
    const concepts = response.concepts_any ?? [];
    const syntheticBundle = {
      concepts: concepts.map((label) => ({ label, confidence: 1 })),
      states: [],
      route_family: concepts[0] ?? null,
    };
    response.emote_policy = deriveEmotePolicy(response, syntheticBundle);
    const preferred = lineOverrides[response.id];
    if (preferred) {
      response.emote_policy.expressions_preferred = preferred;
      response.emote_policy.expressions_any = [...new Set([
        ...preferred,
        ...response.emote_policy.expressions_any,
      ])];
      overridden += 1;
    }
    response.editorial_notes = String(response.editorial_notes ?? '')
      .replace(/\s*V4\.8 integrated emote contract applied\.?/g, '')
      .trim();
    response.editorial_notes = `${response.editorial_notes}${response.editorial_notes ? ' ' : ''}V4.8 integrated emote contract applied.`;
    total += 1;
  }
  payload.version = '4.8.0';
  payload.emote_policy = {
    ...(payload.emote_policy ?? {}),
    model: 'authored_line_policy_intersected_with_route_context_then_active_set_rng',
  };
  fs.writeFileSync(target, `${JSON.stringify(payload, null, 2)}\n`);
}
console.log(`Applied V4.8 integrated emote contracts to ${total} responses; ${overridden} line-level refinements.`);
