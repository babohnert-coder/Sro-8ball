import assert from 'node:assert/strict';
import fs from 'node:fs';
import { answerOracle, health } from '../src/oracle.js';
import eightBallHandler from '../api/8ball.js';
import healthHandler from '../api/health.js';

const status = health();
assert.equal(status.version, '1.6.0');
assert.equal(status.emoteChance, 0.5);
assert.equal(status.maxEmotesPerResponse, 1);
assert.equal(status.legacyFallbacks, 100);
assert.equal(status.referenceProvenance.corpusDerived, false);
assert.ok(status.referenceFragments >= 12);
assert.equal(status.activeTemporaryMotifs, 0);
assert.equal(status.voicePolicy.maxJokes, 1);

const endpointConfig = JSON.parse(fs.readFileSync(new URL('../vercel.json', import.meta.url)));
assert.deepEqual(endpointConfig.rewrites, [
  { source: '/8ball', destination: '/api/8ball' },
  { source: '/health', destination: '/api/health' }
]);

const serverSource = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
for (const token of ["'/8ball'", "'/api/8ball'", "'/health'", "'/api/health'", "get('q')", "get('question')", "get('user')", "get('u')"]) {
  assert.ok(serverSource.includes(token), `server compatibility token missing: ${token}`);
}

const apiSource = fs.readFileSync(new URL('../api/8ball.js', import.meta.url), 'utf8');
for (const token of ['?.q', '?.question', '?.user', '?.u']) {
  assert.ok(apiSource.includes(token), `Vercel handler compatibility token missing: ${token}`);
}

function mockResponse() {
  return {
    headers: {},
    statusCode: null,
    body: null,
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    send(body) { this.body = body; return this; }
  };
}

for (const query of [
  { q: 'is this winnable', user: 'api_primary' },
  { question: 'do we like mtf', u: 'api_alias' }
]) {
  const res = mockResponse();
  await eightBallHandler({ query }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(typeof res.body, 'string');
  assert.ok(!/[\r\n]/.test(res.body));
}
const healthRes = mockResponse();
healthHandler({}, healthRes);
assert.equal(healthRes.statusCode, 200);
assert.equal(JSON.parse(healthRes.body).version, '1.6.0');

let sawSemanticAudit = false;
let sawReference = false;
let selectedEmotes = 0;
for (let i = 0; i < 120; i += 1) {
  const result = await answerOracle(i % 2 ? 'is this winnable' : 'should we change to blue trinket', {
    user: `runtime_${i}`,
    debug: true
  });
  assert.ok(result.response.length <= 380);
  assert.ok(!/[\r\n\t]/.test(result.response));
  assert.ok(['selected', 'chance', 'already-present', 'no-available-match'].includes(result.emoteDecision));
  if (result.emoteCategory === (i % 2 ? 'hope' : 'vision')) sawSemanticAudit = true;
  if (result.referenceFragment) sawReference = true;
  if (result.emoteDecision === 'selected') selectedEmotes += 1;
}
assert.ok(sawSemanticAudit, 'semantic emote category was not exposed');
assert.ok(sawReference, 'tagged composition was not exercised');
assert.ok(selectedEmotes >= 35 && selectedEmotes <= 85, `50% emote chance drifted unexpectedly: ${selectedEmotes}/120`);

const first = await answerOracle('will mtf find love', { user: 'followup_user', debug: true });
const followup = await answerOracle('will he ever', { user: 'followup_user', debug: true });
assert.ok(first.targets.includes('michaelthefan'));
assert.ok(followup.resolved.includes('michaelthefan'));
assert.ok(followup.targets.includes('michaelthefan'));

const champion = await answerOracle('is irelia broken', { user: 'champion_confidence', debug: true });
assert.equal(champion.route, 'champion_irelia');
assert.equal(champion.confidence, 'medium');

console.log('PASS: runtime policy, endpoint compatibility, composition, follow-up, confidence, and emote audit');
