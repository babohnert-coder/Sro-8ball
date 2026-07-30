# SRO 8 Ball Hosted Oracle

A hosted Twitch/League oracle designed to replace the large Nightbot `$(eval ...)` loop. Nightbot sends the question to one stable endpoint; the endpoint handles typo normalization, hierarchical intent scoring, social questions, League shorthand, mystical fallbacks, anti-repetition, and contextual 7TV emotes.

## What this fixes

- No giant JSON download and regex loop inside Nightbot, reducing script timeouts.
- Multiple matching routes are scored instead of stopping at the first keyword.
- Direct questions to the bot beat generic `why` and fallback routes.
- Social intent beats generic username lore: `do we like MTF`, `should X date Y`, `will X find love`.
- League shorthand is understood: `winnable`, `how we doing`, `we are fucked`, `back in it`, `blue trinket`, and build trolling.
- Unknown questions receive ambiguous League-oracle answers instead of unrelated jokes.
- Emotes are selected by meaning and used sparingly.

## Deploy on Vercel

1. Create a new GitHub repository or add these files to the existing `Sro-8ball` repository.
2. In Vercel, choose **Add New Project**, import the repository, and deploy with the defaults.
3. Test the resulting URL:

```text
https://YOUR-PROJECT.vercel.app/8ball?q=is%20this%20winnable&user=b0n3sxx
```

The health endpoint is:

```text
https://YOUR-PROJECT.vercel.app/health
```

## Nightbot command after deployment

Replace `YOUR-PROJECT.vercel.app` once the deployment URL is known:

```text
!commands edit !8ball -cd=12 8ballSRO @$(user): $(urlfetch https://YOUR-PROJECT.vercel.app/8ball?q=$(querystring)&user=$(user))
```

That is the only Nightbot change required. Future code and response updates happen behind the same endpoint.

## Run locally

```bash
npm test
npm start
```

Then open:

```text
http://localhost:3000/8ball?q=do%20we%20win%20these&user=tester
```

Add `&debug=1` to see the selected route and normalized question.

## Updating the personality

- `data/high-priority-routes.json`: strongest direct, social, League, and bot-character routes.
- `data/smart-responses.json`: broader legacy Twitch/League routes.
- `data/emotes.json`: semantic emote categories and frequency.

The endpoint route and URL do not need to change when these files are updated.

## Viewer context

The Nightbot command already sends `user=$(user)`. Version 1.1 stores a small profile for each viewer containing the last 12 oracle interactions, route counts, and repeat-question history. This enables callbacks such as recognizing a repeated question or a viewer returning to the same kind of omen.

For durable context on Vercel, create an Upstash Redis database and add these environment variables in the Vercel project:

```text
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

Without those variables, the oracle uses an in-memory fallback. That works locally and may work temporarily in a warm server instance, but it is not reliable across Vercel restarts or multiple instances.

Viewer context is deliberately small and expires after 30 days. It remembers only oracle interactions sent through `!8ball`; it cannot see unrelated Twitch chat messages unless a separate Twitch bot integration sends them to the endpoint.

## 7TV room emotes and SRO humor

This build ships with a curated SRO-room emote vocabulary and uses emotes by semantic category rather than attaching them randomly. It also suppresses recently used emotes.

For live 7TV filtering, set either:

- `SEVENTV_EMOTE_SET_ID` to the channel's 7TV emote-set ID. The oracle refreshes that set every 10 minutes.
- `SEVENTV_EMOTES` to a comma-separated list of currently enabled room emote names.

If neither variable is set, the bundled SRO room list is used. The oracle continues working if 7TV is temporarily unavailable.

Room humor guidance is stored in `data/room-humor.json`. Keep recurring lore there and avoid turning temporary jokes into permanent personality.
