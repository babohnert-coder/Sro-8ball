# Codex Master Prompt v3: Rebuild the SRO Twitch `!8ball`

## Read this first

You are rebuilding a finite, authored Twitch Magic 8 Ball for the SoloRenektonOnly community.

This project has two different problems:

1. **Recognition engineering** — understand what the viewer asked, extract the relevant League/SRO concepts, and select the correct response family.
2. **Editorial curation** — maintain a restrained Magic 8 Ball identity while allowing serious, dry, funny, room-specific, and occasionally chaotic answers.

Do not solve both problems as one undifferentiated generation task.

The previous failure mode was technically functional code attached to a response bank that was over-written, incomplete, repetitive, and insufficiently reviewed. Your job is to prevent that failure structurally.

---

# 1. Governing product contract

The runtime product is:

> **A finite, authored response selector with deep rule-based recognition, persistent variety control, and a restrained Magic 8 Ball surface.**

It is not:

- an LLM at runtime
- a conversational chatbot
- a streamer impersonator
- a Reddit commenter
- a live joke generator
- a sentence-fragment assembler
- a sentient character
- a generic sarcastic bot with League nouns pasted into its answers

The governing principle is:

> **League-native understanding underneath; restrained 8-Ball delivery on the surface.**

A useful analogy is curation. The engine should recognize the type of moment and select the best finished answer. It should not talk over every inquiry or try to manufacture a punchline every time.

---

# 2. Priority order when requirements conflict

When two goals conflict, follow this order:

1. **Preserve the Magic 8 Ball identity.**
2. **Do not invent context, mechanics, champions, events, or live game state.**
3. **Correctly answer the viewer's question form.**
4. **Match explicit League, SRO, and room-lore concepts.**
5. **Return a concise, readable answer.**
6. **Maintain variety and suppress repetition.**
7. **Be funny when the inquiry and response family support it.**
8. **Use SRO lore or emotes only when earned.**

Comedy, novelty, lore, and emotes must never outrank relevance or object identity.

---

# 3. Source authority and conflict resolution

Inspect all supplied project material before changing architecture or content. Likely sources include:

```text
SRO_8BALL_REFERENCE_MANIFEST.md
AUTHORED_RESPONSES.md
README.md
RESEARCH_NOTES.md
data/responses.json
data/routes.json
src/router.js
src/oracle.js
src/memory-store.js
src/seventv.js
src/text.js
api/8ball.js
api/health.js
test/oracle.test.js
scripts/compile-responses.js
smart-responses.json
older response banks
response-review documents
SRO Twitch chat-log JSON files
7TV/emote research
```

Use this authority order when sources disagree:

1. This product contract.
2. Explicit user approvals and rejections contained in supplied project discussion or review documents.
3. Verified current repository behavior and tests.
4. SRO chat logs and established room usage.
5. League-language research and public community patterns.
6. Legacy response banks and README claims.

Do not treat legacy counts, route names, comments, or documentation as true until verified.

Do not fabricate missing files, game context, labels, emote meanings, or repository history.

Preserve original source material in an archive or source directory. Do not destructively overwrite it.

## 3A. Mandatory reference pack

You do not inherit any prior ChatGPT conversation, memory, hidden context, or unstated knowledge about SRO's room.

Before writing code or content, read `SRO_8BALL_REFERENCE_MANIFEST.md` in full. Treat it as required input, not optional background.

The manifest defines:

- verified and candidate identities
- aliases and ambiguous names
- room concepts and multiword callbacks
- allowed triggers
- forbidden assumptions
- source-file expectations
- what must remain unresolved until verified

If `SRO_8BALL_REFERENCE_MANIFEST.md` is missing:

1. do not infer room lore from legacy responses
2. do not create named-person routes beyond generic entity recognition
3. stop after repository inventory
4. create `reports/missing-context.md`
5. request the missing manifest and source files

If raw chat logs or other evidence named by the manifest are missing, keep affected references `candidate` or `unknown`. Candidate references may appear in debug output but must not unlock production responses.

