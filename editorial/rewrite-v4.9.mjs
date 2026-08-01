import fs from 'node:fs';
import { deriveEmotePolicy } from '../src/emote-policy.js';

const targets = [
  new URL('../data/runtime/responses.json', import.meta.url),
  new URL('../test/fixtures/test-response-pool.json', import.meta.url),
];

let total = 0;
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
    response.editorial_notes = String(response.editorial_notes ?? '')
      .replace(/\s*V4\.9 contextual emote grammar applied\.?/g, '')
      .trim();
    response.editorial_notes = `${response.editorial_notes}${response.editorial_notes ? ' ' : ''}V4.9 contextual emote grammar applied.`;
    total += 1;
  }
  payload.version = '4.9.0';
  payload.emote_policy = {
    ...(payload.emote_policy ?? {}),
    active_set_id: '01GBAYMGX0000B23ECE97RP321',
    model: 'route_and_authored_expression_to_active_single_or_reviewed_compound',
    compound_policy: 'reviewed_only_no_random_concatenation',
  };
  fs.writeFileSync(target, `${JSON.stringify(payload, null, 2)}\n`);
}
console.log(`Applied V4.9 contextual emote grammar to ${total} responses.`);
