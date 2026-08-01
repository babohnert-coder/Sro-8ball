# SRO Oracle V7.0 — Personality Arc Build

V7 turns the finite authored 8-ball into a deterministic personality system without adding runtime AI.

## The internal chain

1. Recognition identifies intent, League context, entities, concepts, and safety.
2. Perception estimates question shape, motive, seriousness, repetition, and safe social targets.
3. Psychology diagnoses the behavior beneath the wording.
4. Values identify what the question is testing: honesty, accountability, patience, humility, adaptation, discipline, curiosity, confidence, or pattern recognition.
5. Relationship memory places each chatter on a four-stage arc.
6. Personality curvature determines how much of the Oracle is revealed at the configured volume.
7. Oracle mode chooses the social action: clean verdict, restrained correction, dry diagnosis, motive exposure, League witness, reluctant approval, quiet respect, controlled omen, plain truth, or safe redirect.
8. Existing hard eligibility and route relevance gates remain authoritative.
9. The approved response bank is scored against the complete plan.
10. Anti-repeat, grammar freshness, chaos spacing, and 7TV policy still operate after judgment.

## Personality arc

- `distant_observer` — verdict-first; worldview is mostly implied.
- `recognized_regular` — recurring biases and motive diagnosis become visible.
- `knowing_witness` — shared-history confidence and callbacks are permitted.
- `room_oracle` — full voice; familiar, concise, selectively sincere, and comfortable leaving things unsaid.

The arc does not make the Oracle louder or generically friendlier. It reveals stable opinions. Accountability and honest self-review can earn rare quiet respect.

## New persistent profile

Each chatter accumulates:

- interaction count
- repeated-question count
- League-context count
- earned-respect count
- challenged-value count
- serious-question count
- last value, diagnosis, and Oracle mode

The profile is supported by in-memory, file, and Upstash persistence.

## Configuration

- Personality volume: `SRO_8BALL_PERSONALITY_VOLUME=1..10`
- Default: `6`
- Personality constitution: `data/config/oracle-personality.json`

## Commands

```bash
npm test
npm run audit:production
npm run audit:personality
npm run audit:ai
npm run verify:v7
npm start
```

## Important limitation

V7 can now make a coherent personality decision, but it still speaks through the existing approved response bank. The engine can select with taste; it cannot create sharper authored lines that do not yet exist. Comedy and clip potential therefore remain the next editorial phase.