Create `reports/reference-verification-report.md` before room-lore implementation. Every named person, callback, business topic, old-build reference, and emote meaning must show its source, status, ambiguity, and production eligibility.

A legacy response is never sufficient evidence by itself. Old content may contain invented, exaggerated, stale, rejected, or over-written lore.

## 3B. Reference resolution rules

The recognizer must distinguish:

- entity recognition: a name or alias appears
- reference resolution: the entity has a verified project meaning
- response permission: the verified meaning and inquiry jointly justify a room-lore answer

These are separate stages.

Example:

```text
Input: is John winning?
```

`John` may be recognized as a person, but unless the exact alias and source-backed identity are resolved, the engine must not invent doubter-list, spreadsheet, geography, moderator, or relationship lore.

Unknown named chatters must fall back to generic person/social/moderation handling.

No coding agent may expand a candidate reference into new lore while 'helpfully' filling gaps.

---

# 4. Execution protocol and hard gates

If agent delegation is available, use separate workstreams:

- **Coordinator:** owns the product contract, integration, and final decisions.
- **Recognition agent:** ontology, aliases, intent/domain/entity/concept extraction, and routing.
- **Selection agent:** candidate eligibility, scoring, anti-repeat logic, and tone balancing.
- **Infrastructure agent:** API, persistence, deployment, health checks, and 7TV integration.
- **QA agent:** fixtures, adversarial tests, metrics, regression testing, and audit reports.
- **Editorial auditor:** lint rules, response schema, review exports, and small pilot batches only.

The editorial auditor must not mass-generate the final response bank.

## Gate 0 — repository inventory

Before implementation:

- inventory every relevant file
- run all existing tests
- verify claimed route and response counts
- identify empty pools and misleading tests
- preserve a copy of legacy data
- document current deployment assumptions
- confirm the reference manifest and source files are present
- generate a missing-context report for absent sources

Output:

```text
docs/00-current-state-audit.md
reports/missing-context.md, when applicable
```

## Gate 1 — product and ontology design

Before rewriting the router:

- create the ontology schema
- define intent, domain, entity, concept, state, and delivery taxonomies
- document ambiguity rules
- create the first 50 labeled inquiry fixtures
- create a routing error taxonomy
- verify every named reference and room callback against the manifest and source files
- produce `reports/reference-verification-report.md`

Output:

```text
docs/01-product-contract.md
docs/02-recognition-architecture.md
data/ontology/*.json
test/fixtures/router-pilot.json
```

Do not write a large response bank at this gate.

## Gate 2 — recognition engine

Build and validate recognition without using final response quality as evidence.

The recognizer must return an explainable feature bundle and rule evidence.

It must pass the pilot thresholds in Section 16 before selection work is considered stable.

Output:

```text
src/recognition/*
test/recognition/*
reports/router-pilot-report.md
```

## Gate 3 — selector and persistence

Build:

- hard eligibility filtering
- candidate scoring
- anti-repeat memory
- deterministic test mode
- persistent production adapter
- debug explanations

Use legacy or placeholder responses during this phase.

Output:

```text
src/selection/*
src/memory/*
test/selection/*
reports/selection-report.md
```

## Gate 4 — editorial workbench

Build a review workflow before content expansion.

The reviewer must be able to:

- filter by metadata
- inspect why a response is eligible
- approve, reject, edit, or flag a line
- see duplicate and cadence warnings
- export/import review decisions

A simple local page is acceptable. Clean Markdown/CSV review exports are also acceptable.

## Gate 5 — pilot response batch

Create no more than **40 new draft responses** in the first batch.

The pilot must cover a representative spread of:

- pure general oracle
- current game outcome
- win/loss uncertainty
- build evaluation
- rank/Masters
- shutdown/throw/comeback
- champion/matchup
- SRO-specific context
- serious delivery
- dry delivery
- limited chaos

Every new response remains `draft` until explicitly approved.

