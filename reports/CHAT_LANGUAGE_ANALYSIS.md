# SRO Chat Language Analysis

## Scope And Source

- Product/spec files read first: `spec/AUTHORITATIVE_PRODUCT_SPEC.md`, `data/config/product_contract.json`, `data/config/voice-contract.json`, `editorial/style_contract.json`, `README_V7.md`, current production audit reports, current emote inventory/overrides, and `data/runtime/responses.json`.
- Chat evidence source: `SRO_CHAT_INPUTS_MINIMAL.jsonl`.
- Sample size: 12,480 messages from 1,043 users.
- Surface rhythm: average 29.1 characters, median 23 characters; average 5.55 words, median 4 words.
- Question-like messages detected: 1,727.

The product remains a finite authored response selector. The logs should inform phrasing, stance, rhythm, and room grammar, not become direct copied production dialogue.

## Current Product Constraints That Must Stay Authoritative

- Answer the requested form before lore or humor.
- Keep the corrected recognizer hierarchy authoritative.
- Preserve deterministic authored responses, anti-repeat, personality arcs, Nightbot/Vercel interface, and 7TV semantic selection.
- Do not add runtime generation, fragment assembly, new router lanes, or unsupported permanent lore.
- Keep replies complete, concise, and directly responsive.

## Common Inquiry Forms

Detected form counts overlap because chat messages often carry several signals.

| Form | Evidence count | Notes |
| --- | ---: | --- |
| Yes/no and binary prompts | 1,091 | Often written as bare `is this`, `did he`, `can we`, or no punctuation. |
| Prediction/outcome | 504 | Win/loss, winnable/doomed, rank, scale, today/tomorrow, game state. |
| Comparison/choice | 326 | `or`, `which`, `better`, implied first/second choices. |
| Timing | 317 | `when`, `soon`, `today`, `tomorrow`, `tonight`, `next`. |
| Why/explanation | 126 | Often accusatory or disbelief-first rather than sincere explanation. |
| Location | 58 | `where`, missing/lurking, absent champion/person/context. |
| League gameplay | 1,062 | Baron, dragon, smite, flash, wave, lane, build, item, champion, rank, LP. |
| Room-native entities/themes | 334 | Mike/SRO, John, MTF, Teamplay, Misanthrope, boom/waddup, gamba, plumber/bald. |

Most common question starts in the sample include `do you`, `is this`, `is that`, `are you`, `did you`, `what is`, `why is`, `can we`, `how much`, `can you`, `how do`, `what about`, `winnable`, `what rank`, and `how many`.

## Shortened Or Implied Structures

The room frequently omits the formal question frame and expects context to carry the rest.

- Single-word verdict requests: `winnable`, `doomed`, `free`, `worth`, `same?`, `easy?`.
- Noun plus question mark: champion/build/player references with no verb.
- Accusatory fragments: `paypal detected?`, `adc gap?`, `sro smite`, `same Camille?`.
- Direct streamer address: `Mike ...?`, `SRO ...?`, often without `will/is/should`.
- Outcome shorthand: `promo game`, `main acc grind`, `rank?`, `LP?`.
- Evidence shock: `how?`, `what was that?`, `this is Diamond?`.
- Room callback fragments: `boom`, `waddup`, `bald`, `plumber`, `gamba`, `doubters/believers`.

These forms support preserving compact direct answers and improving weak generic pools, but they do not justify a new quantity lane or new permanent lore by themselves.

## Common Humor Moves

- Mock certainty: chat asks from a position of fake expertise, then undercuts itself with an emote.
- Procedural accusation: `paypal`, `reported`, `police`, `mods`, mock-law phrasing.
- Scoreboard logic: current result treated as proof even when the play was bad.
- Streamer blame: the plan was possible until Mike made it educational.
- Chat blame: chat celebrates early, doubts late, and retroactively claims prediction accuracy.
- Anti-analysis: short dismissals beat ornate explanations.
- Room bureaucracy: lists, paperwork, police, appeals, verdicts, but usually in very short clauses.
- Understated absurdity: one dry line after a chaotic play feels more native than a second punchline.

## Common Response Rhythms

The chat leans short and clipped.

- One to six words is normal for reaction language.
- Eight to twelve words works for a finished joke.
- Two-clause lines work when the second clause is the turn, not a second explanation.
- All-caps/emote tokens function as punctuation, not prose.
- The logs favor blunt chat grammar over polished oracle phrasing.

Current strong bank examples already match this: `Wave gone. Lane appealable.`, `The tower is still employed.`, `The hands are here. The plan is wandering.`

