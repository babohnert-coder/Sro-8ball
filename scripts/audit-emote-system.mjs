import fs from 'node:fs';
import assert from 'node:assert/strict';
import { OracleRuntime } from '../src/runtime.js';
import { InMemoryStore } from '../src/memory/index.js';
import { getActiveEmotes } from '../src/emotes.js';

const responses = JSON.parse(fs.readFileSync(new URL('../data/runtime/responses.json', import.meta.url), 'utf8')).responses;
assert.ok(responses.length > 0, 'response bank missing');
for (const response of responses) {
  assert.ok(response.emote_policy, `missing emote policy: ${response.id}`);
  assert.ok(response.emote_policy.expressions_any.length > 0, `empty emote expression policy: ${response.id}`);
}

const env = { ...process.env, DISABLE_7TV_FETCH: '1' };
const active = await getActiveEmotes(env);
assert.ok(active.inventory.totalCount >= 50, 'fallback semantic inventory too small');
assert.equal(active.inventory.entries.every((entry) => entry.expressions.length > 0), true, 'every emote must have an expression family');
assert.equal(active.inventory.entries.filter((entry) => entry.zero_width).length, 0, 'fallback inventory must be standalone');
assert.ok(active.inventory.compoundCount >= 2, 'reviewed compounds missing');

const runtime = new OracleRuntime({ mode: 'production', env, memory: new InMemoryStore() });
const prompts = [
  'will Mike win', 'is this game doomed', 'is this build troll', 'can he hit masters',
  'was that worth', 'should he flip baron', 'why did he flash', 'doubt or believe',
  'where is misanthrope', 'why is mtf such a hater', 'does bones put pineapple on pizza',
  'will the comeback happen', 'is renekton good here', 'should he keep cooking',
  'is top free', 'did he give the shutdown', 'viewer games?', 'do you love me',
  'what happens next', 'is this a good idea', 'are you fucking high', 'mods ban?',
  'when will you be finished', 'is JohnWestGamer winning', 'is this Feedmax'
];
const outputs = [];
for (let index = 0; index < 240; index += 1) {
  outputs.push(await runtime.answer({ inquiry: prompts[index % prompts.length], userId: `emote-audit-${index}`, seed: `emote-audit-${index}`, debug: true }));
}

const flags = outputs.map((item) => Boolean(item.emotes?.selected?.output ?? item.emotes?.selected?.alias));
for (let start = 0; start <= flags.length - 20; start += 1) {
  const count = flags.slice(start, start + 20).filter(Boolean).length;
  assert.ok(count >= 14, `rolling emote target failed at ${start}: ${count}/20`);
}
assert.equal(flags.some((flag, index) => !flag && flags[index - 1] === false), false, 'normal replies contained consecutive plain outputs');

const selectedDecisions = outputs.map((item) => item.emotes?.selected).filter((item) => item?.output ?? item?.alias);
const selectedOutputs = selectedDecisions.map((item) => item.output ?? item.alias);
assert.ok(new Set(selectedOutputs).size >= 15, `insufficient emote variety: ${new Set(selectedOutputs).size}`);
const compounds = selectedDecisions.filter((item) => item.compound);
assert.ok(compounds.length >= 1, 'reviewed compounds never surfaced');

const invalid = selectedDecisions.filter((item) => {
  const tokens = item.tokens?.length ? item.tokens : [item.alias];
  return tokens.some((token) => !active.set.has(token));
});
assert.equal(invalid.length, 0, 'selected emote token outside active inventory');

const semanticMismatches = outputs.filter((item) => {
  const selected = item.emotes?.selected;
  if (!(selected?.output ?? selected?.alias)) return false;
  const policy = item.emotePolicy;
  if (!policy) return true;
  if (!(policy.expressions_any ?? []).includes(selected.family)) return true;
  if (selected.family === 'hidden_nonsense' && !policy.allow_hidden_nonsense) return true;
  if (item.selectedGrammar?.replyMove === 'instruction' && item.bundle?.states?.some((state) => state.label === 'serious') && selected.compound) return true;
  return false;
});
assert.equal(semanticMismatches.length, 0, 'selected emote outside response expression policy');

const report = `# V5.0.2 Contextual Emote System Audit\n\n- Responses with emote policy: ${responses.length}/${responses.length}\n- Fallback active aliases: ${active.inventory.totalCount}\n- Fallback categorized aliases: ${active.inventory.categorizedCount}\n- Reviewed compound phrases available: ${active.inventory.compoundCount}\n- Replies simulated: ${outputs.length}\n- Emote-bearing replies: ${flags.filter(Boolean).length} (${(flags.filter(Boolean).length / flags.length * 100).toFixed(1)}%)\n- Unique selected emote outputs: ${new Set(selectedOutputs).size}\n- Compound-emote replies: ${compounds.length} (${(compounds.length / outputs.length * 100).toFixed(1)}%)\n- Every rolling 20 replies contained at least 14 emotes: yes\n- Consecutive plain normal replies: none\n- Semantic mismatch selections: ${semanticMismatches.length}\n- Out-of-set token selections: ${invalid.length}\n`;
fs.writeFileSync(new URL('../reports/EMOTE_SYSTEM_AUDIT_V4_9.md', import.meta.url), report);
console.log(report);
