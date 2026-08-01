const routes = require('../data/routes.json');
const responses = require('../data/responses.json');
const { normalize } = require('./text');

const compiled = routes
  .filter(r => responses.lanes[r.lane])
  .map(r => ({ ...r, regexes: (r.patterns || []).map(p => new RegExp(p, 'i')) }))
  .sort((a, b) => (b.weight || 0) - (a.weight || 0));

function routeQuestion(question) {
  const q = normalize(question);
  const hits = [];
  for (const route of compiled) {
    let score = 0;
    for (const re of route.regexes) {
      if (re.test(q)) score += 1;
    }
    if (score > 0) hits.push({ lane: route.lane, weight: route.weight || 0, score, matched: route.patterns });
  }
  hits.sort((a, b) => (b.score * b.weight) - (a.score * a.weight));
  if (hits[0]) return { lane: hits[0].lane, confidence: Math.min(1, hits[0].score / 2), hits };
  return { lane: 'fallback_prediction', confidence: 0, hits: [] };
}

module.exports = { routeQuestion };
