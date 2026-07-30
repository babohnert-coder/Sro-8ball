import http from 'node:http';
import { URL } from 'node:url';
import { answerOracle, health } from './src/oracle.js';

const port = Number(process.env.PORT || 3000);
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (url.pathname === '/health' || url.pathname === '/api/health') {
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify(health()));
  }
  if (url.pathname === '/8ball' || url.pathname === '/api/8ball') {
    const q = url.searchParams.get('q') || url.searchParams.get('question') || '';
    const user = url.searchParams.get('user') || url.searchParams.get('u') || '';
    const debug = url.searchParams.get('debug') === '1';
    const answer = await answerOracle(q, { user, debug });
    res.writeHead(q ? 200 : 400, {
      'content-type': debug ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
      'access-control-allow-origin': '*'
    });
    return res.end(debug ? JSON.stringify(answer) : answer);
  }
  res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
  res.end('SRO 8 Ball Oracle online. Use /8ball?q=YOUR_QUESTION&user=USERNAME');
});
server.listen(port, () => console.log(`SRO Oracle listening on ${port}`));