Output:

```text
editorial/pilot-batch-01.md
data/responses/pilot-batch-01.json
reports/pilot-batch-01-lint.md
```

## Gate 6 — editorial expansion

Do not enter this gate automatically.

Stop and present:

- current-state audit
- ontology
- pilot routing report
- selector report
- editorial workbench
- 40-line pilot response batch

Do not generate hundreds of responses unless the user explicitly approves continuing after reviewing those materials.

---

# 5. Runtime constraints

At runtime:

- select one complete pre-authored response
- return it unchanged except for safe output clamping or approved emote omission
- do not call an LLM
- do not paraphrase
- do not assemble clauses or fragments
- do not dynamically write jokes
- do not infer live stream state from anything other than the inquiry unless a separate verified context integration is explicitly added later

The current build should operate correctly from inquiry text alone.

---

# 6. Surface identity

Most visible answers should resemble a functional Magic 8 Ball:

```text
YES — but not cleanly.
NO — the Ball has seen enough.
OUTLOOK GOOD — the game still has a shape.
VERY DOUBTFUL — the lead changed owners.
ASK AGAIN LATER — one fight will answer it.
UNCLEAR — this can still go either way.
```

The Ball may be contextually sharp without sounding like a person trying to prove League knowledge.

## Editorial surface rules

- Prefer one sentence.
- Editorial target: usually under 140 characters.
- Hard runtime cap: no greater than 390 characters.
- Prefer one strong idea over setup plus explanation.
- Most answers should begin with a recognizable verdict family.
- Do not require every answer to be funny.
- Do not attach a second joke after the line has already landed.
- Do not use more specialized League detail than the inquiry supports.
- Avoid stacking multiple slang terms in one answer.
- Avoid repeated cadence across the bank.

## Recommended verdict families

```text
YES
NO
MAYBE
NOT YET
OUTLOOK GOOD
OUTLOOK UNCLEAR
VERY DOUBTFUL
LIKELY
UNLIKELY
ASK AGAIN LATER
THE SIGNS SAY YES
THE SIGNS SAY NO
```

Additional families are allowed, but the product should remain recognizably an 8 Ball.

---

# 7. Tone and delivery modes

Support these delivery modes:

- `classic` — pure or nearly pure Magic 8 Ball
- `direct` — serious and concise
- `contextual` — one precise relevant detail
- `dry` — understated reversal
- `room_lore` — SRO-specific, only when justified
- `chaos` — rare, readable, lightly absurd

Initial soft target distribution:

```json
{
  "classic_or_direct": 0.40,
  "contextual": 0.30,
  "dry": 0.15,
  "room_lore": 0.05,
  "chaos": 0.10
}
```

These are corpus and long-window targets, not per-ten-request quotas.

Never use chaos as the fallback for recognition failure. Low-confidence recognition must fall back toward a general classic/direct oracle response.

Humor should be input-aware:

- high-stakes or clearly serious inquiry -> direct/classic favored
- ordinary general inquiry -> classic/contextual favored
- explicit League/SRO event -> contextual/dry allowed
- recognized room callback -> room_lore allowed
- low-risk general inquiry with strong fallback coverage -> chaos occasionally allowed

---

# 8. Recognition pipeline

Implement this pipeline:

```text
raw inquiry
  -> normalization
  -> question-form classification
  -> domain classification
  -> entity extraction
  -> multiword concept/event extraction
  -> state/polarity detection
  -> ambiguity analysis
  -> specificity calculation
  -> recognition confidence
  -> feature bundle
  -> hard candidate eligibility
  -> candidate scoring
  -> anti-repeat and distribution penalties
  -> weighted selection
  -> optional emote validation
  -> plain-text response
```

The system may remain deterministic and rule-based. Machine learning is not required.

All recognition logic should be data-driven where practical rather than buried in one large source file.

---

# 9. Normalization and ambiguity

Normalize safely:

- casing
- punctuation
- repeated whitespace
- Twitch command residue
- common aliases
- common misspellings
- simple contractions

