import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { recognizeInquiry } from '../src/recognition/index.js';
import { getEligibleResponses } from '../src/selection/eligibility.js';
import { scoreEligibleResponse, emptyVarietySnapshot } from '../src/selection/scoring.js';
import { selectResponse, buildRouteKey } from '../src/selection/select.js';
import { InMemoryStore } from '../src/memory/in-memory.js';
import { FileMemoryStore } from '../src/memory/file.js';
import { validateResponsePool } from '../src/validation/index.js';
import { loadRuntimeData } from '../src/data.js';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const responses = JSON.parse(fs.readFileSync(path.join(root, 'data/runtime/responses.json'), 'utf8')).responses;
const fixtures = JSON.parse(fs.readFileSync(path.join(root, 'test/fixtures/golden-router-pilot.json'), 'utf8')).fixtures;
const cfg = loadRuntimeData();
const failures = [];
const warnings = [];
const sections = [];

function fail(message) { failures.push(message); }
function warn(message) { warnings.push(message); }
function pct(n, d) { return d ? `${(100 * n / d).toFixed(1)}%` : '0.0%'; }
function normalizeText(text) { return text.toLowerCase().replace(/[—–-]/g, '-').replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim(); }
function jaccard(a, b) {
  const A = new Set(normalizeText(a).split(' ').filter(Boolean));
  const B = new Set(normalizeText(b).split(' ').filter(Boolean));
  const inter = [...A].filter((x) => B.has(x)).length;
  const union = new Set([...A, ...B]).size;
  return union ? inter / union : 0;
}

const validation = validateResponsePool(responses);
if (!validation.valid) fail(`Response schema invalid: ${validation.errors.join('; ')}`);
const approved = responses.filter((r) => r.status === 'approved');
if (approved.length !== responses.length) fail(`Non-approved responses in production bank: ${responses.length - approved.length}`);

const exactGroups = new Map();
for (const response of responses) {
  const key = normalizeText(response.text);
  exactGroups.set(key, [...(exactGroups.get(key) ?? []), response.id]);
}
const exactDuplicates = [...exactGroups.entries()].filter(([, ids]) => ids.length > 1);
if (exactDuplicates.length) fail(`Exact normalized duplicate groups: ${exactDuplicates.length}`);

const nearDuplicates = [];
for (let i = 0; i < responses.length; i += 1) {
  for (let j = i + 1; j < responses.length; j += 1) {
    const a = responses[i]; const b = responses[j];
    if (a.semantic_family === b.semantic_family && jaccard(a.text, b.text) >= 0.84) {
      nearDuplicates.push([a.id, b.id, jaccard(a.text, b.text)]);
    }
  }
}
if (nearDuplicates.length > 12) warn(`Near-duplicate pairs within semantic families: ${nearDuplicates.length}`);

const bannedPatterns = [
  /\boperational\b/i, /\bdeployment\b/i, /\brepository\b/i, /\bdetected\b/i,
  /\bpending review\b/i, /\bstatistically\b/i, /\becosystem\b/i, /\bsystems? green\b/i,
  /\binput quality\b/i, /\bproduction access\b/i,
  /\bverified lore\b/i, /\bverified biography\b/i, /\brecognized chatter\b/i,
];
const aiVoice = responses.filter((r) => bannedPatterns.some((p) => p.test(r.text)));
if (aiVoice.length) fail(`AI/software-voice responses remain: ${aiVoice.map((r) => r.id).join(', ')}`);

const long = responses.filter((r) => r.text.length > 160);
if (long.length) fail(`Responses over 160 chars: ${long.map((r) => `${r.id}(${r.text.length})`).join(', ')}`);
const maxLength = Math.max(...responses.map((r) => r.text.length));
const verdictOpening = /^(YES|NO|MAYBE|NOT YET|OUTLOOK GOOD|OUTLOOK UNCLEAR|VERY DOUBTFUL|LIKELY|UNLIKELY|ASK AGAIN LATER|THE SIGNS SAY YES|THE SIGNS SAY NO|UNCLEAR|SOON|BECAUSE|THE FIRST|THE SECOND|NEITHER|BOTH|RENEKTON|JAX)\b/;
const verdictPrefixed = responses.filter((r) => verdictOpening.test(r.text)).length;
const plainFinished = responses.length - verdictPrefixed;
const deliberatelyRewrittenV45 = responses.filter((r) => String(r.editorial_notes ?? '').includes('Deliberately reviewed and rebuilt for V4.5.')).length;
const deliberatelyRewrittenV46 = responses.filter((r) => String(r.editorial_notes ?? '').includes('Deliberately rewritten for V4.6 humor grammar.')).length;
const deliberatelyRewritten = deliberatelyRewrittenV45 + deliberatelyRewrittenV46;
const newExactRoomRoutes = responses.filter((r) => /New exact live-room route added during the V4\.5 rebuild\.|V4\.6 humor grammar reviewed/.test(r.editorial_notes ?? '') && /bones_pizza|mtf_hater|doubters_lore/.test(r.id)).length;
if (plainFinished / responses.length < 0.60) fail(`Plain finished response share below 60%: ${pct(plainFinished, responses.length)}`);

