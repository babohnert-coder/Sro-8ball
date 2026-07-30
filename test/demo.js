import { answerOracle } from '../src/oracle.js';
const questions = [
  'is this winnable',
  'how we doing',
  'do we like mtf',
  'will misanthrope ever find love',
  'why are you fucking stupid as bricks',
  'should we change to blue trinket',
  'will Nightbot subscribe?',
  'is Teamplay short',
  'cast testicular torsion',
  'is irelia broken',
  'what should i build on singed'
];
for (const q of questions) {
  const answer = await answerOracle(q, { user: 'demo' });
  console.log(`${q}\n  -> ${answer}\n`);
}
