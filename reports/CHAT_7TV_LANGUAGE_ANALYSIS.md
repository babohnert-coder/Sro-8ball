# SRO Chat 7TV Language Analysis

## Scope

Sources read before analysis:

- `data/emotes/fallback-inventory.json`
- `data/emotes/manual-overrides.json`
- `data/emotes/expression-families.json`
- `data/emotes/chat-observations-v4.9.json`
- `data/config/emotes.json`
- `reports/EMOTE_SYSTEM_AUDIT_V4_9.md`
- `SRO_CHAT_INPUTS_MINIMAL.jsonl`

Current system constraints remain correct: emotes are selected semantically after the authored response is chosen; unknown or mismatched aliases must not be appended just to satisfy quota; reviewed compound phrases remain rare and explicit.

## Validated Inventory Hits In Chat Logs

The following tokens appeared in the chat sample and are present in the current fallback/live-compatible inventory.

| Alias | Count | Observed function |
| --- | ---: | --- |
| `xxd` | 187 | Goofy irony, mock pride, low-stakes laugh, sentence ending. |
| `KEKW` | 145 | Strong laughter or roast payoff. |
| `NODDERS` | 144 | Agreement, ironic agreement, final seal. |
| `LUL` | 140 | Light laughter, casual reaction. |
| `KEKL` | 118 | Mockery, failure laughter, room roast. |
| `POGGERS` | 112 | Hype, approval, sometimes premature excitement. |
| `LMAO` | 74 | Hard laughter, usually standalone or tail. |
| `HUH` | 57 | Confused rejection, disbelief, "what am I seeing." |
| `lookUp` | 42 | Watching/suspicion, often sentence tail. |
| `YEP` | 33 | Agreement or dry confirmation. |
| `Pog` | 25 | Mild hype/approval. |
| `HOLY` | 23 | High-intensity surprise or hype. |
| `docnotL` | 22 | Dry disapproval/recognition; current lower-confidence override is appropriate. |
| `GIGACHAD` | 21 | Power, ironic approval. |
| `Sadge` | 18 | Sadness/disappointment. |
| `ICANT` | 18 | Laughter plus disbelief. |
| `Prayge` | 17 | Pleading/hope. |
| `cmonBruh` | 12 | Admonishment/disbelief. |
| `PauseChamp` | 11 | Waiting/anticipation. |
| `BUSSIN` | 10 | Enthusiastic approval, often food/positive context. |
| `xddWalk` | 10 | Goofy exit/self-aware movement. |
| `modCheck` | 9 | Moderation/watching. |
| `badYEP` | 8 | Reluctant agreement. |
| `BOOMWADDUP` | 8 | SRO identity/hype, not generic hype. |
| `Aware` | 8 | Recognition, smug knowing. |
| `PepePolice` | 8 | Mock enforcement. |

Lower-count but valid aliases observed: `Clueless`, `Staring`, `Deadge`, `Considering`, `sadKEK`, `AINTNOWAY`, `WICKED`, `Clap`, `LETHIMCOOK`, `sroWink`, `Saddies`, `NOPERS`, `MYEYES`, `sroRip`, `COPIUM`, `HOPIUM`, `sroRekt`, `MAD`, `monkaHmm`, `omgBruh`, `Susge`, `CoolCat`.

## Non-Inventory Or Unvalidated Candidates

These capitalized/CamelCase tokens appeared but are not in the current inventory, so they should not be used in production unless separately validated against the live active set:

`STRONGERS`, `KEKG`, `peepoYELLING`, `pagPause`, `IHaveAQuestion`, `MONKA`, `xD`, `BLUBBERS`, `LETSGO`, `HypeCheer`, `peepoSitYEP`, `LMAODD`, `DinoDance`, `sroDream`, `OMEGALUL`, `PogChamp`, `BlinkWTF`, `YESIDOTHINKSO`, `ResidentSleeper`, `BASED`, `weirdChamp`, `ExplodingAlligator`, `ReallyNow`.

Several all-caps tokens are ordinary language or names rather than emotes: `SRO`, `LOL`, `EZ`, `AP`, `D2`, `IDK`, `GP`, `NA`, `NO`, `MTF`, `GG`, `TFT`, `WTF`, `PBE`, `OP`, `MODS`, `HP`.

## Placement And Sentence Function

- Most common placement is sentence-final punctuation after the stance has landed.
- Standalone emotes are common as reaction-only messages, especially `xxd`, `KEKW`, `LUL`, `HUH`, `POGGERS`, `NODDERS`.
- `NODDERS`, `YEP`, and `badYEP` work as seals on a verdict.
- `HUH`, `ICANT`, `AINTNOWAY`, and `BoyWhatTheHellBoy` work as disbelief/payoff, not generic decoration.
- `lookUp`, `modCheck`, and `PepePolice` work best with watching, suspicion, or mock enforcement.
- `Prayge`, `HOPIUM`, and `COPIUM` belong to hope/cope/prediction contexts.
- `BOOMWADDUP` is SRO identity-coded and should not be sprayed across unrelated generic lines.
- `MYEYES`, `Deadge`, `Sadge`, and `sroRip` should remain gated away from clean victories or sincere sympathy.

## Compound Usage

The existing reviewed compounds remain appropriate:

- `xxd Clap`
- `xxd CrayonTime`

The sample does not justify expanding compound generation. Individual tokens are frequent, but repeated validated production-safe compound patterns were not strong enough to add more combinations.

## Current Output System Fit

The current emote system is aligned with the evidence:

- 689/689 responses have emote policy.
- Fallback active aliases: 59.
- Recent audit: 187/240 simulated outputs bore emotes; 0 semantic mismatches; 0 out-of-set selections.
- Rolling quota and semantic blocks should remain unchanged.

## Artificial Or Risky Usages To Watch

- Hype emotes on negative or sincere lines.
- SRO-custom or identity-coded emotes on generic life/work questions.
- `BOOMWADDUP` outside SRO identity, top-lane, or high-confidence hype contexts.
- `LETHIMCOOK` on non-build/non-risk decisions unless the line explicitly frames a risky plan.
- `docnotL` should remain low-confidence and context-sensitive because it appears often enough to observe but not enough to broaden aggressively.
- Non-inventory candidates must stay out of authored responses and policy unless live inventory validation adds them.

## Recommendation

Do not change the emote architecture. In the language pass, revise authored emote intent only when changing response text shifts the line act. Keep the most common room punctuation aliases available through existing semantic policy rather than hardcoding them into new authored lines.
