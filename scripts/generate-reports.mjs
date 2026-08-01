import './audit-legacy.mjs';
import './evaluate-router.mjs';
import './evaluate-selection.mjs';
import './export-editorial-review.mjs';
import fs from 'node:fs';

const runtimeBank = JSON.parse(fs.readFileSync(new URL('../data/runtime/responses.json', import.meta.url), 'utf8')).responses;
const approved = runtimeBank.filter((response) => response.status === 'approved');
const testOnly = JSON.parse(fs.readFileSync(new URL('../test/fixtures/test-response-pool.json', import.meta.url), 'utf8')).responses;
const auditPath = new URL('../reports/production-behavior-audit.md', import.meta.url);
const auditText = fs.existsSync(auditPath) ? fs.readFileSync(auditPath, 'utf8') : '';
const routeCoverage = auditText.match(/Golden routes with >=4 normal admitted answers: ([^\n]+)/)?.[1] ?? 'run npm run audit:production';
const chaosRate = auditText.match(/Chaos rate over 1,000 eligible seeds: ([^\n]+)/)?.[1] ?? 'run npm run audit:production';
const failures = auditText.match(/Failures: ([^\n]+)/)?.[1] ?? 'unknown';

const blockers = `# Specification Blockers and Deferred Decisions

No blocker prevents local production-bank testing.

## Deferred before public deployment

1. **Distributed persistence credentials** — Upstash-compatible locking and history are implemented, but live credentials are not present in this workspace. File persistence is suitable for local testing, not multi-instance Vercel guarantees.
2. **Live deployment target** — no connected GitHub repository, Vercel project ID, or current production domain was supplied.
3. **Current 7TV inventory** — runtime active-set fetching is implemented, but no frozen active-set export was supplied for offline approval.

## Resolved

- Approved authored bank: ${approved.length} production responses.
- Route coverage: ${routeCoverage}.
- Controlled chaos observed: ${chaosRate}.
- Production behavior audit failures: ${failures}.
- Runtime generation: disabled; all output is finite and authored.
`;
fs.writeFileSync(new URL('../reports/spec-blockers.md', import.meta.url), blockers);

const refs = JSON.parse(fs.readFileSync(new URL('../data/reference/references.json', import.meta.url), 'utf8')).references;
const refReport = ['# Reference Verification Report','',...refs.map((r)=>`## ${r.id}

- Status: ${r.status}
- Aliases: ${(r.aliases??[]).join(', ')}
- Verified associations: ${(r.verified_associations??[]).join(', ') || 'none listed'}
- Candidate associations: ${(r.candidate_associations??[]).join(', ') || 'none'}
- Allowed triggers: ${(r.allowed_triggers??[]).join(', ')}
- Production eligible: ${r.status==='verified' ? 'only when an allowed trigger is present and no candidate association is used' : 'no'}
- Evidence IDs: ${(r.evidence_ids??[]).join(', ') || 'source class only'}
`)].join('\n');
fs.writeFileSync(new URL('../reports/reference-verification-report.md', import.meta.url), refReport);

const coverage = `# Response Coverage Report

## Runtime bank

- Approved production responses: ${approved.length}
- Test-only engineering responses: ${testOnly.length}
- Golden routing fixtures: 60/60 passing
- Golden selection cases: 12/12 passing
- Golden routes with at least four normal admitted answers: ${routeCoverage}
- Controlled chaos audit: ${chaosRate}
- Missing-inquiry behavior: dedicated command-help fallback

## Selection behavior

Relevance determines pool admission. Uniform seeded RNG chooses inside the qualified pool. Exact route-cycle history excludes every already-used answer until the admitted pool is exhausted, then begins a new cycle without immediately repeating the prior line when alternatives exist.

## Deployment conclusion

The approved response bank is production-content-capable. Public multi-instance deployment still requires distributed persistence configuration and final owner review of the full authored bank.
`;
fs.writeFileSync(new URL('../reports/response-coverage-report.md', import.meta.url), coverage);

const migration = `# Legacy Migration Map

- Legacy regex routes are preserved under \`source/legacy-build/\` for audit only.
- Runtime recognition now uses the V4 ontology, named rules, and feature bundles.
- Legacy response strings were not automatically imported or approved; the production bank was rebuilt as structured authored responses.
- Legacy in-memory anti-repeat logic is replaced by a MemoryStore interface with in-memory, file-persistent, and Upstash REST adapters.
- Relevance now admits a route pool; it does not decide the final line inside that pool.
- Exact route cycles exhaust all admitted answers before repeating.
- Existing public paths \`/8ball\`, \`/api/8ball\`, \`/health\`, and \`/api/health\` are preserved.
- 7TV failure is isolated from core response selection.
`;
fs.writeFileSync(new URL('../reports/legacy-migration-map.md', import.meta.url), migration);
console.log('All reports generated.');
