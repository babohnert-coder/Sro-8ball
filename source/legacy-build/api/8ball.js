const { ask } = require('../src/oracle');

function getQuery(req) {
  const url = new URL(req.url, 'http://localhost');
  const q = url.searchParams.get('q') || url.searchParams.get('question') || url.searchParams.get('query') || '';
  const user = url.searchParams.get('user') || req.headers['nightbot-user'] || req.headers['x-user'] || 'anon';
  const debug = url.searchParams.get('debug') === '1' || url.searchParams.get('debug') === 'true';
  return { q, user, debug };
}

module.exports = async function handler(req, res) {
  try {
    const { q, user, debug } = getQuery(req);
    const result = await ask(q, { user, debug });
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    if (debug) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.statusCode = 200;
      res.end(JSON.stringify(result, null, 2));
      return;
    }
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.statusCode = 200;
    res.end(result);
  } catch (err) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.statusCode = 200;
    res.end('UNCLEAR — the oracle tripped over deployment and landed safely.');
  }
};
