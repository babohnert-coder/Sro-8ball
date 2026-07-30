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
  'cast testicular torsion'
];
for (const q of questions) console.log(`${q}\n  -> ${answerOracle(q, { user: 'demo' })}\n`);