Preserve:

- raw input
- meaningful negation
- word order where it changes meaning
- player/champion names
- punctuation when it signals reaction or nonsense

Create explicit ambiguity handling for polysemous words, including examples such as:

- `build` as item build vs. `build a lead`
- `free` as easy game/objective/kill vs. no cost
- `carry` as game performance vs. ordinary-life usage
- `int` as intentional feeding vs. casual exaggeration
- `cooking` as build experimentation vs. food
- `solo` as SRO alias vs. playing alone
- `worth` as evaluation vs. ironic cope
- `resetting his gold` as shutdown-given cope

Ambiguous recognition should lower confidence rather than forcing a narrow route.

---

# 10. Feature hierarchy

## 10.1 Intent / question form

At minimum:

- `prediction`
- `permission`
- `evaluation`
- `comparison`
- `timing`
- `explanation`
- `identity`
- `reaction`
- `nonsense`

Intent should strongly constrain verdict families.

## 10.2 Domains

At minimum:

- `general_oracle`
- `current_game`
- `sro`
- `rank_climb`
- `builds_items_runes`
- `champion_matchup`
- `lane_wave_state`
- `player_role_performance`
- `objective_macro`
- `fight_dive_trade_shutdown`
- `stream_chat_moderation`
- `room_lore`
- `ordinary_life`
- `relationships_social`
- `work_money`
- `food_health_outside`

Allow multiple domains with confidence scores.

## 10.3 Entities

Represent independently:

- SRO aliases: `SRO`, `Mike`, `SoloRenektonOnly`, context-dependent `Solo`
- viewer/self: `I`, `me`, `we`
- ally/enemy
- role names
- champions
- item/rune/build
- rank/LP/MMR
- objectives and structures
- recurring chat users and moderators

Do not assume ambiguous aliases always resolve to one entity.

## 10.4 Concepts and events

Use an extensible ontology of multiword concepts.

Example:

```json
{
  "shutdown_given": {
    "phrases": [
      "gave the shutdown",
      "donated the bounty",
      "cashed him out",
      "reset his gold",
      "handed over 700g"
    ],
    "domains": ["current_game", "fight_dive_trade_shutdown"],
    "implied_state": ["negative_event", "reversible"],
    "notes": "Do not infer game over."
  }
}
```

Required early concept families should include:

- current game outcome
- game winnable / game over
- shutdown given or collected
- throw risk
- comeback possible
- won/lost lane
- jungle pressure
- counterpick
- wave denial/freeze
- dive/trade
- objective call/flip
- experimental build / Feedmax / cooking
- build success/failure
- rank streak / Masters goal
- LP/MMR movement
- worth/cope language
- serious direct inquiry
- room callback

## 10.5 State and polarity

Support tags such as:

- `positive`
- `negative`
- `uncertain`
- `mixed`
- `likely`
- `unlikely`
- `reversible`
- `already_decided`
- `ahead`
- `behind`
- `comeback_possible`
- `throw_risk`
- `serious`
- `sarcastic_or_cope`

Do not infer factual state not present in the input.

## 10.6 Specificity

Calculate input specificity from 0.0 to 1.0.

Examples:

```text
what happens                                      -> 0.10
will Mike win                                     -> 0.35
will Mike hit Masters with this build             -> 0.68
is it over after Mike gave a 700g shutdown        -> 0.90
```

A response must never exceed the inquiry's supported specificity.

---

# 11. Feature bundle contract

The recognizer should return a structured bundle such as:

