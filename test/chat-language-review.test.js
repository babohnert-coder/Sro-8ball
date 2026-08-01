import test from 'node:test';
import assert from 'node:assert/strict';
import { OracleRuntime } from '../src/runtime.js';
import { InMemoryStore } from '../src/memory/in-memory.js';

const env = { ...process.env, DISABLE_7TV_FETCH: '1' };

async function answer(inquiry) {
  const runtime = new OracleRuntime({ mode: 'production', env, memory: new InMemoryStore() });
  return runtime.answer({ inquiry, userId: `chat-language-${inquiry}`, seed: `chat-language:${inquiry}`, debug: true });
}

function assertTopFamily(result, prefixes) {
  const allowed = Array.isArray(prefixes) ? prefixes : [prefixes];
  assert.ok(result.candidates?.length > 0, 'debug candidates missing');
  const topTier = result.highestMatchTier ?? Math.max(...result.candidates.map((candidate) => candidate.matchTier ?? 0));
  const admitted = result.candidates.filter((candidate) => (candidate.matchTier ?? 0) === topTier);
  assert.ok(
    admitted.every((candidate) => allowed.some((prefix) => candidate.responseId.startsWith(prefix))),
    `top admitted family was not ${allowed.join(' or ')}: ${admitted.map((candidate) => candidate.responseId).join(', ')}`,
  );
}

const reviewCases = [
  {
    inquiry: 'winnable',
    intent: 'reaction',
    routeFamily: 'domain:general_oracle',
    prefix: ['general_fragment_', 'general_evaluation_'],
    selectedPrefix: 'general_fragment_',
    answerShape: /^(YES|NO|MAYBE|OUTLOOK UNCLEAR|ASK AGAIN LATER)\b/,
  },
  {
    inquiry: 'is this promo game',
    intent: 'evaluation',
    routeFamily: 'domain:current_game',
    prefix: 'rank_climb_',
    answerShape: /^(YES|NO|MAYBE|OUTLOOK|VERY DOUBTFUL|One|LP|The)\b/,
  },
  {
    inquiry: 'Worth going hull this game lol?',
    intent: 'nonsense',
    routeFamily: 'domain:current_game',
    prefix: 'general_fragment_',
    answerShape: /^(YES|NO|MAYBE|OUTLOOK UNCLEAR|ASK AGAIN LATER)\b/,
  },
  {
    inquiry: 'Where is Renek?',
    intent: 'location',
    routeFamily: 'domain:champion_matchup',
    prefix: 'general_location_',
    answerShape: /^(NEARBY|ELSEWHERE|RIGHT WHERE YOU LEFT IT|CLOSER THAN EXPECTED|ASK AGAIN LATER|OUTLOOK UNCLEAR)\b/,
  },
  {
    inquiry: 'what rank are you atm?',
    intent: 'nonsense',
    routeFamily: 'domain:general_oracle',
    prefix: 'general_fragment_',
    answerShape: /^(YES|NO|MAYBE|OUTLOOK UNCLEAR|ASK AGAIN LATER)\b/,
  },
  {
    inquiry: 'sro smite',
    intent: 'reaction',
    routeFamily: 'domain:sro',
    prefix: ['general_evaluation_', 'general_fragment_'],
    answerShape: /^(YES|NO|MAYBE|OUTLOOK|VERY DOUBTFUL)\b/,
  },
  {
    inquiry: 'is this the same camille?',
    intent: 'evaluation',
    routeFamily: 'domain:champion_matchup',
    prefix: 'general_evaluation_',
    answerShape: /^(YES|NO|MAYBE|OUTLOOK|VERY DOUBTFUL)\b/,
  },
  {
    inquiry: 'why is olaf running it down',
    intent: 'explanation',
    routeFamily: 'domain:fight_dive_trade_shutdown',
    prefix: 'general_explanation_',
    answerShape: /^(BECAUSE|OUTLOOK UNCLEAR)\b/,
  },
  {
    inquiry: 'did he win malph game',
    intent: 'evaluation',
    routeFamily: 'domain:current_game',
    prefix: 'general_evaluation_',
    answerShape: /^(YES|NO|MAYBE|OUTLOOK|VERY DOUBTFUL)\b/,
  },
  {
    inquiry: 'SRO Promo Game',
    intent: 'nonsense',
    routeFamily: 'domain:sro',
    prefix: 'rank_climb_',
    answerShape: /^(YES|NO|MAYBE|OUTLOOK|VERY DOUBTFUL|One|LP|The)\b/,
  },
  {
    inquiry: 'doubt or believe?',
    intent: 'comparison',
    routeFamily: 'room_doubters_believers',
    prefix: 'doubters_lore_',
    answerShape: /^(Choose|Doubt|Believe|Belief|The)\b/,
  },
  {
    inquiry: 'let him cook?',
    intent: 'reaction',
    routeFamily: 'reckless_commitment',
    prefix: 'reckless_commitment_',
    answerShape: /^(Send|Let|The|Evidence|Full|Run|Yes|No|Maybe)\b/,
  },
];

for (const item of reviewCases) {
  test(`chat-language review route stays direct: ${item.inquiry}`, async () => {
    const result = await answer(item.inquiry);
    assert.equal(result.bundle.intent.label, item.intent);
    assert.equal(result.bundle.route_family, item.routeFamily);
    assertTopFamily(result, item.prefix);
    const selectedPrefixes = item.selectedPrefix ? [item.selectedPrefix] : (Array.isArray(item.prefix) ? item.prefix : [item.prefix]);
    assert.ok(
      selectedPrefixes.some((prefix) => result.responseId?.startsWith(prefix)),
      `${result.responseId} did not start with ${selectedPrefixes.join(' or ')}`,
    );
    assert.match(result.text, item.answerShape);
    assert.equal(result.fallbackLevel, 'none');
  });
}
