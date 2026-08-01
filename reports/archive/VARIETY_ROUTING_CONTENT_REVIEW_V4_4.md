# SRO 8 Ball V4.4 — Variety, Routing, and Content Review

## Decision

The current build behaves as the intended finite authored 8 Ball:

1. The inquiry is normalized and classified into an exact route made from intent, primary domain, concepts, and verified named context.
2. Hard eligibility removes answers that do not belong under that route.
3. Relevance scoring decides which authored answers are strong enough to enter the qualified pool.
4. Relevance does **not** choose the final line.
5. The route-history cycle removes every answer already used during the current cycle.
6. Uniform RNG selects from the remaining qualified answers.
7. A new cycle begins only after the route has exhausted its admitted pool, and it avoids immediately repeating the line that ended the prior cycle.

This is the requested structure: **keywords and word patterns determine the correct answer pool; RNG controls selection inside it; the variety chain prevents the same route from returning the same line again until the pool has rotated.**

## Variety proof

- SRO-win route admitted pool tested through the HTTP endpoint: **12 answers**.
- First route cycle: **12/12 unique**.
- Thirteenth call began a new cycle and did not immediately repeat the twelfth.
- Equivalent phrasings—`will Mike win`, `will SRO win`, `is Mike going to win`, `can Mike win this game`, and `can SRO still win`—share one route history.
- Eight simultaneous game-outcome endpoint requests returned **8/8 unique** lines.
- A partially used Feedmax cycle survived a process restart and continued with an unused answer.
- Route history retains 64 selections for six hours; the largest currently admitted route contains 23 answers.

## Keyword and pattern review

League recognition is based on contextual phrase patterns rather than loose isolated keywords. Permanent adversarial tests now cover:

- `carry this game` versus `carry groceries`
- `Mike cooking` versus `cook dinner`
- `build troll` versus `build a house`
- `scale this item` versus `scale this recipe`
- `proxy the wave` versus `proxy this request`
- `free Baron`, `free top`, and ordinary availability
- `donate the shutdown` and `resetting his gold`
- `run it down`, `worth`, `flip Baron`, Smite, item spikes, wave loss, and lane-over phrasing
- `can Mike win` as a prediction rather than permission

All adversarial recognition and pool-coverage cases pass. Ordinary uses of ambiguous words no longer unlock League-specific output pools.

## Output-bank review

- Approved authored responses: **571**.
- Exact normalized duplicates: **0**.
- Near-duplicate semantic-family pairs at the audit threshold: **0**.
- AI/software-status voice flags: **0**.
- Maximum response length: **68 characters**.
- All 59 tested non-help routes admit at least four normal lines.

Raw bank delivery makeup:

- dry: 295
- contextual: 124
- direct: 93
- classic: 35
- chaos: 13
- room lore: 11

The bank intentionally leans dry because that is where the restrained villain energy lives, but direct and contextual answers remain available on every important route. Controlled chaos is selected as a separate eligible cohort rather than appended randomly; its measured selection rate is **10.8%** over 1,000 eligible seeded inquiries.

Representative outputs:

- `what is the outcome of this game` → **NO — the comeback needs enemy cooperation.**
- `will Mike win` → **OUTLOOK UNCLEAR — Mike has not finished making this harder.**
- `is he just resetting his gold` → **NOT YET — the shutdown only changed the math.**
- `was that worth` → **OUTLOOK UNCLEAR — the gold and dignity disagree.**
- `is this Feedmax` → **NO — the thumbnail is ahead of the build.**
- `should they flip Baron` → **VERY DOUBTFUL — Baron has become a casino.**
- `did he run it down` → **YES — that is inting with plausible deniability.**
- chaos → **NO — the moon has weakside coverage.**

The final manual pass also corrected two issues that automated routing alone would not catch:

- Misanthrope `where` answers are now location-shaped.
- Unverified MTF questions now answer like an oracle instead of sounding like a verification database.

## Real endpoint smoke results

Final production-mode endpoint health loaded **571 approved responses**. A twelve-call SRO-win cycle returned twelve unique lines. An eight-request concurrent game-outcome burst returned eight unique lines. The following ambiguous ordinary-language inputs stayed outside inappropriate League pools:

- `can Mike carry groceries` → **NO — make two trips; pride is not a handle.**
- `should Mike cook dinner` → **NO — hunger is currently drafting the idea.**
- `can I scale this recipe` → **NO — baking has already filed an objection.**

## Remaining deployment dependencies

- **Upstash Redis credentials:** required for the same no-repeat chain across separate Vercel instances. Local file persistence cannot coordinate multiple serverless instances.
- **Current 7TV active set:** adapter and fallback are complete, but the active channel inventory was not live-verified in this environment.

Neither dependency changes the authored bank or routing behavior. They affect production-wide shared history and live emote availability.
