import test from 'node:test';
import assert from 'node:assert/strict';
import { formStance, scoreResponseForStance, stanceCohort } from '../src/brain.js';

function bundle(domain = 'league_gameplay') {
  return {
    normalized: 'will sro win lane',
    domains: [{ label: domain }],
    states: [],
  };
}

function response(overrides = {}) {
  return {
    id: 'r',
    delivery: 'dry',
    reply_move: 'deadpan_diagnosis',
    twist_family: 'none',
    payoff_family: 'recognition',
    target_family: 'game_state',
    league_intensity: 2,
    ...overrides,
  };
}

test('forms a deterministic eligible stance', () => {
  const first = formStance({ bundle: bundle(), snapshot: {}, seed: 'same' });
  const second = formStance({ bundle: bundle(), snapshot: {}, seed: 'same' });
  assert.deepEqual(first, second);
  assert.equal(first.leagueNative, true);
});

test('league-native stance rewards fitting League responses', () => {
  const stance = {
    id: 'league_realist', leagueNative: true,
    delivery: ['contextual', 'dry'], reply_move: ['deadpan_diagnosis'],
    twist_family: ['social_frame_on_league', 'none'], payoff_family: ['recognition'],
    target_family: ['game_state'],
  };
  const league = scoreResponseForStance(response(), stance);
  const generic = scoreResponseForStance(response({ league_intensity: 0, target_family: 'fate' }), stance);
  assert.ok(league > generic);
});

test('brain cohort relaxes rather than collapsing a small valid pool', () => {
  const stance = formStance({ bundle: bundle('general_oracle'), snapshot: {}, seed: 'x' });
  const candidates = [{ response: response({ id: 'a' }) }, { response: response({ id: 'b', delivery: 'classic' }) }];
  const result = stanceCohort(candidates, stance);
  assert.ok(result.candidates.length >= 2);
});
