# SRO 8-Ball V6 Verification

## Result
PASS for engineering handoff and controlled testing. Not deployed.

## Baseline
Built from SRO_8BALL_V5_1_0_BRAIN_PASS.zip. Existing approved production response text was not migrated or rewritten.

## Added
- PerceptionBundle with motive, seriousness, repetition, safety, and social target candidates.
- Deterministic DecisionPlan with verdict, stance, target, aggression, sincerity, League specificity, lore density, absurdity, response move, safety mode, confidence, and reasons.
- Personality volume 1-10, default 6.
- Ten production stances plus safe_redirect safety mode.
- Versioned worldview, decision rules, safety, memory, lore, and voice contracts.
- Plan-aware response ranking over approved complete lines.
- Debug exposure of perception and decision trace.
- V6 schemas, audits, simulation, scorecard, and human review export.

## Regression
- 161/161 total tests pass.
- Includes all 153 V5 tests.
- 689 production responses remain valid.
- 0 exact normalized duplicates.
- 0 near duplicate pairs at the production audit threshold.
- 59/59 golden routes retain at least four normal admitted responses.
- Exact route-cycle exhaustion and anti-repeat behavior preserved.
- Scheduled chaos remains non-consecutive and approximately 7.9% in the existing production audit.

## V6 checks
- 30 worldview commitments loaded.
- 20 decision rules loaded.
- 10 comedy stances loaded.
- Safety bypass forces safe_redirect and refusal planning at every volume.
- Repeat detection changes motive to reassurance_loop.
- Same seed and same state produce the same plan.
- 10,000-turn plan simulation uses nine eligible stances; league_realist appears only for recognized League-domain inputs.

## Voice audit
Two existing approved responses were flagged for later editorial review:
- john_west_02: corporate/legal phrase pattern.
- bones_food_04: sentence-count heuristic.

They were not silently modified because the build contract forbids unreviewed production-text changes.

## Known limitation
V6 improves judgment and selection, but the current 689-line bank still limits the ceiling of wit, clip potential, and truly original voice. The scorecard is an engineering heuristic, not proof that human reviewers will rate the personality at those values. Human play testing remains required.