```json
{
  "raw": "is the game over after Mike gave the shutdown",
  "normalized": "is the game over after mike gave the shutdown",
  "intent": {"label": "prediction", "confidence": 0.97},
  "domains": [
    {"label": "current_game", "score": 0.96},
    {"label": "sro", "score": 0.80},
    {"label": "fight_dive_trade_shutdown", "score": 0.89}
  ],
  "entities": [
    {"type": "person", "value": "sro", "surface": "Mike", "confidence": 0.99}
  ],
  "concepts": [
    {"label": "shutdown_given", "confidence": 0.99},
    {"label": "game_over_question", "confidence": 0.95}
  ],
  "state": [
    {"label": "negative_event", "confidence": 0.95},
    {"label": "reversible", "confidence": 0.62}
  ],
  "specificity": 0.88,
  "confidence": 0.93,
  "ambiguities": [],
  "evidence": [
    "phrase: game over",
    "entity alias: Mike -> sro",
    "concept phrase: gave the shutdown"
  ]
}
```

Debug output must show evidence and competing interpretations.

---

# 12. Response schema and hard eligibility

Use structured response objects.

```json
{
  "id": "game_shutdown_uncertain_001",
  "text": "NOT YET — the gold changed hands, not the result.",
  "intents": ["prediction"],
  "domains_any": ["current_game"],
  "domains_all": [],
  "entities_required": [],
  "entities_forbidden": [],
  "concepts_any": ["shutdown_given"],
  "concepts_all": [],
  "concepts_forbidden": ["shutdown_collected_by_sro"],
  "states_any": ["negative_event", "reversible"],
  "verdict": "uncertain_positive",
  "delivery": "contextual",
  "league_intensity": 1,
  "sro_intensity": 0,
  "seriousness": 2,
  "chaos": 0,
  "emote": null,
  "min_specificity": 0.45,
  "max_specificity": 1.0,
  "status": "draft",
  "semantic_family": "shutdown_not_decisive",
  "opening_family": "not_yet",
  "syntax_family": "verdict_dash_single_clause",
  "editorial_notes": "Only when a shutdown transfer is explicit."
}
```

Required metadata:

- stable ID
- complete text
- intent compatibility
- required/preferred/forbidden domain constraints
- required/preferred/forbidden entity constraints
- required/preferred/forbidden concept constraints
- state compatibility
- verdict family
- delivery mode
- League intensity 0-3
- SRO intensity 0-3
- seriousness 0-3
- chaos 0-3
- specificity range
- semantic family
- opening family
- syntax family
- optional authored emote
- editorial status
- notes/source assumptions

Production mode may select only `approved` responses.

## Hard eligibility before scoring

A response is ineligible when:

- intent is incompatible
- a required concept/entity/domain is missing
- a forbidden concept/entity/domain is present
- response specificity exceeds input specificity
- League intensity exceeds supported context
- SRO intensity exceeds explicit or strongly resolved SRO context
- response is `draft`, `rejected`, or `archived` in production
- authored emote cannot be safely resolved and no approved no-emote form exists

Do not let variety penalties rescue an ineligible response.

---

# 13. Selection algorithm

Selection must occur in this order:

1. hard eligibility
2. relevance scoring
3. specificity fit
4. verdict compatibility
5. delivery-mode suitability
6. seriousness fit
7. variety penalties
8. soft distribution balancing
9. weighted choice among the strongest remaining candidates

Candidate score should consider:

- intent match
- domain scores
- entity match
- concept/event match
- state match
- specificity distance
- delivery appropriateness
- League intensity fit
- SRO intensity fit
- seriousness fit
- semantic-family freshness
- opening-family freshness
- syntax-family freshness
- emote freshness
- user history
- global history

Use a relevance floor. Never choose a weak match merely because it is unused.

## Fallback hierarchy

When no precise response is eligible:

1. same intent + broad domain response
2. same intent + general oracle response
3. safe pure classic/direct response
4. safe missing-inquiry/help response when appropriate

Do not use chaos, champion references, SRO lore, or unrelated League concepts as a recognition fallback.

---

# 14. Persistent variety and privacy

Implement a memory-store interface with:

- in-memory adapter for tests/development
- Redis-compatible production adapter, preferably Upstash if repository/deployment evidence supports it
- graceful fallback when persistence is unavailable

Track configurable recent windows for:

