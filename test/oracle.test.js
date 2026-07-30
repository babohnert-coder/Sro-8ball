import assert from 'node:assert/strict';
import { answerOracle, health } from '../src/oracle.js';

const cases = [
  ['why are you fucking stupid as bricks', 'bot_why_insult'],
  ['delete yourself', 'bot_threat'],
  ['is this winnable', 'game_winnable'],
  ['how we doing', 'game_how_doing'],
  ['should we change to blue trinket', 'vision_blue_trinket'],
  ['do we like mtf', 'social_do_we_like'],
  ['will misanthrope ever find love', 'social_find_love'],
  ['should teamplay date sickgamers', 'social_date_two'],
  ['is teamplay short', 'social_appearance'],
  ['does michaelthefan root for sro to lose', 'social_root_against'],
  ['is mtf a degenerate gambler', 'social_gambler'],
  ['will nightbot subscribe', 'nightbot_subscribe'],
  ['cast testicular torsion', 'curse_torsion'],
  ['we are fucked', 'game_doomed'],
  ['he is back in it', 'game_back_in_it'],
  ['mf trolling with that build tho', 'league_build_troll'],
  ['should i go outside', 'life_go_outside'],
  ['this 8ball can never be the original', 'bot_original_nostalgia'],
  ['please 8ball stop doing all the drugs', 'bot_drug_accusation'],
  ['is mtf smarter than john', 'social_smarter_than'],
  ['full ap croc when', 'league_full_ap_croc'],
  ['call out the fail flash', 'league_fail_flash'],
  ['is irelia broken', 'champion_irelia'],
  ['what should i build on singed', 'champion_singed'],
  ['is ksante good', 'champion_ksante'],
  ['tell me about gangplank', 'champion_gangplank'],
  ['is your response over 400 characters', 'bot_length_bait'],
  ['prove it', 'bot_prove_it'],
  ['still?', 'bot_still_again'],
  ['what about me', 'social_what_about_me'],
  ['are you ask jeeves now', 'bot_ask_jeeves']
];

for (const [input, expected] of cases) {
  const result = await answerOracle(input, { user: 'tester', debug: true });
  assert.equal(result.route, expected, `${input} routed to ${result.route}`);
  assert.ok(result.response.length > 5);
}
assert.ok(health().routes > 50);
assert.ok(health().championProfiles >= 20);
assert.equal(health().version, '1.6.0');
assert.ok(health().loreEntities >= 6);
assert.ok(health().relationshipMaps >= 3);
console.log(`PASS: ${cases.length} routing cases; ${health().routes} total routes`);
