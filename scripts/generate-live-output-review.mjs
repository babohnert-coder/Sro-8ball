import fs from 'node:fs';
import path from 'node:path';
import { OracleRuntime } from '../src/runtime.js';
import { InMemoryStore } from '../src/memory/in-memory.js';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const fixtures = JSON.parse(fs.readFileSync(path.join(root, 'test/fixtures/golden-router-pilot.json'), 'utf8')).fixtures;
const integrationPrompts = [
  ['i001', 'good gold reset?'],
  ['i002', 'mana diff?'],
  ['i003', 'NA wave clear?'],
  ['i004', 'easy penta?'],
  ['i005', 'let him cook?'],
  ['i006', 'viewer games?'],
  ['i007', 'how much are they paying Mike for that collab'],
  ['i008', 'when will you be finished'],
  ['i009', 'are you fucking high'],
  ['i010', 'mods ban?'],
  ['i011', 'do you love me'],
].map(([id, input]) => ({ id, input, expected: { intent: 'integration' } }));
const reviewFixtures = [...fixtures.filter((fixture) => fixture.expected.intent !== 'command_help'), ...integrationPrompts];
const memory = new InMemoryStore();
const runtime = new OracleRuntime({ mode: 'production', env: { ...process.env, DISABLE_7TV_FETCH: '1' }, memory });
const rows = [];
const deliveryCounts = {};
const emoteCounts = {};
let emoteBearing = 0;

for (const fixture of reviewFixtures) {
  const outputs = [];
  for (let i = 0; i < 3; i += 1) {
    const result = await runtime.answer({ inquiry: fixture.input, userId: `review-${fixture.id}`, seed: `review-${fixture.id}-${i}`, debug: true });
    outputs.push({
      text: result.text,
      delivery: result.selectedGrammar ? result.candidates.find((item) => item.responseId === result.responseId)?.delivery ?? null : null,
      responseId: result.responseId,
      emote: result.emotes.selected?.alias ?? null,
      emoteFamily: result.emotes.selected?.family ?? null,
      route: result.routeKey,
      routeFamily: result.bundle.route_family,
      matchTier: result.highestMatchTier,
    });
    const candidate = result.candidates.find((item) => item.responseId === result.responseId);
    const delivery = candidate?.delivery ?? 'selected';
    deliveryCounts[delivery] = (deliveryCounts[delivery] ?? 0) + 1;
    if (result.emotes.selected?.alias) {
      emoteBearing += 1;
      emoteCounts[result.emotes.selected.alias] = (emoteCounts[result.emotes.selected.alias] ?? 0) + 1;
    }
  }
  rows.push({ fixture, outputs });
}

const out = [];
out.push('# SRO 8 Ball Live Output Review');
out.push('');
out.push('Three sequential outputs from the production runtime for every non-help golden inquiry. The same shared memory instance is used so route, humor-grammar, emote-ratio, and emote-repeat controls remain active.');
out.push('');
out.push(`- Outputs reviewed: ${rows.length * 3}`);
out.push(`- Emote-bearing outputs: ${emoteBearing} (${(emoteBearing / (rows.length * 3) * 100).toFixed(1)}%)`);
out.push(`- Unique emotes used: ${Object.keys(emoteCounts).length}`);
out.push('');
for (const row of rows) {
  out.push(`## ${row.fixture.id}: ${row.fixture.input}`);
  out.push(`- Route: \`${row.outputs[0]?.route ?? 'unknown'}\``);
  out.push(`- Family: \`${row.outputs[0]?.routeFamily ?? 'unknown'}\`; highest match tier: ${row.outputs[0]?.matchTier ?? 'unknown'}`);
  for (const output of row.outputs) {
    const emoteNote = output.emote ? ` — emote: \`${output.emote}\` (${output.emoteFamily})` : ' — no emote';
    out.push(`- ${output.text} _(id: ${output.responseId}${emoteNote})_`);
  }
  out.push('');
}
fs.writeFileSync(path.join(root, 'reports/live-output-review.md'), `${out.join('\n')}\n`);
console.log(`Wrote ${rows.length * 3} outputs; ${emoteBearing} with emotes; ${Object.keys(emoteCounts).length} unique emotes.`);
