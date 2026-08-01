process.env.DISABLE_7TV_FETCH = '1';

const assert = require('assert');
const { ask } = require('../src/oracle');
const responses = require('../data/responses.json');

async function main() {
  assert(responses.meta.laneCount >= 60, 'expected a large response lane bank');
  assert(responses.meta.totalResponses >= 300, 'expected 300+ authored responses');

  const sro = await ask('will SRO win this game', { user: 'tester', debug: true });
  assert(['sro_win', 'game_winnable', 'fallback_prediction'].includes(sro.lane), `unexpected SRO lane ${sro.lane}`);
  assert(sro.answer.length > 10 && sro.answer.length < 400, 'Nightbot-safe text answer');

  const build = await ask('is this build actually viable or cooked', { user: 'tester', debug: true });
  assert(['sro_build', 'build_verdict'].includes(build.lane), `unexpected build lane ${build.lane}`);

  const champ = await ask('should mike lock renekton next game', { user: 'tester', debug: true });
  assert(['champion_renekton', 'next_champion'].includes(champ.lane), `unexpected champion lane ${champ.lane}`);

  const q = 'will mike win tomorrow';
  const a1 = await ask(q, { user: 'repeat-user', debug: true });
  const a2 = await ask(q, { user: 'repeat-user', debug: true });
  assert(a2.repeat === true || a2.lane === 'bot_repeat', 'repeat guard should activate for same user/question');
  assert(a1.answer !== a2.answer, 'repeat guard should avoid echoing exact same answer');

  const outputs = [];
  for (let i = 0; i < 20; i += 1) {
    outputs.push(await ask(`is top lane playable ${i}`, { user: 'variety-user' }));
  }
  assert(new Set(outputs).size >= 8, 'forced variety should produce a broad set of answers');

  console.log('All oracle tests passed.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