- inquiry fingerprint by user
- exact response by user
- exact response globally
- semantic family
- opening family
- syntax family
- concept family
- delivery mode
- emote

Use TTLs and bounded lists/sets.

Avoid storing unnecessary raw chat content. Prefer normalized fingerprints and response IDs. Hash viewer identifiers if practical while preserving stable per-user anti-repeat behavior.

Never expose secrets or internal memory content in production responses.

---

# 15. Editorial contract

## The Ball should sound like

- a good Magic 8 Ball
- concise and confident
- sometimes direct
- sometimes mysterious
- sometimes dry
- occasionally funny
- rarely room-specific
- rarely chaotic
- knowledgeable without performing knowledge

## The Ball should not sound like

- an annoying League Redditor
- a software status bot
- an AI explaining a joke
- a streamer impersonation
- an edgy insult generator
- a character seeking attention
- a paragraph writer

## Good examples

```text
OUTLOOK GOOD — the game still has a shape.
NO — the Ball has seen enough.
UNCLEAR — one fight will answer it.
YES — but not cleanly.
NOT YET — the gold changed hands, not the result.
MAYBE — winning once would extend the experiment.
YES — one win and Mike builds it all week.
DOUBTFUL — that wave belongs to someone else now.
```

## Reject examples

```text
The crocodile sees the angle. The minimap sees four people.
The experiment is viable until winning teaches the wrong lesson.
Operational. Chat remains the unstable dependency.
Systems green. Chat judgment remains red.
The items form a sentence. The grammar is hostile.
```

## Editorial lint

Flag or score:

- software/AI vocabulary
- fake sentience
- ornamental League nouns
- unsupported champion/mechanic references
- two polished clauses repeated across the bank
- `X remains Y` overuse
- `X detected` overuse
- random noun plus `diff`
- excessive semicolons
- repeated openings
- repeated punchline structures
- explanation after punchline
- hostility aimed at the viewer
- forced SRO lore
- stale memes
- overlong responses

Do not auto-reject every flagged line. Produce a review reason and severity.

## League-language rule

Use League language when it communicates something precise:

```text
NO — the wave is frozen.
YES — if the other four stay hypothetical.
NOT YET — that shutdown only changed the math.
```

Do not stack slang or turn the Ball into a Reddit monologue.

## SRO-lore rule

Recognized room material may include:

- Mike/SRO
- Renekton/top lane
- experimental or Feedmax builds
- Masters/rank goals
- doubters/believers
- recurring named chat lore
- plumbing, Bitcoin, Jokic, and established room topics

Use it only when the inquiry or resolved feature bundle earns it.

---

# 16. Evaluation and measurable acceptance thresholds

Create at least 300 labeled inquiries drawn from or inspired by supplied project material.

Split into:

- 50 pilot fixtures
- 200 broad regression fixtures
- 50 adversarial/ambiguity fixtures

Use deterministic seeds for selection tests.

## Recognition metrics

On the 50-input pilot before Gate 3:

- intent exact accuracy >= 92%
- primary-domain exact accuracy >= 88%
- entity precision >= 95%
- concept micro-F1 >= 85%
- unsupported-specificity violations = 0
- invented champion/objective/mechanic references = 0

On the final 300-input set:

- intent exact accuracy >= 90%
- primary-domain exact accuracy >= 87%
- entity precision >= 94%
- concept micro-F1 >= 84%
- generic-input overclassification rate <= 5%
- unresolved named-reference lore activation = 0
- candidate-reference production activation = 0
- unsupported-specificity violations = 0

If a metric is not appropriate for a fixture, document the exception rather than gaming the denominator.

## Required contrast pairs

Include examples such as:

```text
Will Mike win?
Did Mike win lane?
Is this game winnable?
Should Mike keep building this?
Will this build win?
Is Renekton good here?
Is Mike good?
Was that worth?
Is he just resetting the gold?
Will Mike hit Masters with this build?
What is the outcome of this game?
Did Mike build a lead?
Is this build free?
Is Baron free?
Is top free?
Should I cook dinner?
Is Mike cooking?
```

