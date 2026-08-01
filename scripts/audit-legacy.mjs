import fs from 'node:fs';
import path from 'node:path';
const root = new URL('../', import.meta.url);
const legacyResponses = JSON.parse(fs.readFileSync(new URL('../source/legacy-build/data/responses.json', import.meta.url), 'utf8'));
const routes = JSON.parse(fs.readFileSync(new URL('../source/legacy-build/data/routes.json', import.meta.url), 'utf8'));
const runtimeBank = JSON.parse(fs.readFileSync(new URL('../data/runtime/responses.json', import.meta.url), 'utf8')).responses;
const approvedCount = runtimeBank.filter((response) => response.status === 'approved').length;
const lanes = legacyResponses.lanes ?? {};
const laneRows = [];
let total = 0;
let empty = 0;
const allLines = [];
for (const [name, value] of Object.entries(lanes)) {
  const plain = Array.isArray(value?.plain) ? value.plain : Array.isArray(value) ? value : [];
  const emote = Array.isArray(value?.emote) ? value.emote : [];
  const count = plain.length + emote.length;
  total += count;
  if (!count) empty += 1;
  for (const line of [...plain, ...emote]) allLines.push({ lane: name, text: typeof line === 'string' ? line : line.text ?? JSON.stringify(line) });
  laneRows.push({ lane: name, count });
}
const normalized = new Map();
for (const line of allLines) {
  const key = line.text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const list = normalized.get(key) ?? [];
  list.push(line);
  normalized.set(key, list);
}
const duplicates = [...normalized.values()].filter((group) => group.length > 1);
const flaggedTerms = ['operational', 'deployment', 'production', 'repository', 'detected', 'pending review', 'statistically', 'ecosystem', 'input quality', 'systems green'];
const flagged = allLines.filter((line) => flaggedTerms.some((term) => line.text.toLowerCase().includes(term)));
const report = `# Current-State and Legacy Audit\n\n## Reasoning package\n\n- Golden router fixtures: 60\n- Golden selector cases: 12\n- Test-only engineering responses: 15\n- Production-approved responses supplied: ${approvedCount}\n- Runtime content readiness: approved bank present and behavior-audited\n- Multi-instance deployment readiness: requires distributed persistence credentials\n\n## Legacy build\n\n- README/meta claimed lane count: ${legacyResponses.meta?.laneCount ?? 'unknown'}\n- Actual lane keys: ${Object.keys(lanes).length}\n- Legacy route definitions: ${routes.length}\n- Claimed responses: ${legacyResponses.meta?.totalResponses ?? 'unknown'}\n- Counted responses in lane data: ${total}\n- Empty lanes: ${empty}\n- Exact normalized duplicate groups: ${duplicates.length}\n- Lines flagged for known AI/software voice terms: ${flagged.length}\n\n## Empty or underfilled lanes\n\n${laneRows.filter((row) => row.count < 4).map((row) => `- ${row.lane}: ${row.count}`).join('\n') || 'None below four responses.'}\n\n## Editorial flags\n\n${flagged.slice(0, 40).map((line) => `- [${line.lane}] ${line.text}`).join('\n') || 'No flagged terms found.'}\n\n## Source gaps\n\n- The standalone original \`smart-responses.json\` was not materialized into the V4 package. Its reviewed content is partially represented by the response-review and legacy-build sources, but it remains a missing primary source.\n- No current active 7TV export was bundled; runtime fetch/fallback behavior is implemented instead.\n- No live Vercel project configuration, production URL, or Redis credentials were supplied. Deployment was therefore not attempted.\n`;
fs.mkdirSync(new URL('../reports/', import.meta.url), { recursive: true });
fs.writeFileSync(new URL('../reports/current-state-audit.md', import.meta.url), report);
const csv = ['lane,count', ...laneRows.map((row) => `${JSON.stringify(row.lane)},${row.count}`)].join('\n');
fs.mkdirSync(new URL('../editorial/review-export/', import.meta.url), { recursive: true });
fs.writeFileSync(new URL('../editorial/review-export/legacy-lane-counts.csv', import.meta.url), csv);
fs.writeFileSync(new URL('../editorial/review-export/legacy-ai-voice-flags.json', import.meta.url), JSON.stringify(flagged, null, 2));
console.log(report);
