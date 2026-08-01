import { OracleRuntime } from '../src/runtime.js';

let runtime;
function getRuntime() { return runtime ??= new OracleRuntime(); }
function queryFrom(req) {
  if (req.query) return req.query;
  const url = new URL(req.url, 'http://localhost');
  return Object.fromEntries(url.searchParams);
}

export default async function handler(req, res) {
  try {
    const query = queryFrom(req);
    const debugRequested = query.debug === '1';
    const debugAllowed = process.env.SRO_8BALL_DEBUG === '1' && process.env.NODE_ENV !== 'production';
    const result = await getRuntime().answer({ inquiry: query.q ?? '', userId: query.user ?? 'anonymous', seed: query.seed, debug: debugRequested && debugAllowed });
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (typeof result === 'string') {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end(result);
    } else {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify(result));
    }
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('ASK AGAIN LATER - the command hit a temporary error.');
  }
}