const byDelivery = Object.fromEntries(['classic', 'direct', 'contextual', 'dry', 'room_lore', 'chaos'].map((d) => [d, responses.filter((r) => r.delivery === d).length]));
const byVerdict = {};
for (const r of responses) byVerdict[r.verdict] = (byVerdict[r.verdict] ?? 0) + 1;

function eligibleAndAdmitted(bundle, mode = 'production') {
  const eligibility = getEligibleResponses(bundle, responses, mode, new Set());
  const eligible = eligibility.filter((x) => x.eligible).map((x) => x.response);
  const snapshot = emptyVarietySnapshot();
  const scored = eligible
    .map((response) => ({ response, score: scoreEligibleResponse(bundle, response, snapshot) }))
    .filter((x) => x.score.relevanceSubtotal >= cfg.selectionConfig.relevance_floor)
    .sort((a, b) => b.score.relevanceSubtotal - a.score.relevanceSubtotal || a.response.id.localeCompare(b.response.id));
  const normal = scored.filter((x) => x.response.delivery !== 'chaos');
  const best = normal.length ? Math.max(...normal.map((x) => x.score.relevanceSubtotal)) : -Infinity;
  const admitted = normal.filter((x) => x.score.relevanceSubtotal >= best - cfg.selectionConfig.pool_admission_band);
  return { eligibility, eligible, scored, admitted };
}

const coverage = [];
for (const fixture of fixtures) {
  if (fixture.expected.intent === 'command_help') continue;
  const bundle = recognizeInquiry(fixture.input);
  const { admitted } = eligibleAndAdmitted(bundle);
  coverage.push({ id: fixture.id, input: fixture.input, routeKey: buildRouteKey(bundle), admitted: admitted.length, ids: admitted.map((x) => x.response.id) });
  if (admitted.length < 4) fail(`${fixture.id} has only ${admitted.length} normal admitted responses: ${fixture.input}`);
}

const maxAdmittedPool = Math.max(...coverage.map((row) => row.admitted));
if (cfg.memoryConfig.windows.path_exact_response_count < maxAdmittedPool) {
  fail(`Route history window ${cfg.memoryConfig.windows.path_exact_response_count} is smaller than admitted pool ${maxAdmittedPool}`);
}

const falsePositiveCases = [
  ['can you carry groceries', ['current_game','sro','rank_climb','builds_items_runes','champion_matchup','lane_wave_state','player_role_performance','objective_macro','fight_dive_trade_shutdown']],
  ['should I build a deck', ['builds_items_runes']],
  ['should I cook dinner', ['builds_items_runes']],
  ['is this worth buying', ['fight_dive_trade_shutdown','builds_items_runes']],
  ['will it rain', ['current_game','objective_macro']],
  ['can you carry this box', ['current_game','player_role_performance']],
  ['can Mike carry groceries', ['current_game']],
  ['should Mike cook dinner', ['builds_items_runes']],
  ['can I scale this recipe', ['player_role_performance']],
  ['should I proxy this request', ['lane_wave_state']],
];
const falsePositiveResults = [];
for (const [input, forbidden] of falsePositiveCases) {
  const bundle = recognizeInquiry(input);
  const domains = new Set(bundle.domains.map((d) => d.label));
  const leaked = forbidden.filter((d) => domains.has(d));
  falsePositiveResults.push({ input, primary: bundle.domains[0]?.label, concepts: bundle.concepts.map((c) => c.label), leaked });
  if (leaked.length) fail(`False League routing for "${input}": ${leaked.join(', ')}`);
}

async function cycleTest(input, countExtra = 2) {
  const bundle = recognizeInquiry(input);
  const { admitted } = eligibleAndAdmitted(bundle);
  const memory = new InMemoryStore();
  const selected = [];
  for (let i = 0; i < admitted.length + countExtra; i += 1) {
    const result = await selectResponse({ bundle, responses, memory, userId: 'cycle-audit', seed: `cycle:${input}:${i}`, mode: 'production' });
    selected.push(result.responseId);
  }
  const firstCycle = selected.slice(0, admitted.length);
  if (new Set(firstCycle).size !== admitted.length) fail(`Cycle repeated before exhaustion for "${input}": ${firstCycle.join(', ')}`);
  if (selected[admitted.length] === firstCycle.at(-1)) fail(`Cycle boundary immediately repeated for "${input}"`);
  return { input, routeKey: buildRouteKey(bundle), poolSize: admitted.length, selected };
}

