const responses = require('../data/responses.json');

module.exports = function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.statusCode = 200;
  res.end(JSON.stringify({ ok: true, name: responses.meta.name, version: responses.meta.version, lanes: responses.meta.laneCount, responses: responses.meta.totalResponses }));
};
