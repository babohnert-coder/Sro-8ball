# SRO Twitch Magic 8 Ball — V5.0 Launch-Hardened Build

A finite, authored Twitch `!8ball` with rule-based League/SRO recognition, canonical route families, exact-cycle variety, room-native retort grammar, and semantic 7TV emote routing. It does not call an LLM or assemble jokes at runtime.

## What V5.0 adds

V5.0 preserves the complete V4.9 response, routing, and contextual-emote system while hardening the three behaviors that matter during a live stream:

- chaos is scheduled once every 10–15 eligible answers and can never streak;
- immediate semantic, opening, reply-move, twist, target, and payoff families are blocked when fresh alternatives exist;
- configured Upstash persistence automatically falls back to warm process-local history during an outage and reports degraded health until it recovers.

The V4.9 contextual-emote pipeline remains intact:

V4.9 preserves the V4.8 integrated pipeline and adds a contextual emote-language layer learned from actual SRO room usage without retaining temporary daily banter as lore:

1. the inquiry produces intent, domain, entities, concepts, state, and a canonical `route_family`;
2. the route family opens the most specific authored response pool with enough variety;
3. relevance controls admission, never the final answer order;
4. exact route history exhausts the admitted pool before repetition;
5. retort-grammar history prefers a fresh conversational move;
6. each selected line contributes its authored emote intent;
7. the recognized route refines that intent;
8. the active SRO 7TV set supplies a compatible, fresh alias.

Keywords are routing evidence. They do not have to appear in the response.

## Verified state

- Automated tests: **141/141 passed**.
- Golden recognition fixtures: **60/60 passed**.
- Intent accuracy: **100%**.
- Primary-domain accuracy: **100%**.
- Entity precision: **100%**.
- Concept micro-F1: **100%**.
- Golden selector cases: **12/12 passed**.
- Approved production responses: **657**.
- Tested golden routes with at least four admitted normal answers: **59/59**.
- Exact normalized duplicates: **0**.
- Near-duplicate response families: **0**.
- AI/software-status voice flags: **0**.
- Scheduled chaos spacing: **one result every 10–15 eligible answers, with no consecutive chaos**.
- Responses with integrated emote contracts: **657/657**.
- Local emote audit: **165/240 replies (68.8%)**.
- Expanded live review: **138/210 replies with emotes**, using **38 distinct outputs**.
- Semantic emote mismatches: **0**.


## Contextual emote grammar

- Distinguishes goofy irony (`xxd`) from light laughter (`LUL`) and hard laughter (`KEKL`, `KEKW`, `LMAO`).
- Distinguishes desperate hope (`Prayge`) from gamba belief (`gambabert`) and generic cope.
- Restricts `MYEYES`, `BoyWhatTheHellBoy`, `PepePolice`, `BUSSIN`, and other local aliases to the subjects and retort functions that earn them.
- Supports reviewed compound phrases `xxd Clap` and `xxd CrayonTime`; random concatenation is prohibited.
- Keeps the rolling emote target above 60% while compounds remain rare.

## Durable room-language routes

The build promotes reusable League/Twitch speech acts rather than preserving one morning's conversation:

- `good gold reset` → shutdown cope
- `[resource] diff` → mock diagnosis
- `NA wave clear` → mechanic-based jab
- `easy penta` → premature certainty
- `let him cook` / `send it` → reckless approval
- `viewer games` → recurring room-risk framing
- creator-collab money questions → sponsorship/payment retorts
- bot completion/version questions → build-meta retorts
- direct challenge to the Ball → rebuttal pool
- `mods ban` → mock sentencing
- affection questions → object-shaped affection/deflection
- bare laugh reactions such as `KEKW` → compact acknowledgement

Each family has a six-line authored pool except where lore permissions deliberately narrow it.

## Variety chain

The selector operates in this order:

1. hard eligibility and reference permission;
2. canonical route family;
3. hierarchical match tier;
4. relevance admission band;
5. persistent scheduled-chaos gate for eligible low-risk broad prompts only;
6. exact-answer route-cycle exclusion;
7. hard immediate family freshness with progressive relaxation only when needed;
8. humor-grammar freshness;
9. uniform seeded RNG;
10. integrated semantic emote routing.

Equivalent phrasings such as `will Mike win`, `will SRO win`, `is Mike going to win`, and `can Mike win this game` share one route history. Locks prevent concurrent requests from selecting the same unfinished-cycle answer.

## Full SRO 7TV set

Canonical set ID:

```text
01GBAYMGX0000B23ECE97RP321
```

Runtime endpoint:

```text
https://api.7tv.app/v3/emote-sets/01GBAYMGX0000B23ECE97RP321
```

The active set is the emote bank. Every set-local alias is preserved and classified by expression, discourse function, visual family, intensity, confidence, animation, and zero-width status. Manual SRO mappings are authoritative; heuristics cover remaining aliases. Unknown entries are restricted to controlled hidden-nonsense usage until reviewed.

The response is selected first. Its authored line policy and the recognized route context are then combined. A specific line can narrow a broad route expression—for example, a dry affection answer can prefer `smug` or `recognition` rather than any generic disbelief emote.

Emote target:

- minimum long-window share: **60%**;
- rolling window: **20 replies**;
- minimum full-window count: **12**;
- serious responses are quota-exempt;
- semantic fit, active availability, and zero-width safety always outrank the quota.

Pinned pairings such as `Motive remains unclear Susge` remain exact and cannot receive a second suffix.

## Verify

```bash
npm run check
```

Synchronize the live set in a networked environment:

```bash
npm run sync:emotes
```

This writes:

- `data/emotes/active-set-snapshot.json`
- `data/emotes/semantic-inventory.json`
- `reports/7tv-semantic-inventory.md`

## Local run

```bash
NODE_ENV=production \
SRO_8BALL_RESPONSE_FILE=./data/runtime/responses.json \
SRO_8BALL_MEMORY_FILE=/tmp/sro8ball-memory.json \
DISABLE_7TV_FETCH=1 \
npm start
```

Test:

```text
http://localhost:3000/8ball?q=will%20Mike%20win&user=tester
```

Nightbot command shape:

```text
$(urlfetch https://YOUR-VERCEL-DOMAIN/8ball?q=$(querystring)&user=$(user))
```

## Production requirements

Configure distributed history and locking for Vercel:

```text
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
```

If Upstash is temporarily unavailable, the command continues using warm process-local history and `/health` reports degraded persistence. Separate serverless instances cannot guarantee one shared response/emote cycle until Upstash recovers.

## Main reports

- `reports/INTEGRATION_PASS_V4_8.md`
- `reports/production-behavior-audit.md`
- `reports/HUMOR_GRAMMAR_AUDIT_V4_6.md`
- `reports/EMOTE_SYSTEM_AUDIT_V4_8.md`
- `reports/router-pilot-report.md`
- `reports/live-output-review.md`
- `reports/http-smoke-test-v4.8.txt`
- `reports/final-engineering-report.md`

No Git push or deployment is performed automatically.