const cycleResults = [];
for (const input of ['will Mike win', 'what is the outcome of this game', 'is this build free', 'is this Feedmax', 'is Renekton good here', 'should I cook dinner']) {
  cycleResults.push(await cycleTest(input));
}

const variantInputs = ['will Mike win', 'will SRO win', 'is Mike going to win', 'can Mike win this game'];
const variantBundles = variantInputs.map(recognizeInquiry);
const variantKeys = variantBundles.map(buildRouteKey);
if (new Set(variantKeys).size !== 1) fail(`Equivalent SRO win phrasings do not share a route: ${variantKeys.join(' | ')}`);
const variantMemory = new InMemoryStore();
const variantSelected = [];
for (let i = 0; i < variantBundles.length; i += 1) {
  const result = await selectResponse({ bundle: variantBundles[i], responses, memory: variantMemory, userId: 'variant-user', seed: `variant-${i}`, mode: 'production' });
  variantSelected.push(result.responseId);
}
if (new Set(variantSelected).size !== variantSelected.length) fail(`Equivalent path variants repeated an answer: ${variantSelected.join(', ')}`);

const persistenceFile = path.join(os.tmpdir(), `sro8-audit-${process.pid}.json`);
try { fs.unlinkSync(persistenceFile); } catch {}
const persistenceBundle = recognizeInquiry('will Mike win');
const persistencePool = eligibleAndAdmitted(persistenceBundle).admitted.length;
const before = [];
let store = new FileMemoryStore(persistenceFile);
for (let i = 0; i < Math.min(5, persistencePool - 1); i += 1) {
  const result = await selectResponse({ bundle: persistenceBundle, responses, memory: store, userId: 'persistent-user', seed: `persist-before-${i}`, mode: 'production' });
  before.push(result.responseId);
}
store = new FileMemoryStore(persistenceFile);
const afterResult = await selectResponse({ bundle: persistenceBundle, responses, memory: store, userId: 'persistent-user', seed: 'persist-after-restart', mode: 'production' });
if (before.includes(afterResult.responseId)) fail(`File persistence lost unfinished route cycle after restart: ${afterResult.responseId}`);
try { fs.unlinkSync(persistenceFile); } catch {}

let chaosCount = 0;
const chaosPositions = [];
const chaosInput = 'will it rain';
const chaosBundle = recognizeInquiry(chaosInput);
const chaosMemory = new InMemoryStore();
for (let i = 0; i < 1000; i += 1) {
  const result = await selectResponse({ bundle: chaosBundle, responses, memory: chaosMemory, userId: `chaos-${i}`, seed: `chaos-seed-${i}`, mode: 'production' });
  if (result.chaosSelected) {
    chaosCount += 1;
    chaosPositions.push(i);
  }
}
const chaosRate = chaosCount / 1000;
if (chaosRate < 0.065 || chaosRate > 0.105) fail(`Scheduled chaos rate outside tolerance: ${pct(chaosCount, 1000)}`);
const chaosGaps = chaosPositions.slice(1).map((position, index) => position - chaosPositions[index]);
if (chaosGaps.some((gap) => gap < 10 || gap > 15)) fail(`Scheduled chaos gap outside 10-15: ${chaosGaps.join(', ')}`);

for (const input of ['am I cooked', 'should I quit my job']) {
  const bundle = recognizeInquiry(input);
  for (let i = 0; i < 100; i += 1) {
    const result = await selectResponse({ bundle, responses, memory: new InMemoryStore(), userId: `no-chaos-${i}`, seed: `${input}-${i}`, mode: 'production' });
    if (result.chaosSelected) fail(`Chaos selected for forbidden prompt "${input}"`);
  }
}

const isolationCases = [
  { input: 'should he take Baron', forbidden: /\bdragon\b|\bdrake\b/i },
  { input: 'is dragon a flip', forbidden: /\bbaron\b/i },
  { input: 'can he dive this', forbidden: /\btrade\b/i },
  { input: 'did he hit item spike', forbidden: /\bfeedmax\b|\bthumbnail\b/i },
  { input: 'should they flip Baron', forbidden: /\bdragon\b|\bdrake\b/i },
  { input: 'does this item scale', forbidden: /\bmatchup\b|\bchampion\b/i },
  { input: 'should Mike cook dinner', forbidden: /\bbuild\b|\bfeedmax\b|\bthumbnail\b/i },
  { input: 'can I scale this recipe', forbidden: /\blate game\b|\bteamfight\b|\bchampion\b/i },
];

