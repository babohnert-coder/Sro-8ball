import fs from 'node:fs';
import { inspectEmoteInventory } from '../src/emotes.js';

const config = JSON.parse(fs.readFileSync(new URL('../data/config/emotes.json', import.meta.url), 'utf8'));
const setId = process.env.SEVENTV_SET_ID ?? config.set_id;
const apiBase = (process.env.SEVENTV_API_BASE ?? config.api_base).replace(/\/$/, '');
let payload;
if (process.env.SEVENTV_SET_JSON_FILE) {
  payload = JSON.parse(fs.readFileSync(process.env.SEVENTV_SET_JSON_FILE, 'utf8'));
} else {
  const response = await fetch(`${apiBase}/${encodeURIComponent(setId)}`, { signal: AbortSignal.timeout(Number(process.env.SEVENTV_FETCH_TIMEOUT_MS ?? 10000)) });
  if (!response.ok) throw new Error(`7TV HTTP ${response.status}`);
  payload = await response.json();
}
const rawEntries = payload?.emotes ?? payload?.emote_set?.emotes ?? [];
if (!rawEntries.length) throw new Error('No active emotes returned');
const inventory = inspectEmoteInventory(rawEntries, {
  source: '7tv_snapshot',
  setId: payload?.id ?? payload?.emote_set?.id ?? setId,
  setName: payload?.name ?? payload?.emote_set?.name ?? null,
  fetchedAt: new Date().toISOString(),
});
const compact = {
  version: '4.9.0',
  set_id: inventory.setId,
  set_name: inventory.setName,
  fetched_at: inventory.fetchedAt,
  hash: inventory.hash,
  total_count: inventory.totalCount,
  categorized_count: inventory.categorizedCount,
  coverage_ratio: inventory.coverageRatio,
  compound_count: inventory.compoundCount,
  compounds: inventory.compounds,
  entries: inventory.entries,
};
fs.writeFileSync(new URL('../data/emotes/active-set-snapshot.json', import.meta.url), `${JSON.stringify(payload, null, 2)}\n`);
fs.writeFileSync(new URL('../data/emotes/semantic-inventory.json', import.meta.url), `${JSON.stringify(compact, null, 2)}\n`);
const rows = inventory.entries
  .sort((a, b) => a.alias.localeCompare(b.alias))
  .map((entry) => `| ${entry.alias} | ${entry.expressions.join(', ')} | ${entry.visual_families.join(', ')} | ${entry.discourse_functions.join(', ')} | ${(entry.target_affinity ?? []).join(', ')} | ${(entry.hard_blocks ?? []).join(', ')} | ${entry.confidence.toFixed(2)} | ${entry.zero_width ? 'blocked' : 'yes'} |`);
const report = `# SRO 7TV Semantic Inventory\n\n- Set ID: \`${inventory.setId}\`\n- Set name: ${inventory.setName ?? 'unknown'}\n- Fetched: ${inventory.fetchedAt}\n- Active aliases: ${inventory.totalCount}\n- Semantically classified: ${inventory.categorizedCount}\n- Low-confidence hidden-nonsense aliases: ${inventory.uncategorized.length}\n- Reviewed compound phrases available: ${inventory.compoundCount}\n- Inventory hash: \`${inventory.hash}\`\n\n| Alias | Expression families | Visual families | Discourse functions | Target affinity | Hard blocks | Confidence | Standalone |\n|---|---|---|---|---|---|---:|---|\n${rows.join('\n')}\n\n## Low-confidence review queue\n\n${inventory.uncategorized.length ? inventory.uncategorized.map((entry) => `- ${entry.alias}`).join('\n') : '- None'}\n`;
fs.writeFileSync(new URL('../reports/7tv-semantic-inventory.md', import.meta.url), report);
console.log(`Synced ${inventory.totalCount} active aliases from ${inventory.setId}; ${inventory.uncategorized.length} require visual/manual review.`);
