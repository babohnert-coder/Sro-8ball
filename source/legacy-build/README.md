# SRO 8 Ball v3.0 — Routed Oracle Build

This is a finite, authored Twitch 8 Ball for SoloRenektonOnly. It is intentionally **not** an LLM and not a sentence generator. The intelligence is in routing, variety control, anti-repeat memory, and using finished joke lines unchanged.

## Product lane

The bot should feel like a smart text toy: a Magic 8 Ball that understands the room enough to hit the correct joke lane, but still behaves like an oracle instead of a chatbot. It should not overexplain, argue, or become an echo chamber. The fun comes from short verdicts, SRO-specific lore, top-lane context, channel personalities, 7TV language, and occasional controlled chaos.

## What is built

- `api/8ball.js` supports `/api/8ball?q=...&user=...`.
- `vercel.json` rewrites `/8ball` to `/api/8ball`, so the Nightbot command URL can stay clean.
- `src/router.js` maps questions to authored response lanes.
- `src/oracle.js` selects answers, forces variety, avoids repeats, and injects a 10% chaos reroute only when it is safe.
- `src/seventv.js` checks SoloRenektonOnly's active 7TV emote set, with a local fallback and `SEVENTV_EMOTES` override.
- `data/responses.json` contains the compiled authored response bank.
- `data/routes.json` contains route rules.
- `test/oracle.test.js` validates routing, repeat protection, variety, and Nightbot-safe answer length.

## Current inventory

- 72 routed lanes
- 368 finished authored responses
- 184 plain responses
- 184 authored 7TV responses

## Nightbot command

Use the existing URL if the Vercel project keeps the same domain and branch. The command pattern should be:

```text
$(urlfetch https://YOUR-VERCEL-DOMAIN/8ball?q=$(querystring)&user=$(user))
```

Nightbot requires the endpoint to return plain text and stay under the response-length limit, so this build returns plain text by default.

## Local validation

```bash
npm test
npm start
```

Try:

```text
http://localhost:3000/8ball?q=will%20SRO%20win%20this%20game&user=tester
http://localhost:3000/8ball?q=is%20this%20build%20cooked&user=tester&debug=1
http://localhost:3000/health
```

## Optional environment variables

```text
SEVENTV_EMOTES=NODDERS,KEKL,Aware,HUH,CAUGHT,COPIUM,HOPIUM
SRO_TWITCH_ID=30227322
DISABLE_7TV_FETCH=1
NIGHTBOT_MAX_CHARS=390
```

## Why this architecture

A Twitch command needs speed, predictability, and editability. A full LLM is unnecessary for v3 because the desired product is a comedic oracle, not a conversational agent. The stronger version is a routed, finite response engine: it can recognize question lanes, rotate answer pools, preserve authored jokes, avoid recent repeats, and maintain Magic 8 Ball uncertainty.

## Deployment

1. Copy this folder into the existing GitHub repository connected to Vercel.
2. Commit and push.
3. Vercel redeploys.
4. Keep the Nightbot URL the same if the domain/path is unchanged.
5. Test `/health`, then test `/8ball?q=will%20sro%20win&user=tester`.
