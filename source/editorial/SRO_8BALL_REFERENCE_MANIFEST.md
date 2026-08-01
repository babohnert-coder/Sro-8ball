# SRO 8 Ball Reference Manifest

## Purpose

This file is mandatory context for any Codex or coding agent rebuilding the SRO Twitch `!8ball`.

The agent does **not** inherit the prior ChatGPT conversation, private memory, or unstated room knowledge. This manifest converts the known product context into explicit, auditable reference data.

If this file or the listed source materials are missing, do not improvise room lore. Stop after repository inventory and produce a missing-context report.

---

# 1. Authority rules

Use references in this order:

1. Explicit user-approved product rules in the master prompt and review documents.
2. This manifest.
3. Raw SRO chat logs and direct stream-derived material.
4. Verified current channel/emote data.
5. League-language research.
6. Legacy response banks and old route files.

Legacy responses are evidence of attempted ideas, not proof that a reference is correct, funny, current, or approved.

Every reference used in production must have one of these statuses:

- `verified` — supported by direct project discussion, raw chat, or a trusted source file.
- `candidate` — appears in legacy material and may be real, but must be confirmed before production use.
- `deprecated` — known old material that should not be used unless explicitly restored.
- `unknown` — unresolved; never invent a meaning.

---

# 2. Core product identity

The product is a finite authored Magic 8 Ball.

It is not a Reddit commenter, generic League chatter, sentient bot, streamer impersonator, or live joke generator.

The engine may understand references deeply while answering simply.

Correct surface behavior:

```text
OUTLOOK GOOD — the game still has a shape.
NO — the Ball has seen enough.
NOT YET — the gold changed hands, not the result.
MAYBE — winning once would extend the experiment.
```

Incorrect surface behavior:

```text
Operational. Chat remains the unstable dependency.
The crocodile sees the angle. The minimap sees four people.
The items form a sentence. The grammar is hostile.
```

---

# 3. Mandatory source map

Codex must inventory and read these source classes if supplied:

## Product and editorial sources

- `SRO_8BALL_CODEX_MASTER_PROMPT_V3.md`
- `SRO_8BALL_REFERENCE_MANIFEST.md`
- `SRO_8Ball_v3_Response_Review.md`
- `AUTHORED_RESPONSES.md`
- `RESEARCH_NOTES.md`
- prior README files

## Existing engine and response sources

- `smart-responses.json`
- `responses.json`
- `data/responses.json`
- `data/routes.json`
- `src/router.js`
- `src/oracle.js`
- `src/memory-store.js`
- `src/seventv.js`
- existing tests and compile scripts

## Raw room-language sources

Examples of known chat-log filenames include:

- `[7-20-26] SoloRenektonOnly - SRO Classic League -> Climbing to Rank 1(000) After - Top Lane Kingdom - Chat.json`
- `[7-23-26] SoloRenektonOnly - SRO Can I Even Get Masters Again...? - Top Lane Kingdom - Get Good or Die Trying - Chat.json`
- `[7-24-26] SoloRenektonOnly - SRO League Classic Gamer -> Ranked Masters Today? - Chat.json`
- `[7-27-26] SoloRenektonOnly - SRO Cooked with These Builds - INTeresting Builds to Feedmax on ... - Chat.json`

Use multiple VODs. Do not infer the whole room from one stream or one temporary joke cycle.

## Emote sources

- current active 7TV set or API-derived cache
- SRO 7TV emote research
- manual alias/meaning overrides

The entire user emote library is not the same thing as the active channel set.

---

# 4. Verified core entities and aliases

## `sro`

Status: `verified`

Aliases:

- SoloRenektonOnly
- Solo Renekton Only
- SRO
- Mike
- Dr. Mike, only when supported by source usage
- `Solo`, only when context makes the streamer reference clear

Meaning:

- The streamer and central subject of the room.
- Strong associations: top lane, Renekton, ranked climbing, Masters goals, build experimentation, game outcomes, and stream content.

Do not assume:

- every use of `solo` means SRO
- every crocodile reference means Mike
- Mike is currently playing Renekton
- Mike is ahead, behind, tilted, or winning unless the inquiry says so

## `renekton`

Status: `verified`

Aliases:

- Renekton
- Renek
- croc
- crocodile, only in clear League context

Meaning:

- Champion central to SRO's identity and historical brand.

Do not assume:

- SRO is playing Renekton in the current game
- generic animal questions refer to Renekton
- champion mechanics not stated in the inquiry

## `bones`

Status: `verified`

Aliases:

- Bones
- b0n3sxx

Meaning:

- Project creator/developer identity associated with building the 8 Ball.

Allowed usage:

- command origin or creator questions
- explicit direct references

Do not use:

- as a generic lore insert
- to make the Ball sound emotionally attached to its creator

---

# 5. Established room references requiring explicit input

These references may be used only when the viewer explicitly invokes the person/topic or when a verified multiword callback is recognized.

## `mtf`

Status: `candidate` until confirmed from raw chat in the supplied corpus

Aliases:

- MTF
- MichaelTheFan
- Michael the Fan

Likely associations found in legacy material:

- British/UK references
- repeated Nidalee requests

Rules:

- verify against raw logs before marking `verified`
- do not infer that any generic `Michael` is MTF
- do not use British or Nidalee material merely because `MTF` is absent

## `john_west_gamer`

Status: `candidate` until confirmed from raw chat

Aliases:

- John
- JohnWestGamer
- John West

Likely associations found in prior material:

- doubters/believers
- a list or spreadsheet of doubters
- moderator or administrative framing

Rules:

- `John` is ambiguous; require stronger context or exact alias
- do not invent John East/North/South variants unless independently verified
- legacy geography jokes are not automatically approved lore

## `teamplay`

Status: `candidate` until confirmed from raw chat

Likely association:

- moderator

Rules:

- use only for explicit Teamplay/moderation questions
- do not create ban threats or hostile moderator jokes by default

## `misanthrope`

Status: `candidate` until confirmed from raw chat

Likely associations in prior material:

- recurring chatter
- unusually high message volume
- prior `!8ball` or room-oracle jokes

Rules:

- do not assume emotional custody, ownership, or personal characteristics
- use only when explicitly named or when a verified exact callback is present

---

# 6. Verified room concepts and phrase normalization

## `experimental_build`

Status: `verified`

Surface phrases may include:

- interesting build
- INTeresting build
- cooking
- cooked with this build
- off-meta build
- thumbnail build
- weird build
- Feedmax / Feedmaxing

Meaning:

- A risky, unusual, content-oriented, or experimental League build.

Important distinction:

- `Feedmax` is room/build framing. It does not automatically mean deliberate feeding.
- `cooking` may refer to food outside League context.

## `rank_climb`

Status: `verified`

Surface phrases may include:

- Masters today
- hit Masters
- get Masters again
- climbing
- rank 1,000
- LP
- MMR
- six wins before six losses

Meaning:

- Ranked progression, streak goals, or Masters-related predictions.

Do not assume:

- the current rank
- exact LP
- promotion state
- that a quoted old goal is still active

## `shutdown_given`

Status: `verified`

Surface phrases may include:

- gave the shutdown
- donated the bounty
- handed over 700g
- cashed him out
- resetting his gold
- just resetting his gold

Meaning:

- A player gave an opponent shutdown gold; some phrasings are cope or ironic reframing.

Implied state:

- negative event
- not automatically game-ending
- possibly reversible

Do not assume:

- who received it unless explicit
- that the game is over
- that the death was intentional

## `top_lane_identity`

Status: `verified`

Surface phrases may include:

- Top Lane Kingdom
- top gap
- weakside
- island
- counterpick
- ranged top

Meaning:

- Top-lane role framing and recurring stream branding.

Rules:

- use precise League terms only when the inquiry supports them
- do not default to role stereotypes for generic questions

## `old_youtube_build_lore`

Status: `verified` as historical room memory, but not necessarily approved for frequent output

Known direct chat reference:

- a viewer remembered an old six-Nashor's-Tooth Jax build

