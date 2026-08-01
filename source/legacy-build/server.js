const http = require('http');
const eightball = require('./api/8ball');
const health = require('./api/health');

const port = Number(process.env.PORT || 3000);

function adapt(handler, req, res) {
  req.query = Object.fromEntries(new URL(req.url, `http://${req.headers.host}`).searchParams.entries());
  return handler(req, res);
}

const server = http.createServer((req, res) => {
  const path = new URL(req.url, `http://${req.headers.host}`).pathname;
  if (path === '/8ball' || path === '/api/8ball') return adapt(eightball, req, res);
  if (path === '/health' || path === '/api/health') return adapt(health, req, res);
  res.statusCode = 404;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end('Not found');
});

server.listen(port, () => console.log(`SRO 8 Ball running on http://localhost:${port}`));
