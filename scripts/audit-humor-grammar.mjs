import fs from 'node:fs';
import path from 'node:path';
import { OracleRuntime } from '../src/runtime.js';
import { InMemoryStore } from '../src/memory/index.js';
import { validateResponsePool } from '../src/validation/index.js';

const responsesPayload = JSON.parse(fs.readFileSync('data/runtime/responses.json', 'utf8'));
const responses = responsesPayload.responses;
const grammar = JSON.parse(fs.readFileSync('data/ontology/humor_grammar.json', 'utf8'));
const fixtures = JSON.parse(fs.readFileSync('test/fixtures/golden-router-pilot.json', 'utf8')).fixtures;
const byId = new Map(responses.map((response) => [response.id, response]));
const env = { ...process.env, DISABLE_7TV_FETCH: '1' };
const failures = [];

const validation = validateResponsePool(responses);
if (!validation.valid) failures.push(`Response validation failed for ${validation.results.filter((item) => !item.valid).length} lines.`);

function distribution(field) {
  const counts = new Map();
  for (const response of responses) counts.set(response[field], (counts.get(response[field]) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

const routeRows = [];
for (const fixture of fixtures) {
  if (fixture.expected?.intent === 'command_help') continue;
  const runtime = new OracleRuntime({ mode: 'production', env, memory: new InMemoryStore() });
  const selected = [];
  let admittedCount = 0;
  for (let index = 0; index < 8; index += 1) {
    const result = await runtime.answer({ inquiry: fixture.input, userId: `grammar-${fixture.id}`, seed: `${fixture.id}-${index}`, debug: true });
    if (!result.responseId) break;
    admittedCount = result.admittedCount ?? 0;
    selected.push(byId.get(result.responseId));
  }
  const replyMoves = new Set(selected.map((response) => response.reply_move));
  const twists = new Set(selected.map((response) => response.twist_family));
  const targets = new Set(selected.map((response) => response.target_family));
  const payoffs = new Set(selected.map((response) => response.payoff_family));
  const exacts = new Set(selected.map((response) => response.id));
  if (selected.length && exacts.size < Math.min(selected.length, admittedCount)) failures.push(`${fixture.id} repeated before route exhaustion.`);
  if (admittedCount >= 6 && replyMoves.size < 2) failures.push(`${fixture.id} has fewer than two reply moves across a six-plus response route.`);
  if (admittedCount >= 6 && twists.size < 2 && payoffs.size < 2) failures.push(`${fixture.id} has no meaningful twist/payoff variation.`);
  routeRows.push({ fixture, admittedCount, selected, replyMoves, twists, targets, payoffs });
}

const chatDir = 'source/chat-logs';
const chatFiles = fs.existsSync(chatDir) ? fs.readdirSync(chatDir).filter((name) => name.endsWith('.json')) : [];
let chatMessages = [];
for (const name of chatFiles) {
  const payload = JSON.parse(fs.readFileSync(path.join(chatDir, name), 'utf8'));
  for (const comment of payload.comments ?? []) {
    const text = String(comment.message?.body ?? '').trim();
    if (text) chatMessages.push(text);
  }
}
const shortMessages = chatMessages.filter((text) => text.length <= 100 && text.split(/\s+/).length <= 12);
const chatPatternDefs = [
  ['correction_or_reversal', /\b(wrong|nope|nah|actually|false|cap)\b/i],
  ['imperative_retort', /^(let|just|report|ban|take|give|pick|play|build|go|stop|keep|ask|watch|trust)\b/i],
  ['cope_reframe', /\b(worth|reset(?:ting)? (?:his|the) gold|limit test|scaling|late game|content)\b/i],
  ['mock_authority', /\b(mods?|report|ban|prison|alcatraz|police|jail|arrest|court|illegal)\b/i],
  ['understatement', /\b(just|only|little|kinda|barely|fine|not bad)\b/i],
];
let corpusLogCount = chatFiles.length;
let corpusMessageCount = chatMessages.length;
let corpusShortCount = shortMessages.length;
let chatPatternCounts = chatPatternDefs.map(([id, regex]) => [id, chatMessages.filter((text) => regex.test(text)).length]);
if (!chatFiles.length && fs.existsSync('data/reference/humor-corpus-summary.json')) {
  const summary = JSON.parse(fs.readFileSync('data/reference/humor-corpus-summary.json', 'utf8'));
  corpusLogCount = summary.chat_logs_inspected ?? 0;
  corpusMessageCount = summary.chat_messages_inspected ?? 0;
  corpusShortCount = summary.short_messages?.count ?? 0;
  chatPatternCounts = Object.entries(summary.pattern_counts ?? {});
}

const showcaseInputs = [
  'will Mike win',
  'is this build troll',
  'why did he flash',
  'does bonesex put pineapples on pizza',
  'why is michaelthefan such a hater',
  'doubt or believe',
];
const showcases = [];
for (const inquiry of showcaseInputs) {
  const runtime = new OracleRuntime({ mode: 'production', env, memory: new InMemoryStore() });
  const lines = [];
  for (let index = 0; index < 6; index += 1) {
    const result = await runtime.answer({ inquiry, userId: `showcase-${inquiry}`, seed: `showcase-${index}`, debug: true });
    const response = byId.get(result.responseId);
    if (response) lines.push(response);
  }
  showcases.push({ inquiry, lines });
}

const md = [];
md.push('# SRO 8 Ball Humor Grammar Audit — V4.6');
md.push('');
md.push('## Corpus findings');
md.push('');
md.push(`- Chat logs inspected: **${corpusLogCount}**`);
md.push(`- Chat messages inspected: **${corpusMessageCount}**`);
md.push(`- Messages at 12 words or fewer and 100 characters or fewer: **${corpusShortCount} (${corpusMessageCount ? (100 * corpusShortCount / corpusMessageCount).toFixed(1) : '0.0'}%)**`);
for (const [id, count] of chatPatternCounts) md.push(`- ${id}: **${count}** observed messages`);
md.push('');
md.push('The corpus favors compressed reactions, corrections, commands, mock enforcement, ironic cope, and calm understatement. The best 8 Ball lines should therefore answer quickly, make one turn, and leave chat room to continue the bit.');
md.push('');
md.push('## Response grammar inventory');
md.push('');
md.push(`- Approved authored responses: **${responses.filter((response) => response.status === 'approved').length}**`);
for (const field of ['reply_move', 'twist_family', 'target_family', 'payoff_family']) {
  md.push(`- ${field}: ${distribution(field).map(([id, count]) => `${id} ${count}`).join(', ')}`);
}
md.push('');
md.push('## Route-level behavioral result');
md.push('');
md.push(`- Golden routes exercised: **${routeRows.length}**`);
md.push(`- Routes with six or more admitted answers and fewer than two reply moves: **${routeRows.filter((row) => row.admittedCount >= 6 && row.replyMoves.size < 2).length}**`);
md.push(`- Routes with six or more admitted answers and no twist/payoff variation: **${routeRows.filter((row) => row.admittedCount >= 6 && row.twists.size < 2 && row.payoffs.size < 2).length}**`);
md.push(`- Failures: **${failures.length}**`);
md.push('');
md.push('## Live sequence samples');
md.push('');
for (const showcase of showcases) {
  md.push(`### ${showcase.inquiry}`);
  md.push('');
  for (const line of showcase.lines) md.push(`- **${line.reply_move} / ${line.twist_family} / ${line.payoff_family}** — ${line.text}`);
  md.push('');
}
md.push('## Structural rule now enforced');
md.push('');
md.push('1. Recognition and relevance admit a finished response into the correct route pool.');
md.push('2. The exact route still exhausts unused answers before any repeat.');
md.push('3. Within the unused pool, the selector prefers the freshest reply move, twist family, target, and payoff combination.');
md.push('4. RNG chooses uniformly inside that freshest tier.');
md.push('5. No sentence fragments are assembled at runtime. Every result remains a fully authored line.');
md.push('');
md.push('## Status');
md.push('');
md.push(failures.length ? `**FAILED**\n\n${failures.map((failure) => `- ${failure}`).join('\n')}` : '**PASSED** — exact-response variety and rhetorical-structure variety both hold across the tested routes.');

fs.mkdirSync('reports', { recursive: true });
fs.writeFileSync('reports/HUMOR_GRAMMAR_AUDIT_V4_6.md', `${md.join('\n')}\n`);
console.log(`Humor grammar audit: ${failures.length ? 'FAILED' : 'PASSED'} (${responses.length} responses, ${routeRows.length} routes)`);
if (failures.length) {
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
}