Rules:

- use only when old YouTube, Jax, Nashor's, old builds, or nostalgia is invoked
- do not randomly mention six Nashor's items

---

# 7. Topic references that must remain gated

## `plumbing`

Status: `verified` as an established SRO topic from project discussion

Allowed triggers:

- plumbing
- plumber
- pipes
- drains
- toilet business
- explicit related business references

Do not insert plumbing into generic game questions.

## `bitcoin`

Status: `verified` as an established room topic from project discussion

Allowed triggers:

- Bitcoin
- crypto
- HODL or direct financial-room callback

Do not turn ordinary money questions into Bitcoin lore without explicit support.

## `jokic`

Status: `verified` as an established room topic from project discussion

Known association:

- Jokic/merch crossover or recognition

Rules:

- use only when Jokic, Nuggets, basketball, merch, or the exact room callback is invoked
- do not claim new facts about Jokic or SRO without a source

## `doubters_believers`

Status: `verified` as a room concept; person-specific administration remains candidate unless raw logs confirm it

Meaning:

- prediction-community framing around whether Mike succeeds

Allowed use:

- explicit doubter/believer questions
- prediction or rank-goal context

Do not force spreadsheets, paperwork, or named moderators unless separately verified.

---

# 8. League phrase patterns the recognizer should understand

These are language-normalization examples, not automatic output wording.

- `free` may mean easy kill, objective, lane, matchup, or no monetary cost.
- `worth` may be literal evaluation or ironic cope after a bad play.
- `cooking` may mean experimental build or literal food preparation.
- `build` may mean item/rune setup or the verb `build a lead`.
- `carry` may mean game performance or ordinary transportation.
- `int` may mean intentional feeding or exaggerated criticism.
- `resetting his gold` is shutdown-given cope.
- `Baus mental diff` is a specific style of ironic rationalization, not a generic response to every death.
- `nice throw` may be literal criticism, sarcasm, or emote-driven reaction.

When ambiguity remains, lower recognition confidence and use a broader 8-Ball response.

---

# 9. Reference-use contract

For every room-lore entity or callback in the ontology, store:

```json
{
  "id": "reference_id",
  "status": "verified|candidate|deprecated|unknown",
  "aliases": [],
  "meaning": "",
  "allowed_triggers": [],
  "forbidden_assumptions": [],
  "source_files": [],
  "review_notes": ""
}
```

Production rules:

1. Only `verified` references may make responses production-eligible.
2. `candidate` references may be recognized and shown in debug output, but may not unlock room-lore responses.
3. `unknown` references must remain unresolved.
4. No output may depend on lore that exists only in an old response line.
5. A person's name alone is not permission to invent a personality, relationship, or recurring joke.
6. Unknown named chatters should route to generic person/social/moderation handling, not fabricated lore.

---

# 10. Required source-verification deliverable

Before implementing room-lore outputs, Codex must generate:

`reports/reference-verification-report.md`

For each named reference or lore concept, report:

- aliases found
- source files inspected
- exact supporting examples or summarized evidence
- current status
- unresolved ambiguity
- whether it is allowed in production routing

The user must be able to inspect this report before room-lore content expansion.

---

# 11. Missing-context behavior

If a source file named in the master prompt or this manifest is not available:

- do not guess its contents
- list it in `reports/missing-context.md`
- continue only with architecture that does not depend on the missing source
- keep affected references `candidate` or `unknown`
- do not create production responses for those references

If the master prompt and this manifest conflict, the newest explicit user-approved instruction wins and the conflict must be documented.

---

# 12. Minimum handoff package

Codex should receive, in the same repository or task workspace:

1. `SRO_8BALL_CODEX_MASTER_PROMPT_V3.md`
2. `SRO_8BALL_REFERENCE_MANIFEST.md`
3. the current repository/build pack
4. `smart-responses.json`
5. prior response-review documents
6. multiple SRO chat-log JSON files
7. current or recent 7TV source data/research

A prompt alone is insufficient. The prompt defines the job; the manifest defines known references; the source files provide evidence.