## Durable Chatter Themes

The following recur enough to influence phrasing or proposal metadata, with production use still governed by verified references and existing ontology.

| Theme | Evidence count | Production implication |
| --- | ---: | --- |
| Mike/SRO direct address | 252 `mike`, 222 `sro` | Keep SRO-specific lines streamer-aware, but avoid fake live-state claims. |
| Boom/waddup greeting language | 101 `boom`, 17 `waddup` | Durable room greeting/identity signal. Existing BOOMWADDUP use is supported. |
| Bald/plumber room framing | 62 `bald`, 8 `plumber` | Existing SRO lore routes are supported; no expansion needed from frequency alone. |
| John/JWG | 58 `john`, 17 `JWG` candidate tokens | Strong recurring person signal; should not override answer form. |
| MTF/Nidalee/British orbit | 27 `mtf`, 12 `nidalee` | Existing MTF/Nidalee/British responses remain supported. |
| Teamplay/mod framing | 14 `teamplay` | Existing moderator flavor remains supported, not broadly expanded. |
| Gamba/believers/doubters | 12 `gamba`, sparse explicit believer/doubter words | Use as room-native route when recognized; do not infer from any prediction. |
| Build/cooking/Feedmax | 47 `build`, 9 `cook` | Build lines can get sharper using "cook" stance, but forced League jokes should stay gated. |

## Person-Concept And Champion-Concept Associations

Durable enough to propose, not automatically production-approved:

- SRO/Mike: win/loss, rank, top lane, builds, bald/plumber, Renekton, Darius, matchup judgment.
- John/JWG: recurring room person, doubters/believers adjacency, directional `John West/East` route already exists.
- MTF: Nidalee request, British/Londonbert phrasing in existing bank.
- Teamplay: moderation/ban/delete framing.
- Misanthrope: edge-case/chatter stress-test framing exists, but raw count here is low and should remain conservative.
- Renekton: SRO identity/top lane/default responsible pick.
- Darius/Garen/Nasus/Jax/Nidalee/Mundo/Aatrox: repeated champion mentions; Darius, Garen, Renekton, Mundo are more visible in this sample than some existing champion pools.
- Baron/dragon/smite/flash/wave/build: durable League concepts and good candidates for sharper language, but the current specific routes should remain unchanged.

## Sarcastic, Doubtful, Approving, And Dismissive Constructions

- Doubt: `this is Diamond?`, `winnable?`, `same [champ]?`, `paypal?`, `is this [player/champ]?`
- Approval: compact affirmation plus emote, often no explanation.
- Dismissal: short no-verdict frames, e.g. impossible premise, bad idea, or "not like this" energy.
- Sarcasm: false institutional language, fake investigations, mock enforcement, or treating a bad play as a curriculum.
- Approval often stays ironic; sincere praise is brief and usually anchored to clean gameplay.

## Missing Language Patterns In Current Bank

- More bare-fragment answers that still satisfy form: `winnable`, `same [champ]?`, `worth?`, `free?`.
- More room-native short verdicts in generic prediction/evaluation/timing/location pools.
- More direct "chat is early/late/wrong" stance in generic answer-shape pools.
- More League-objective cadence in specific routes without adding unsupported mechanics.
- More restrained mock enforcement where logs show police/mod phrasing, while avoiding hostile viewer targeting.

## Current Families That Sound Least Native

These are candidates for narrow rewrites after reports are complete:

| Family area | Issue | Example pattern |
| --- | --- | --- |
| `general_prediction_*` | Some lines sound like formal oracle filler rather than SRO chat. | `the signs`, `fortune`, `prophecy has chosen` |
| `general_evaluation_*` | Accurate but polished; less like a Twitch-room ruling. | `premise is carrying`, `survive inspection`, `rejects the appeal` |
| `general_timing_*` | Several lines are abstract rather than room-contextual. | `moment is still forming`, `clock is hiding` |
| `general_location_*` | Some lines are generic oracle/location-service jokes. | `location services have chosen secrecy` |
| `bot_status_*` / bot self-reference | Some self-aware object lines risk feeling more product-demo than room-native. | `object with excellent timing` |

## Editorial Recommendation

Make a narrow language pass, not a bank replacement:

- Review the generic answer-shape pools and a few low-native self-reference/life pools.
- Retain strong specific League and room-native families unchanged unless a line is plainly weaker.
- Prefer one-clause verdicts and dry second-clause turns.
- Keep answer form explicit at the start: YES/NO/MAYBE/SOON/NEARBY/THE FIRST/etc.
- Do not add new lore, new routes, or copied chat messages.
