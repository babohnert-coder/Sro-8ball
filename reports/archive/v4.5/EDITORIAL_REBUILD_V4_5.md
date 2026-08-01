# SRO 8 Ball V4.5 — Deliberate Editorial Rebuild

## Why this rebuild happened

V4.4 proved the recognition, route-cycle variety, persistence, and concurrency model, but its response bank still overrepresented the visible structure `VERDICT — polished observation`. The live Git bot demonstrated a better surface identity: the `!8ball` command already establishes the object, so the answer can simply be the correct finished joke, callback, omen, or judgment.

V4.5 keeps the proven engine and deliberately rebuilds the content layer around this rule:

> **The keywords are routing evidence. The output is a finished room-native response.**

The response may relate to the viewer, SRO lore, League, top lane, the named subject, or a general oracle idea. It does not need to repeat the matched keyword or force a verdict prefix when a cleaner joke lands better.

## What changed

- Rewrote **397** legacy responses rather than applying a surface punctuation pass.
- Added **14** responses for exact live-room routes.
- Retained **188** reviewed lines that already fit the intended product.
- Final bank: **585 approved responses**.
- Shifted the visible bank to **415 plain finished responses (70.9%)** and **170 explicit verdict responses (29.1%)**.
- Preserved direct, serious, classic-oracle answers so the bot does not become a nonstop joke machine.
- Preserved approximately ten-percent controlled chaos only where the inquiry is eligible.
- Removed software-status, deployment, data-analysis, and fake-sentience voice from production content.

## Live-room regression routes

### Bones + food accusation

Input family:

```text
!8ball does bonesex put pineapples on pizza?
```

This now resolves `bonesex` to Bones, recognizes pizza/food accusation context, and opens a dedicated Bones-food pool. The proven line is preserved:

```text
Yes, Bones did it. Motive remains unclear Susge
```

Other fitting lines include:

```text
The pizza court has entered a guilty verdict.
The allegations have sauce on them.
Bones did not deny it quickly enough.
Pineapple was present. Bones requested counsel.
```

### MTF identity and hater behavior

Broad identity:

```text
!8ball mtf?
```

may return:

```text
Michael typed. Mike felt a champion suggestion approaching.
```

The narrower question:

```text
!8ball why is @michaelthefan such a hater
```

opens a dedicated MTF-hater pool, including:

```text
MTF opened chat. Somewhere, Nidalee dodged.
MTF found the opinion first and the evidence second.
He is not hating. He is pre-denying the outcome.
```

The narrow route prevents unrelated British or generic identity material from leaking into the joke.

### Doubt or believe

```text
!8ball doubt or believe?
```

now opens the doubter/believer comparison pool, including:

```text
Choose the funnier mistake.
Believe for now. That is the funnier mistake.
Someone will delete the prediction history.
```

### SRO + Nidalee

Questions about Mike/SRO playing Nidalee require both resolved SRO and Nidalee context. Generic champion questions cannot borrow this lore pool.

## Routing and output contract

The hierarchy is:

1. exact named-room callback,
2. exact room-lore concept,
3. exact League event or mechanic,
4. specific League subject,
5. broad League/top-lane culture,
6. ordinary food/social/life subject,
7. general oracle fallback.

A narrow match can admit broader responses only when they remain genuinely correct. A response never becomes eligible merely because it contains a League noun.

## Variety contract

- Scores determine admission to a qualified pool.
- Scores do not crown one permanent winning line inside that pool.
- Used response IDs are excluded from the current exact-route cycle.
- Uniform RNG chooses among the remaining eligible lines.
- The cycle resets only after pool exhaustion.
- Equivalent wording that resolves to the same intent/domain/concept/entity route shares the same history.
- Per-route locking protects the chain during simultaneous Twitch requests.

## Verification

- Automated tests: **110/110 passed**.
- Golden recognition fixtures: **60/60 passed**.
- Golden selector cases: **12/12 passed**.
- Every tested non-help golden route admits at least four normal responses: **59/59**.
- Exact normalized duplicates: **0**.
- Near-duplicates at the audit threshold: **0**.
- AI/software-voice flags: **0**.
- Maximum response length: **61 characters**.
- Deterministic controlled-chaos rate: **10.8%**.

## Deployment boundary

The project is rebuilt and locally verified. It was not pushed to GitHub or deployed to Vercel in this release package. Distributed Vercel variety requires Upstash Redis credentials. Current 7TV active-set accuracy must be confirmed during deployment; the command remains functional if 7TV is unavailable.