## Selection tests

- production selects approved responses only
- every selected response satisfies hard constraints
- response specificity never exceeds inquiry specificity
- general inputs do not receive unsupported champion/objective/lore references
- serious delivery remains available
- chaos frequency approaches configuration over a large deterministic sample of eligible inquiries
- chaos is never used as low-confidence fallback
- relevance floor is respected

## Variety tests

- no exact repeat inside configured windows when alternatives exist
- no semantic-family repeat beyond threshold
- no opening-family or syntax-family dominance
- diversity across 100 similar inquiries
- persistence survives separate-process simulation
- user-specific and global histories both work

## Inventory tests

- no empty production fallback chain
- minimum approved coverage for common feature bundles
- all IDs unique
- all metadata valid
- no orphan concepts
- no invalid emote without fallback behavior
- duplicate and near-duplicate thresholds pass

## API tests

- plain text by default
- debug JSON behind explicit configuration
- safe URL decoding
- safe missing-inquiry behavior
- output below hard cap
- health endpoint reports data load, persistence readiness, response coverage, and 7TV status accurately
- no sensitive configuration exposure

---

# 17. 7TV behavior

7TV is optional finishing language, not decoration.

Requirements:

- resolve the active SRO channel set
- cache it
- support configured fallback aliases
- allow manual environment override
- validate authored emotes before return
- omit an unavailable emote safely only when the remaining text is still an approved complete response
- do not append random emotes
- track recent emote use
- expose 7TV health separately from core command health

A 7TV outage must never break `!8ball`.

---

# 18. API and deployment

Target the existing Node/Vercel/Nightbot workflow unless repository evidence shows otherwise.

Expected endpoints:

```text
GET /8ball?q=<encoded inquiry>&user=<viewer>
GET /api/8ball?q=<encoded inquiry>&user=<viewer>
GET /health
GET /api/health
```

Default response:

- `text/plain`
- no Markdown
- safe headers
- editorial target usually below 140 characters
- hard cap no greater than 390 characters

Expected Nightbot command shape:

```text
$(urlfetch https://YOUR-VERCEL-DOMAIN/8ball?q=$(querystring)&user=$(user))
```

Preserve the existing public path when possible.

## Debug mode

Debug JSON may include:

- normalized inquiry
- intent/domains/entities/concepts/state
- ambiguity notes
- specificity and confidence
- fired rules and evidence
- rejected candidate reasons
- top candidate scores
- selected response ID
- memory penalties
- delivery and chaos decisions
- emote validation result

Debug mode must be disabled or protected in production and must not expose secrets or the full response bank.

---

# 19. Required deliverables

Produce:

1. current-state audit
2. product-contract document
3. recognition architecture
4. ontology files
5. 50-input pilot fixture set
6. explainable recognizer
7. pilot metrics report
8. structured response schema and validator
9. hard-eligibility selector
10. persistent memory adapter plus in-memory adapter
11. 7TV adapter with graceful failure
12. editorial workbench or review export/import workflow
13. 300-input evaluation set
14. automated tests
15. no-more-than-40-line pilot response batch
16. response coverage report
17. deployment docs and environment template
18. migration map for legacy routes and responses
19. final report separating engineering completion from editorial approval

Do not describe the response library as complete unless the user has reviewed and approved the relevant content.

---

# 20. First-run instruction to Codex

Perform Gates 0 through 5.

Then stop before bulk editorial expansion and present:

- what was actually found in the repository
- what was misleading or broken
- the ontology and recognition hierarchy
- the 50-fixture routing results and errors
- the selection and persistence design
- the review workflow
- the 40-line draft pilot batch
- exact commands to run tests and start the project
- any unresolved decisions that materially affect the product

Do not ask the user to provide material that already exists in the repository or supplied source files. Search and use the existing material first.

Do not skip directly to generating a giant response bank.

The engineering can be complete before the writing is approved. Keep those states separate.