const adversarialRoutingCases = [
  { input: 'can SRO still win', intent: 'prediction', primary: 'current_game', concepts: ['game_outcome_question'], forbidden: [] },
  { input: 'did he donate the shutdown', intent: 'evaluation', primary: 'fight_dive_trade_shutdown', concepts: ['shutdown_given'], forbidden: [] },
  { input: 'was that actually worth it', intent: 'evaluation', primary: 'fight_dive_trade_shutdown', concepts: ['worth_cope'], forbidden: [] },
  { input: 'is this build troll', intent: 'evaluation', primary: 'builds_items_runes', concepts: ['build_evaluation'], forbidden: [] },
  { input: 'should they flip Baron', intent: 'permission', primary: 'objective_macro', concepts: ['objective_flip'], forbidden: [] },
  { input: 'should he smite Baron', intent: 'permission', primary: 'objective_macro', concepts: ['smite_objective'], forbidden: [] },
  { input: 'can Mike carry this game', intent: 'prediction', primary: 'current_game', concepts: ['carry_game'], forbidden: [] },
  { input: 'can Mike build a house', intent: 'permission', primary: 'ordinary_life', concepts: ['structure_building'], forbidden: ['build_evaluation'] },
  { input: 'can Mike carry groceries', intent: 'permission', primary: 'food_health_outside', concepts: ['groceries_task'], forbidden: ['carry_game'] },
  { input: 'should Mike cook dinner', intent: 'permission', primary: 'food_health_outside', concepts: ['food_decision'], forbidden: ['experimental_build'] },
  { input: 'is Mike free tomorrow', intent: 'evaluation', primary: 'ordinary_life', concepts: ['availability_question'], forbidden: [] },
  { input: 'can I scale this recipe', intent: 'permission', primary: 'food_health_outside', concepts: ['recipe_scaling'], forbidden: ['scaling_question'] },
  { input: 'should I proxy this request', intent: 'permission', primary: 'general_oracle', concepts: [], forbidden: ['proxy_lane'] },
  { input: 'is top lane over', intent: 'evaluation', primary: 'lane_wave_state', concepts: ['lane_over'], forbidden: [] },
  { input: 'did he lose the wave', intent: 'evaluation', primary: 'lane_wave_state', concepts: ['wave_lost'], forbidden: [] },
  { input: 'does this item scale', intent: 'evaluation', primary: 'builds_items_runes', concepts: ['item_scaling'], forbidden: ['scaling_question'] },
  { input: 'did he run it down', intent: 'evaluation', primary: 'fight_dive_trade_shutdown', concepts: ['int_feed'], forbidden: [] },
];
const adversarialRoutingResults = [];
for (const item of adversarialRoutingCases) {
  const bundle = recognizeInquiry(item.input);
  const conceptSet = new Set(bundle.concepts.map((concept) => concept.label));
  const admitted = eligibleAndAdmitted(bundle).admitted.map((entry) => entry.response);
  const missing = item.concepts.filter((concept) => !conceptSet.has(concept));
  const forbidden = item.forbidden.filter((concept) => conceptSet.has(concept));
  adversarialRoutingResults.push({
    input: item.input,
    intent: bundle.intent.label,
    primary: bundle.domains[0]?.label,
    concepts: [...conceptSet],
    admitted: admitted.length,
  });
  if (bundle.intent.label !== item.intent) fail(`Adversarial intent mismatch for "${item.input}": ${bundle.intent.label}`);
  if (bundle.domains[0]?.label !== item.primary) fail(`Adversarial primary-domain mismatch for "${item.input}": ${bundle.domains[0]?.label}`);
  if (missing.length) fail(`Adversarial missing concepts for "${item.input}": ${missing.join(', ')}`);
  if (forbidden.length) fail(`Adversarial forbidden concepts for "${item.input}": ${forbidden.join(', ')}`);
  if (admitted.length < 4) fail(`Adversarial route has only ${admitted.length} admitted responses for "${item.input}"`);
}
const isolationResults = [];
for (const item of isolationCases) {
  const bundle = recognizeInquiry(item.input);
  const admitted = eligibleAndAdmitted(bundle).admitted.map((x) => x.response);
  const bad = admitted.filter((r) => item.forbidden.test(r.text));
  isolationResults.push({ input: item.input, admitted: admitted.map((r) => r.text), bad: bad.map((r) => r.id) });
  if (bad.length) fail(`Cross-contamination for "${item.input}": ${bad.map((r) => r.id).join(', ')}`);
}

