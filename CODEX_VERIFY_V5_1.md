# Codex Verification Directive — SRO 8 Ball V5.1.0

Do not redesign the product and do not write new response text.

## Objective
Independently verify the deterministic stance-forming brain added on top of V5.0.2.

## Required checks
1. Trace an inquiry from `api/8ball.js` through recognition, eligibility, relevance admission, route cycle, stance formation, grammar freshness, emote policy, memory write, and final output.
2. Confirm stance formation never changes response text and never admits an otherwise ineligible response.
3. Confirm the full admitted route pool owns exact-response exhaustion. Stance cohorting must not create a smaller cycle that repeats before all admitted route responses are used.
4. Confirm deterministic seeds reproduce the same stance and selected answer from a clean memory state.
5. Confirm recent stance history lowers repetition without excluding all valid stances.
6. Confirm serious/work-style prompts cannot be pushed into roast or chaos output by the brain layer.
7. Confirm League-native preference activates only when the recognized domain supports it.
8. Confirm in-memory, file-backed, resilient, and Upstash-backed memory tolerate and persist the optional `stance` field.
9. Confirm debug output exposes stance evidence without leaking internal configuration into normal Twitch output.
10. Run validation, the full test suite, production behavior audit, humor audit, emote audit, live review, and report generation.

## Files added or materially changed
- `data/config/brain.json`
- `src/brain.js`
- `src/selection/select.js`
- `src/selection/scoring.js`
- `src/runtime.js`
- `src/memory/in-memory.js`
- `src/memory/upstash.js`
- `test/brain.test.js`
- `RELEASE_MANIFEST_V5_1_0.json`

## Non-negotiable product constraints
- No runtime LLM.
- No dynamic sentence generation.
- No response fragments or template assembly.
- No new editorial approvals.
- No deployment or Nightbot command change.
- Never weaken reference permissions, hard eligibility, serious-query safeguards, anti-repeat rules, or emote safety.

## Deliverable
Write `reports/CODEX_VERIFICATION_V5_1.md` containing:
- pass/fail per required check;
- exact commands run;
- any defects with file and line references;
- any patch applied;
- final launch recommendation: `TEST_LOCALLY`, `STAGING_READY`, or `BLOCKED`.
