# Language Update Changelog

## Scope

This pass updated the language layer only. It did not redesign routing, eligibility, anti-repeat, personality arcs, Nightbot/Vercel interfaces, public endpoints, environment variables, emote architecture, or runtime determinism.

## Source Basis

- Product/specification files were read before chat analysis.
- Chat evidence came from `SRO_CHAT_INPUTS_MINIMAL.jsonl`: 12,480 messages, 1,043 users, 1,727 question-like messages.
- Chat logs were used for phrasing, rhythm, room behavior, and emote placement evidence, not as direct production copy.

## Files Changed

- `reports/CHAT_LANGUAGE_ANALYSIS.md`
- `reports/CHAT_7TV_LANGUAGE_ANALYSIS.md`
- `reports/CHAT_KNOWLEDGE_PROPOSAL.json`
- `reports/LANGUAGE_UPDATE_CHANGELOG.md`
- `scripts/build-production-bank.mjs`
- `editorial/rewrite-v4.5.mjs`
- `data/runtime/responses.json`
- `test/chat-language-review.test.js`

## Counts

| Category | Count |
| --- | ---: |
| Production responses reviewed in targeted families | 48 |
| Production responses retained unchanged in those families | 26 |
| Production responses rewritten | 22 |
| Production responses added | 0 |
| Production responses removed | 0 |
| New regression/review tests added | 12 |
| New routes, lanes, entities, lore items, or emote compounds added | 0 |

Rejected change categories:

- No quantity response lane added.
- No new named-person special cases added.
- No direct chat-copy production lines added.
- No new emote compounds added.

## Before/After Samples By Family

| Response family | Before | After |
| --- | --- | --- |
| `general_prediction_yes` | YES - the signs are unusually cooperative. | YES - chat is early, but not wrong yet. |
| `general_prediction_no` | NO - this ends before it improves. | NO - this is already asking for a replay. |
| `general_prediction_ask_again_later` | ASK AGAIN LATER - the answer is still moving. | ASK AGAIN LATER - the lobby is still confessing. |
| `general_prediction_yes` | THE SIGNS SAY YES - proceed without celebrating. | THE SIGNS SAY YES - chat may not celebrate yet. |
| `general_prediction_no` | THE SIGNS SAY NO - optimism has lost standing. | THE SIGNS SAY NO - the cope arrived overdressed. |
| `general_evaluation_no` | NO - the premise is carrying the result. | NO - the result is doing charity work. |
| `general_evaluation_very_doubtful` | VERY DOUBTFUL - the confidence is decorative. | VERY DOUBTFUL - confidence is typing over the footage. |
| `general_evaluation_no` | NO - this did not survive inspection. | NO - the replay is less generous. |
| `general_evaluation_outlook_unclear` | OUTLOOK UNCLEAR - success and good judgment are arguing. | OUTLOOK UNCLEAR - the result and the play disagree. |
| `general_timing_not_yet` | NOT YET - the moment is still forming. | NOT YET - chat is early again. |
| `general_timing_ask_again_later` | ASK AGAIN LATER - the timing is still hiding. | ASK AGAIN LATER - the queue has not committed. |
| `general_timing_unclear` | OUTLOOK UNCLEAR - the clock is hiding behind circumstance. | OUTLOOK UNCLEAR - the timer is mostly vibes. |
| `general_location_unclear` | OUTLOOK UNCLEAR - the trail ends at poor judgment. | OUTLOOK UNCLEAR - the ping went unanswered. |
| `general_location_direct_location` | ELSEWHERE - with the better decision. | ELSEWHERE - probably dodging the next question. |
| `general_location_ask_again_later` | ASK AGAIN LATER - location services have chosen secrecy. | ASK AGAIN LATER - chat has not found the minimap. |
| `bot_status_direct_identity` | The Ball is an object with excellent timing. | It is a command with good timing. |
| `bot_status_unclear` | Ask the cursed object a better question. | Ask a better question first. |

Note: table dashes are normalized for readability; generated responses retain the existing authored punctuation style.

## Review Regression Coverage

Added `test/chat-language-review.test.js` with real chat-style prompts covering:

- yes/no and evaluation: `is this promo game`, `is this the same camille?`
- prediction/fragment shorthand: `winnable`, `Worth going hull this game lol?`
- timing/location-style directness: `Where is Renek?`
- League gameplay: `sro smite`, `why is olaf running it down`
- named/room-native shorthand: `SRO Promo Game`, `doubt or believe?`, `let him cook?`
- ambiguous/incomplete prompts: `what rank are you atm?`

Each case asserts:

- recognized intent
- resulting `route_family`
- top admitted response family or family set
- selected response family
- final answer satisfies the requested form
- no fallback

## Behavior Change Notes

- Routes were not changed by this language pass.
- Eligibility and the corrected recognizer ordering remain unchanged.
- The 22 production output changes are text-only replacements in existing response IDs and semantic families.
- Existing specific League and room-native routes remain unchanged in the complete suite.
- No previously passing automated test failed after the update.

## Validation Results

Manual equivalent of `npm run check` was run with the bundled Node runtime because this workspace does not expose `npm`.

- Reasoning package: valid; 60 router fixtures, 12 selector cases, 15 test-only responses.
- Production response build: 689 approved responses.
- Full test suite: 182/182 passed.
- Production behavior audit: passed; 689 responses, schema valid, exact duplicates 0, AI/software voice flags 0, max response length 66, golden routes with >=4 normal admitted answers 59/59.
- Humor grammar audit: passed; 689 responses, 59 routes.
- Emote system audit: passed; 689/689 responses with emote policy, 187/240 emote-bearing simulated replies, semantic mismatches 0, out-of-set selections 0.
- Live output review: passed; 210 outputs, 166 with emotes, 37 unique emotes.
- Report generation: passed.
