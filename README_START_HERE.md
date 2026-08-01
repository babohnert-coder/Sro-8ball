# Start Here — SRO 8 Ball V5.0.1

This is the launch-hardened deployment build for the SRO Twitch `!8ball`.

## Verify

```bash
npm run check
```

Expected results:

- 148 automated tests pass
- 60/60 golden routing fixtures pass
- 12/12 selector cases pass
- recognition metrics are 100% for intent, primary domain, entity precision, and concept F1
- 689 approved responses load
- the July 31 live transcript routes pass repeated-output compatibility tests
- all 59 tested non-help routes have at least four admitted answers
- controlled chaos occurs once every 10–15 eligible answers and never consecutively
- immediate semantic, opening, and humor-device families rotate when alternatives exist
- a temporary Upstash outage falls back to warm local history instead of taking the command offline
- rolling 7TV use remains at or above 60%
- reviewed compound phrases remain rare and context-gated
- no semantic emote mismatch is selected

## Active 7TV set

```text
01GBAYMGX0000B23ECE97RP321
```

Synchronize the actual live inventory in a networked environment:

```bash
npm run sync:emotes
```

## Local run

```bash
NODE_ENV=production \
SRO_8BALL_RESPONSE_FILE=./data/runtime/responses.json \
SRO_8BALL_MEMORY_FILE=/tmp/sro8ball-memory.json \
DISABLE_7TV_FETCH=1 \
npm start
```

The live bot remains unchanged until this package replaces the repository contents and is deployed.
