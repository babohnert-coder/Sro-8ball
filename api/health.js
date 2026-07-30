import { health } from '../src/oracle.js';

export default function handler(_req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.status(200).send(JSON.stringify(health()));
}
