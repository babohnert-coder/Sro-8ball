# SRO Magic 8-Ball RNG

A flat 180-response Magic 8-Ball for SRO's Twitch chat.

- Pure random selection
- No routing, keyword detection, question parsing, or runtime AI
- The last 25 response IDs are excluded from every draw
- Persistent global history survives Worker restarts
- Plain-text output works with Nightbot `urlfetch`

## Put it on GitHub

Upload this entire folder to the repository. If an existing Cloudflare Worker must keep its current URL, change `name` in `wrangler.jsonc` to that Worker's existing name before deploying.

## Deploy to Cloudflare

```bash
npm install
npx wrangler login
npm run deploy
```

The deployed Worker returns one response as plain text from any `GET` path. It ignores the question and all query parameters.

Use `/health` to verify the deployed build:

```json
{
  "ok": true,
  "responses": 180,
  "repeatWindow": 25,
  "routing": false
}
```

Nightbot can keep adding `8ballSRO @username:` around the returned text exactly as it does now.

## Test before deploying

```bash
npm install
npm run check
```

The test suite performs 20,000 deterministic draws and fails if any response repeats within the preceding 25 results. The dry run also validates the Worker bundle and Cloudflare configuration.

## Edit the response pool

Edit only `src/responses.js`. Keep every response unique. The non-repeat engine automatically works with the updated pool as long as it contains more than 25 responses.
