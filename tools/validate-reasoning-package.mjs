import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const read = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
const fail = [];
const check = (ok, msg) => { if (!ok) fail.push(msg); };

const manifest = read('PACKAGE_MANIFEST.json');
for (const rel of manifest.authoritative_files) check(fs.existsSync(path.join(root, rel)), `Missing authoritative file: ${rel}`);

const intents = new Set(read('data/ontology/intents.json').intents.map(x => x.id));
const domains = new Set(read('data/ontology/domains.json').domains.map(x => x.id));
const states = new Set(read('data/ontology/states.json').states.map(x => x.id));
const conceptData = read('data/ontology/concepts.json').concepts;
const concepts = new Set(conceptData.map(x => x.id));
const entityData = read('data/ontology/entities.json');
const entities = new Set([
  ...entityData.entities.map(x => x.id),
  ...entityData.core_champions.map(x => x.id),
]);
const referencesData = read('data/reference/references.json').references;
const references = new Map(referencesData.map(x => [x.id, x]));
const evidenceData = read('data/reference/source-evidence.json').evidence;
const evidence = new Set(evidenceData.map(x => x.id));

check(intents.has('location'), 'Location intent is required.');
check(concepts.size === conceptData.length, 'Duplicate concept IDs.');
check(references.size === referencesData.length, 'Duplicate reference IDs.');
check(evidence.size === evidenceData.length, 'Duplicate evidence IDs.');

for (const r of referencesData) {
  for (const id of r.evidence_ids ?? []) check(evidence.has(id), `Reference ${r.id} uses missing evidence ${id}`);
}

const router = read('test/fixtures/golden-router-pilot.json');
check(router.fixture_count === router.fixtures.length, 'Router fixture_count mismatch.');
const fixtureIds = new Set();
for (const f of router.fixtures) {
  check(!fixtureIds.has(f.id), `Duplicate fixture ID ${f.id}`);
  fixtureIds.add(f.id);
  check(intents.has(f.expected.intent), `Fixture ${f.id} uses unknown intent ${f.expected.intent}`);
  for (const id of f.expected.domains_required) check(domains.has(id), `Fixture ${f.id} uses unknown domain ${id}`);
  for (const id of f.forbidden.domains) check(domains.has(id), `Fixture ${f.id} forbids unknown domain ${id}`);
  for (const id of f.expected.concepts_required) check(concepts.has(id), `Fixture ${f.id} uses unknown concept ${id}`);
  for (const id of f.forbidden.concepts) check(concepts.has(id), `Fixture ${f.id} forbids unknown concept ${id}`);
  for (const id of f.expected.entities_required) check(entities.has(id), `Fixture ${f.id} uses unknown entity ${id}`);
  for (const id of f.expected.states_required) check(states.has(id), `Fixture ${f.id} uses unknown state ${id}`);
  check(f.expected.specificity_min <= f.expected.specificity_max, `Fixture ${f.id} has invalid specificity range`);
}
check(router.fixtures.length >= 50, 'At least 50 router fixtures are required.');

const responseRequired = read('schemas/response.schema.json').required;
const testPool = read('test/fixtures/test-response-pool.json').responses;
const responseIds = new Set();
for (const r of testPool) {
  check(!responseIds.has(r.id), `Duplicate response ID ${r.id}`);
  responseIds.add(r.id);
  for (const key of responseRequired) check(Object.hasOwn(r, key), `Response ${r.id} missing ${key}`);
  check(r.status === 'test_only', `Engineering response ${r.id} must be test_only`);
  check(r.text.length <= 390, `Response ${r.id} exceeds hard cap`);
  for (const id of r.intents) check(intents.has(id), `Response ${r.id} uses unknown intent ${id}`);
  for (const id of [...r.domains_any, ...r.domains_all, ...r.domains_forbidden]) check(domains.has(id), `Response ${r.id} uses unknown domain ${id}`);
  for (const id of [...r.concepts_any, ...r.concepts_all, ...r.concepts_forbidden]) check(concepts.has(id), `Response ${r.id} uses unknown concept ${id}`);
  for (const id of [...r.entities_required, ...r.entities_preferred, ...r.entities_forbidden]) check(entities.has(id), `Response ${r.id} uses unknown entity ${id}`);
  for (const id of [...r.states_any, ...r.states_forbidden]) check(states.has(id), `Response ${r.id} uses unknown state ${id}`);
  for (const id of r.reference_ids ?? []) check(references.has(id), `Response ${r.id} uses unknown reference ${id}`);
}

const selection = read('test/fixtures/golden-selection-cases.json').cases;
for (const c of selection) {
  check(fixtureIds.has(c.input_fixture), `Selection case ${c.id} uses missing fixture ${c.input_fixture}`);
  for (const id of [...c.must_allow, ...c.must_forbid]) check(responseIds.has(id), `Selection case ${c.id} uses missing response ${id}`);
}

const selectionCfg = read('data/config/selection.json');
check(selectionCfg.relevance_floor > 0, 'Selection relevance floor must be positive.');
check(!selectionCfg.production_statuses.includes('test_only'), 'Production must not allow test_only responses.');
const delivery = read('data/ontology/delivery_modes.json');
const total = Object.values(delivery.soft_target_distribution).reduce((a,b) => a+b, 0);
check(Math.abs(total - 1) < 1e-9, 'Delivery target distribution must sum to 1.');

if (fail.length) {
  console.error(`Reasoning package validation failed with ${fail.length} issue(s):`);
  for (const msg of fail) console.error(`- ${msg}`);
  process.exit(1);
}
console.log(`Reasoning package valid: ${router.fixtures.length} router fixtures, ${selection.length} selector cases, ${testPool.length} test-only responses.`);
