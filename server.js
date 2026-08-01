import http from 'node:http';
import handler8ball from './api/8ball.js';
import handlerHealth from './api/health.js';

const port = Number(process.env.PORT ?? 3000);
const server = http.createServer(async (req, res) => {
  const pathname = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`).pathname;
  if (pathname === '/8ball' || pathname === '/api/8ball') return handler8ball(req, res);
  if (pathname === '/health' || pathname === '/api/health') return handlerHealth(req, res);
  res.statusCode = 404;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end('Not found');
});
server.listen(port, () => console.log(`SRO 8 Ball engineering server listening on http://localhost:${port}`));
