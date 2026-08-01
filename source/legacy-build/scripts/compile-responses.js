const fs = require('fs');
const path = require('path');

const mdPath = path.join(__dirname, '..', 'AUTHORED_RESPONSES.md');
const outPath = path.join(__dirname, '..', 'data', 'responses.json');
const md = fs.readFileSync(mdPath, 'utf8');

const lines = md.split(/\r?\n/);
const lanes = {};
let lane = null;
let section = null;

for (const raw of lines) {
  const h = raw.match(/^##\s+([a-z0-9_]+)\s*$/i);
  if (h) {
    lane = h[1];
    lanes[lane] = { plain: [], emote: [] };
    section = null;
    continue;
  }
  if (/^\*\*Plain\*\*/i.test(raw)) { section = 'plain'; continue; }
  if (/^\*\*With authored 7TV\*\*/i.test(raw)) { section = 'emote'; continue; }
  const item = raw.match(/^[-*]\s+(.+)\s*$/);
  if (lane && section && item) {
    lanes[lane][section].push(item[1].trim());
  }
}

const totalPlain = Object.values(lanes).reduce((n, x) => n + x.plain.length, 0);
const totalEmote = Object.values(lanes).reduce((n, x) => n + x.emote.length, 0);
const total = totalPlain + totalEmote;
const payload = {
  meta: {
    name: 'SRO 8 Ball',
    version: '3.0.0',
    compiledAt: new Date().toISOString(),
    design: 'finite authored oracle; routed, randomized, anti-repeat; never sentence-generates',
    laneCount: Object.keys(lanes).length,
    totalResponses: total,
    plainResponses: totalPlain,
    emoteResponses: totalEmote
  },
  lanes
};
fs.writeFileSync(outPath, JSON.stringify(payload, null, 2) + '\n');
console.log(`Compiled ${Object.keys(lanes).length} lanes, ${total} responses (${totalPlain} plain, ${totalEmote} emote).`);
