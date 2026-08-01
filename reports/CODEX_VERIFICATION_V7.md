# Codex Verification - SRO 8Ball V7

## Result

Final recommendation: STAGING_READY.

The V7 package verifies locally after one Windows-only script portability patch. No runtime routing, eligibility, scoring, authored response text, emote policy, memory behavior, or product contract was changed.

## Commands Run

`pnpm run check`

- Result: failed before product validation because this Codex runtime does not expose `npm`, and the package `check` script delegates to `npm run ...`.

Manual equivalent of `npm run check`, using bundled Node:

- `node tools/validate-reasoning-package.mjs`
- `node scripts/build-production-bank.mjs`
- `node editorial/rewrite-v4.6.mjs`
- `node editorial/rewrite-v4.7.mjs`
- `node editorial/rewrite-v4.8.mjs`
- `node editorial/rewrite-v4.9.mjs`
- `node --test test/*.test.js`
- `node scripts/audit-production-behavior.mjs`
- `node scripts/audit-humor-grammar.mjs`
- `node scripts/audit-emote-system.mjs`
- `node scripts/generate-live-output-review.mjs`
- `node scripts/generate-reports.mjs`

Result: passed.

Manual equivalent of `npm run verify:v7`, using bundled Node:

- `node --test test/*.test.js`
- `node scripts/audit-production-behavior.mjs`
- `node scripts/audit-personality.mjs`
- `node scripts/audit-ai-fingerprint.mjs`
- `node scripts/simulate-routes.mjs`
- `node scripts/evaluate-brain-scorecard.mjs`
- `node scripts/export-human-review.mjs`

Result: passed.

## Verification Checks

- PASS - Reasoning package: 60 router fixtures, 12 selector cases, 15 test-only responses.
- PASS - Production bank build: 689 approved responses generated; V4.6, V4.7, V4.8, and V4.9 rewrite passes completed.
- PASS - Automated tests: 165/165 passed.
- PASS - Golden recognition: 60/60 fixtures; 100% intent accuracy; 100% primary-domain accuracy; 100% entity precision; 100% concept micro-F1.
- PASS - Selector cases: 12/12 passed.
- PASS - Production behavior audit: schema valid; exact duplicates 0; near-duplicate pairs 0; AI/software voice flags 0; max response length 66; 59/59 golden routes have at least four normal admitted answers; largest admitted pool 22; route-history capacity 64; scheduled chaos 7.9%.
- PASS - Humor grammar audit: 689 responses across 59 routes passed.
- PASS - Emote audit: 689/689 responses have emote policy; 185/240 simulated replies carried emotes; 35 unique selected emote outputs; compounds 1.3%; semantic mismatches 0; out-of-set token selections 0.
- PASS - Live review: 210 outputs generated; 165 with emotes; 40 unique emotes.
- PASS - Personality audit: SRO Oracle identity, 30 worldview commitments, 20 rules, 10 stances, 10 values, 4 arc stages, 10 voice laws.
- PASS - V7 simulation: 10,000 turns produced all ten configured stance families.
- PASS - V7 scorecard: version 7.0, identity SRO Oracle, personality and oracle-feeling scores both 9.
- PASS - Human review export: `reports/V6_HUMAN_REVIEW.json` written.

## Patch Applied

- `scripts/audit-production-behavior.mjs:4` and `scripts/audit-production-behavior.mjs:14`: replaced `new URL(...).pathname` root derivation with `fileURLToPath(import.meta.url)` plus `path.dirname(...)`.
- `scripts/generate-live-output-review.mjs:3` and `scripts/generate-live-output-review.mjs:7`: applied the same Windows-safe root derivation.

This fixes local Windows paths like `C:\C:\Users\...` during report/audit generation.

## Residual Notes

- `npm` is not available on PATH in this Codex bundled runtime, so `pnpm run check` cannot complete because `check` invokes nested `npm run` commands. The equivalent underlying commands pass with bundled Node.
- One archival source chat JSON from the ZIP was not extracted because its filename exceeds local Windows path handling. The verification did not depend on that raw archival file.
- `scripts/audit-ai-fingerprint.mjs` reports two style flags under its configured failure threshold: `john_west_02` and `bones_food_04`. The audit exits successfully and V7 verification passes.
- Production deployment was not attempted. The decision log requires explicit user request plus production Upstash credentials and connected GitHub/Vercel target.