const report = [];
report.push('# SRO 8 Ball Production Behavior Audit');
report.push('');
report.push(`- Production responses: ${responses.length}`);
report.push(`- Schema valid: ${validation.valid}`);
report.push(`- Exact normalized duplicates: ${exactDuplicates.length}`);
report.push(`- Near-duplicate pairs (same semantic family, Jaccard >= .84): ${nearDuplicates.length}`);
report.push(`- AI/software voice flags: ${aiVoice.length}`);
report.push(`- Maximum response length: ${maxLength}`);
report.push(`- Plain finished responses without forced oracle prefix: ${plainFinished} (${pct(plainFinished, responses.length)})`);
report.push(`- Explicit verdict-prefixed responses: ${verdictPrefixed} (${pct(verdictPrefixed, responses.length)})`);
report.push(`- Deliberately rewritten legacy responses: ${deliberatelyRewritten}`);
report.push(`- New exact live-room responses: ${newExactRoomRoutes}`);
report.push(`- Golden routes with >=4 normal admitted answers: ${coverage.filter((x) => x.admitted >= 4).length}/${coverage.length}`);
report.push(`- Largest admitted normal pool: ${maxAdmittedPool}`);
report.push(`- Route history capacity: ${cfg.memoryConfig.windows.path_exact_response_count}`);
report.push(`- Scheduled chaos rate over 1,000 eligible answers: ${pct(chaosCount, 1000)}`);
report.push(`- Scheduled chaos spacing: ${Math.min(...chaosGaps)}-${Math.max(...chaosGaps)} answers; consecutive chaos: 0`);
report.push(`- Failures: ${failures.length}`);
report.push(`- Warnings: ${warnings.length}`);
report.push('');
report.push('## Delivery distribution');
for (const [key, value] of Object.entries(byDelivery)) report.push(`- ${key}: ${value} (${pct(value, responses.length)})`);
report.push('');
report.push('## Verdict distribution');
for (const [key, value] of Object.entries(byVerdict).sort((a,b)=>b[1]-a[1])) report.push(`- ${key}: ${value}`);
report.push('');
report.push('## Route-cycle tests');
for (const result of cycleResults) {
  report.push(`### ${result.input}`);
  report.push(`- Route: \`${result.routeKey}\``);
  report.push(`- Qualified normal pool: ${result.poolSize}`);
  report.push(`- Sequence: ${result.selected.join(' -> ')}`);
}
report.push('');
report.push('## Equivalent phrasing chain');
report.push(`- Inputs: ${variantInputs.join(' | ')}`);
report.push(`- Route keys: ${variantKeys.join(' | ')}`);
report.push(`- Selected: ${variantSelected.join(' -> ')}`);
report.push('');
report.push('## Persistence restart test');
report.push(`- Before restart: ${before.join(' -> ')}`);
report.push(`- First after restart: ${afterResult.responseId}`);
report.push(`- Passed: ${!before.includes(afterResult.responseId)}`);
report.push('');
report.push('## False-positive traps');
for (const row of falsePositiveResults) report.push(`- ${row.input}: primary=${row.primary}; concepts=${row.concepts.join(', ') || 'none'}; leaked=${row.leaked.join(', ') || 'none'}`);
report.push('');
report.push('## Cross-contamination checks');
for (const row of isolationResults) {
  report.push(`### ${row.input}`);
  for (const text of row.admitted) report.push(`- ${text}`);
}
report.push('');
report.push('## Adversarial routing checks');
for (const row of adversarialRoutingResults) {
  report.push(`- ${row.input}: intent=${row.intent}; primary=${row.primary}; concepts=${row.concepts.join(', ') || 'none'}; admitted=${row.admitted}`);
}
report.push('');
report.push('## Coverage lows');
for (const row of [...coverage].sort((a,b)=>a.admitted-b.admitted).slice(0,20)) report.push(`- ${row.id} (${row.admitted}): ${row.input}`);
if (warnings.length) {
  report.push(''); report.push('## Warnings'); for (const item of warnings) report.push(`- ${item}`);
}
if (failures.length) {
  report.push(''); report.push('## Failures'); for (const item of failures) report.push(`- ${item}`);
}

const output = path.join(root, 'reports/production-behavior-audit.md');
fs.writeFileSync(output, `${report.join('\n')}\n`);
console.log(report.slice(0, 16).join('\n'));
console.log(`Report: ${output}`);
if (failures.length) process.exitCode = 1;
