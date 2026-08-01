# SRO 8 Ball Integration Pass — V4.8

## Why this pass existed

The project had accumulated strong routing, authored humor, anti-repeat memory, and 7TV classification, but those systems were still capable of making independent decisions. Passing unit tests did not guarantee that a live room phrase opened the right pool, that equivalent phrasings shared history, or that the selected emote expressed the same retort as the sentence.

V4.8 makes the information flow continuous from inquiry to output.

## Integrated runtime chain

```text
inquiry
→ normalize and recognize
→ canonical route family
→ hard eligibility and lore permission
→ hierarchical specificity cohort
→ relevance-admitted pool
→ optional controlled-chaos branch for eligible broad prompts
→ unused exact-answer cycle
→ fresh humor-grammar tier
→ uniform RNG response
→ authored line-level emote contract
→ route-context refinement
→ active-set semantic emote tier
→ emote repetition filter
→ final plain-text output
```

## Seams corrected

### 1. Equivalent questions had different variety chains

The route key previously included every detected concept. A harmless additional concept could split two phrasings that should share history. V4.8 uses a canonical `route_family` plus intent.

### 2. Specific routes could still admit too much generic material

Responses now enter hierarchical match tiers. Exact concept/entity material is filled first; broader domain material supplements only when the specific pool is too small. A generic unused line cannot beat a relevant route line merely through variety.

### 3. Durable chat language was recognized as generic chatter

The following reusable speech acts now have dedicated concepts and response pools:

- gold-reset cope
- mock `diff` diagnosis
- wave-clear jab
- premature penta/hype
- reckless `cook/send it` approval
- viewer games
- creator-collaboration money
- bot completion/version
- direct bot challenge
- mock moderator call
- affection question
- bare laughter reaction

These are durable League/Twitch reply structures, not temporary conversation memory.

### 4. Chaos disappeared after specificity was strengthened

The exact-pool hierarchy initially excluded all general chaos lines. Delivery gating now happens from the full relevance-qualified set before the normal hierarchy narrows the pool. Chaos still must pass confidence, low-specificity, non-serious, non-work, and non-ambiguity gates. The deterministic audit now measures **10.1%**.

### 5. Emote meaning and response meaning could diverge

Every response has an authored emote contract. Runtime now combines that line-level contract with the recognized route context. Exact route responses may refine broad category choices; general fallback lines are governed more strongly by route context. The final picker uses only compatible active-set aliases.

### 6. Emote debug labels could report the wrong matching family

When an emote has several meanings, debug output now reports the preferred family that actually qualified it before falling back to broader allowed families.

### 7. Pronoun resolution overclaimed context

Bare `they` no longer automatically means the enemy team. The recognizer retains the game concept without inventing a side.

## Verified results

- Approved responses: **657**
- Automated tests: **129/129**
- Router fixtures: **60/60**
- Selector cases: **12/12**
- Intent accuracy: **100%**
- Primary-domain accuracy: **100%**
- Entity precision: **100%**
- Concept micro-F1: **100%**
- Tested route coverage: **59/59** with at least four normal answers
- Controlled chaos: **10.1%**
- Exact duplicates: **0**
- Near-duplicate families: **0**
- Semantic emote mismatches: **0**
- Local emote rate: **65.0%** across 80 mixed replies
- Expanded visible review: **210 outputs**, **138 emote-bearing**, **27 distinct aliases**

## Representative integrated routes

```text
good gold reset?
→ reaction:gold_reset_cope
→ Calculated. The bounty simply changed managers.
```

```text
NA wave clear?
→ reaction:wave_clear_jab
→ Three spells. Six healthy minions. Clueless
```

```text
viewer games?
→ reaction:viewer_games
→ Chat has volunteered five new loss conditions. PauseChamp
```

```text
how much are they paying Mike for that collab
→ explanation:creator_collab_money
→ Mike’s manager has already invented a percentage. sroWink
```

```text
do you love me
→ evaluation:love_question
→ The Ball respects you professionally. Aware
```

## Remaining deployment dependencies

- The exact 7TV set ID is configured, but the full live snapshot must be synchronized in a networked environment.
- Upstash-compatible Redis credentials are required for shared Vercel cycles and concurrency locks.
- GitHub/Vercel publication was not performed in this pass.
