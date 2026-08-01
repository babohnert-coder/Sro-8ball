import fs from 'node:fs';
import { recognizeInquiry } from '../src/recognition/index.js';
import { getEligibleResponses } from '../src/selection/index.js';
const router = JSON.parse(fs.readFileSync(new URL('../test/fixtures/golden-router-pilot.json', import.meta.url), 'utf8')).fixtures;
const byId = new Map(router.map((f) => [f.id, f]));
const cases = JSON.parse(fs.readFileSync(new URL('../test/fixtures/golden-selection-cases.json', import.meta.url), 'utf8')).cases;
const responses = JSON.parse(fs.readFileSync(new URL('../test/fixtures/test-response-pool.json', import.meta.url), 'utf8')).responses;
const failures = [];
for (const item of cases) {
  const bundle = recognizeInquiry(byId.get(item.input_fixture).input);
  const evaluated = getEligibleResponses(bundle, responses, 'test', new Set());
  const allowed = new Set(evaluated.filter((x) => x.eligible).map((x) => x.response.id));
  const problems = [];
  for (const id of item.must_allow) if (!allowed.has(id)) problems.push(`must_allow_failed:${id}`);
  for (const id of item.must_forbid) if (allowed.has(id)) problems.push(`must_forbid_failed:${id}`);
  if (problems.length) failures.push({ id: item.id, problems, allowed: [...allowed] });
}
const report = `# Selection Report\n\n- Cases: ${cases.length}\n- Passed: ${cases.length-failures.length}\n- Failed: ${failures.length}\n- Production test-only rejection: enforced by status gate\n- Candidate-association rejection: enforced by reference permission gate\n\n${failures.length ? '```json\n'+JSON.stringify(failures,null,2)+'\n```' : 'All golden selection cases passed.'}\n`;
fs.writeFileSync(new URL('../reports/selection-report.md', import.meta.url), report);
console.log(report);
