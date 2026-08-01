import test from 'node:test';
import assert from 'node:assert/strict';
import { OracleRuntime } from '../src/runtime.js';
import { InMemoryStore } from '../src/memory/in-memory.js';
import { recognizeInquiry } from '../src/recognition/index.js';
import { buildRouteKey } from '../src/selection/select.js';
import { deriveEmotePolicy } from '../src/emote-policy.js';

const env = { ...process.env, DISABLE_7TV_FETCH: '1' };

const cases = [
  ['good gold reset?', 'gold_reset_cope', 'fight_dive_trade_shutdown', 'gold_reset_cope_', ['cope', 'smug', 'recognition']],
  ['mana diff?', 'mock_diff', 'player_role_performance', 'mock_diff_', ['mockery', 'recognition', 'laughter', 'light_laughter']],
  ['NA wave clear?', 'wave_clear_jab', 'lane_wave_state', 'wave_clear_jab_', ['mockery', 'cringe', 'visual_pain', 'disbelief']],
  ['easy penta?', 'premature_hype', 'current_game', 'premature_hype_', ['hype', 'mild_hype', 'disbelief', 'approval']],
  ['let him cook?', 'reckless_commitment', 'current_game', 'reckless_commitment_', ['approval', 'ironic_endorsement', 'hype', 'cursed_build']],
  ['viewer games?', 'viewer_games', 'room_lore', 'viewer_games_', ['anticipation', 'hype', 'panic']],
  ['how much are they paying Mike for that collab', 'creator_collab_money', 'work_money', 'creator_collab_money_', ['suspicion', 'smug', 'recognition']],
  ['when will you be finished', 'bot_completion', 'stream_chat_moderation', 'bot_completion_', ['waiting', 'anticipation', 'smug']],
  ['are you fucking high', 'bot_challenge', 'stream_chat_moderation', 'bot_challenge_', ['disbelief', 'accusatory_disbelief', 'mockery', 'smug']],
  ['mods ban?', 'mock_mod_call', 'stream_chat_moderation', 'mock_mod_call_', ['moderation', 'mock_enforcement', 'mockery', 'hype']],
  ['do you love me', 'love_question', 'relationships_social', 'love_question_', ['love', 'smug', 'disbelief']],
  ['kekw', 'chat_laugh_reaction', 'stream_chat_moderation', 'chat_laugh_reaction_', ['laughter', 'light_laughter', 'goofy_irony', 'recognition']],
];

for (const [inquiry, concept, domain, prefix, expectedExpressions] of cases) {
  test(`integrated room language: ${inquiry}`, async () => {
    const runtime = new OracleRuntime({ mode: 'production', env, memory: new InMemoryStore() });
    const result = await runtime.answer({ inquiry, userId: 'integration', debug: true, seed: `integration:${inquiry}` });
    assert.equal(result.bundle.route_family, concept);
    assert.equal(result.bundle.domains[0]?.label, domain);
    assert.ok(result.bundle.concepts.some((item) => item.label === concept));
    assert.ok(result.responseId?.startsWith(prefix), `${inquiry} selected ${result.responseId}`);
    assert.equal(result.fallbackLevel, 'none');
    assert.ok(result.admittedCount >= 4);
    assert.ok(result.highestMatchTier >= 4);
    assert.ok(result.emotePolicy.expressions_preferred.length > 0);
    assert.ok(result.emotePolicy.expressions_preferred.every((family) => expectedExpressions.includes(family)),
      `${inquiry} policy escaped route expressions: ${result.emotePolicy.expressions_preferred.join(', ')}`);
    assert.ok(result.emotes.selected?.alias, `${inquiry} did not receive an emote in a fresh quota window`);
    assert.ok(result.emotePolicy.expressions_preferred.includes(result.emotes.selected.family),
      `${inquiry} selected ${result.emotes.selected.alias} as ${result.emotes.selected.family}`);
  });
}

test('equivalent SRO win phrasings share a canonical route key', () => {
  const first = recognizeInquiry('will Mike win this game');
  const second = recognizeInquiry('can SRO still win');
  assert.equal(first.route_family, 'game_outcome_question');
  assert.equal(second.route_family, 'game_outcome_question');
  assert.equal(buildRouteKey(first), buildRouteKey(second));
});

test('run it down remains inting, not reckless approval', () => {
  const bundle = recognizeInquiry('did he run it down');
  assert.ok(bundle.concepts.some((item) => item.label === 'int_feed'));
  assert.ok(!bundle.concepts.some((item) => item.label === 'reckless_commitment'));
});

test('serious replies are exempt from quota forcing and block roast emotes', () => {
  const bundle = recognizeInquiry('seriously should I quit my job');
  const response = {
    id: 'serious_probe', text: 'Secure the next step first.', intents: ['permission'],
    verdict: 'not_yet', delivery: 'direct', seriousness: 3, chaos: 0,
    reply_move: 'instruction', payoff_family: 'utility', concepts_any: ['job_decision'],
    sro_intensity: 0, league_intensity: 0, emote: null,
  };
  const policy = deriveEmotePolicy(response, bundle);
  assert.equal(policy.quota_exempt, true);
  for (const blocked of ['laughter', 'mockery', 'rage', 'tilt', 'cringe', 'hidden_nonsense']) {
    assert.ok(policy.expressions_forbidden.includes(blocked));
  }
});
