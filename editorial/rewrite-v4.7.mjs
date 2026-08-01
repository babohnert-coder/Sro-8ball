import fs from 'node:fs';
import { deriveEmotePolicy } from '../src/emote-policy.js';

const manual = JSON.parse(fs.readFileSync(new URL('../data/emotes/manual-overrides.json', import.meta.url), 'utf8')).overrides;
const knownAliases = Object.keys(manual).sort((a, b) => b.length - a.length);

function extractPinnedEmote(response) {
  if (response.emote) return response.emote;
  for (const alias of knownAliases) {
    if (!response.text.endsWith(` ${alias}`)) continue;
    response.text = response.text.slice(0, -(alias.length + 1)).trimEnd();
    response.emote = alias;
    return alias;
  }
  return null;
}

const targets = [
  new URL('../data/runtime/responses.json', import.meta.url),
  new URL('../test/fixtures/test-response-pool.json', import.meta.url),
];
let total = 0;
let pinned = 0;
for (const path of targets) {
  if (!fs.existsSync(path)) continue;
  const payload = JSON.parse(fs.readFileSync(path, 'utf8'));
  for (const response of payload.responses ?? []) {
    if (extractPinnedEmote(response)) pinned += 1;
    response.emote_policy = deriveEmotePolicy(response);
    response.editorial_notes = String(response.editorial_notes ?? '')
      .replace(/\s*V4\.7 emote policy applied\.?/g, '')
      .trim();
    response.editorial_notes = `${response.editorial_notes}${response.editorial_notes ? ' ' : ''}V4.7 emote policy applied.`;
    total += 1;
  }
  payload.version = '4.7.0';
  payload.emote_policy = {
    active_set_id: '01GBAYMGX0000B23ECE97RP321',
    minimum_rolling_ratio: 0.60,
    rolling_window: 20,
    model: 'answer_act_then_expression_family_then_active_set_rng',
  };
  fs.writeFileSync(path, `${JSON.stringify(payload, null, 2)}\n`);
}
console.log(`Applied V4.7 emote policies to ${total} responses; ${pinned} pinned pairings.`);
