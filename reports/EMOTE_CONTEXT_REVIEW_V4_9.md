# SRO 8 Ball Emote Context Review — V4.9

## Purpose

V4.9 converts observed SRO chat emote usage into durable conversational semantics without preserving the temporary subject matter of a single stream. The bot learns how the room expresses agreement, disbelief, self-own, gamba hope, mock enforcement, visual pain, goofy irony, and mock applause. It does not retain the day's Mundo, Kindred, Wendy's, rank, prediction, or lobby details as permanent lore.

## Durable distinctions added

- `xxd`: goofy irony, knowingly unserious acknowledgment, and mock pride; not interchangeable with hard laughter.
- `KEKL` / `KEKW` / `LMAO`: progressively stronger laughter or ridicule.
- `LUL`: lighter amusement.
- `sadKEK`: rueful laughter at a self-inflicted loss.
- `Prayge`: active pleading or desperate hope.
- `gambabert`: gamba belief and doubling down; restricted to prediction, rank, and doubter/believer contexts.
- `NODDERS`: agreement or an ironic seal on an excessive judgment.
- `MYEYES`: painful witnessing of a visually or strategically offensive event.
- `BoyWhatTheHellBoy`: accusatory disbelief at an explanation or decision.
- `PepePolice`: mock enforcement; restricted to moderation or explicit sentencing language.
- `pepeLad`: mock formal authority or ceremonial correction.
- `Considering`: contemplation, not generic confusion.
- `BUSSIN`: enthusiastic approval with a food-flavored register; not generic positivity.

## Reviewed compound phrases

The runtime may emit these only when every component alias is active and the selected response has the matching discourse role:

- `xxd Clap` — mock applause or goofy congratulations.
- `xxd CrayonTime` — childish mockery of obviously bad reasoning.

Compounds are authored semantic units. The bot never concatenates random compatible emotes. The observed phrase `xxd FK it we ball` remains unapproved because its token boundaries and provider availability were not verified.

## Selection order

1. Select the complete authored response.
2. Merge the response's authored expression contract with the recognized route.
3. Apply target affinity and hard context blocks.
4. Intersect against the exact active SRO set.
5. Choose a fresh compatible single emote or reviewed compound.
6. Preserve the rolling 60% target without forcing a semantic mismatch.

## Provider boundary

Chat observation proves contextual usage but does not by itself prove that an alias belongs to 7TV rather than Twitch, BetterTTV, FrankerFaceZ, or plain text. Runtime set synchronization remains authoritative. The degraded fallback contains curated and currently observed channel aliases, but the exact set ID remains:

```text
01GBAYMGX0000B23ECE97RP321
```

## Verified local behavior

- Approved responses: **657**
- Automated tests: **137/137 passed**
- Fallback aliases classified: **59/59**
- Reviewed compounds available: **2**
- Mixed emote simulation: **165/240 (68.8%)**
- Compound replies: **4/240 (1.7%)**
- Unique selected emote outputs: **29**
- Every rolling 20 replies contained at least 12 emote-bearing replies: **yes**
- Semantic mismatches: **0**
- Out-of-set component selections: **0**
- Expanded visible review: **138/210 emote-bearing outputs**, **38 unique outputs**

## Deliberate non-lore

No permanent route or response pool was created for the specific Mundo game, Kindred behavior, Wendy's discussion, Emerald claim, prediction refund, or Nightbot advertisement. Those conversations were used only to infer durable expression grammar.
