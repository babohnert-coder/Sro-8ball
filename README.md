# SRO Magic 8-Ball RNG

Flat RNG response machine for SRO Twitch chat.

- 183 authored responses
- No routing, keyword detection, question parsing, or runtime AI
- The previous 100 response IDs are excluded from every draw
- Persistent global history through the existing Durable Object
- Plain-text output remains compatible with the existing Nightbot `urlfetch` command

## Deploy

```bash
npm install
npm test
npm run deploy
```

The existing public Worker URL and Nightbot command do not need to change.

Use `/health` to verify the deployed build. It should report:

```json
{
  "ok": true,
  "responses": 183,
  "repeatWindow": 100,
  "routing": false
}
```
