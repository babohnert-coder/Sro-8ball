import fs from 'node:fs';
import { recognizeInquiry } from '../src/recognition/index.js';
const data = JSON.parse(fs.readFileSync(new URL('../test/fixtures/golden-router-pilot.json', import.meta.url), 'utf8'));
const failures = [];
let intent = 0, primary = 0, conceptTP = 0, conceptFP = 0, conceptFN = 0, entityTP = 0, entityFP = 0;
for (const fixture of data.fixtures) {
  const bundle = recognizeInquiry(fixture.input);
  if (bundle.intent.label === fixture.expected.intent) intent += 1;
  if (bundle.domains[0]?.label === fixture.expected.primary_domain) primary += 1;
  const actualConcepts = new Set(bundle.concepts.map((item) => item.label));
  const expectedConcepts = new Set(fixture.expected.concepts_required);
  for (const item of actualConcepts) expectedConcepts.has(item) ? conceptTP++ : conceptFP++;
  for (const item of expectedConcepts) if (!actualConcepts.has(item)) conceptFN++;
  const actualEntities = new Set(bundle.entities.map((item) => item.value));
  const expectedEntities = new Set(fixture.expected.entities_required);
  for (const item of actualEntities) expectedEntities.has(item) ? entityTP++ : entityFP++;
  const problems = [];
  if (bundle.intent.label !== fixture.expected.intent) problems.push(`intent:${bundle.intent.label}`);
  if (bundle.domains[0]?.label !== fixture.expected.primary_domain) problems.push(`primary:${bundle.domains[0]?.label}`);
  for (const item of expectedConcepts) if (!actualConcepts.has(item)) problems.push(`concept_missing:${item}`);
  for (const item of expectedEntities) if (!actualEntities.has(item)) problems.push(`entity_missing:${item}`);
  if (problems.length) failures.push({ id: fixture.id, input: fixture.input, problems });
}
const precision = entityTP / Math.max(1, entityTP + entityFP);
const conceptF1 = 2 * conceptTP / Math.max(1, 2 * conceptTP + conceptFP + conceptFN);
const report = `# Router Pilot Report\n\n- Fixtures: ${data.fixtures.length}\n- Intent accuracy: ${(intent/data.fixtures.length*100).toFixed(1)}%\n- Primary-domain accuracy: ${(primary/data.fixtures.length*100).toFixed(1)}%\n- Entity precision: ${(precision*100).toFixed(1)}%\n- Concept micro-F1: ${(conceptF1*100).toFixed(1)}%\n- Golden-fixture failures: ${failures.length}\n\n## Failures\n\n${failures.length ? '```json\n'+JSON.stringify(failures,null,2)+'\n```' : 'None.'}\n`;
fs.mkdirSync(new URL('../reports/', import.meta.url), { recursive: true });
fs.writeFileSync(new URL('../reports/router-pilot-report.md', import.meta.url), report);
console.log(report);
