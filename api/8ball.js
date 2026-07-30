import { answerOracle } from '../src/oracle.js';

export default async function handler(req, res) {
  const q = req.query?.q ?? req.query?.question ?? '';
  const user = req.query?.user ?? req.query?.u ?? '';
  const debug = req.query?.debug === '1';
  const answer = await answerOracle(q, { user, debug });
  res.setHeader('Content-Type', debug ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.status(q ? 200 : 400).send(debug ? JSON.stringify(answer) : answer);
}
