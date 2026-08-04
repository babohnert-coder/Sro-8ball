# SRO 8-Ball Vercel Fix

Vercel-compatible flat RNG build.

Endpoints:
- `/`
- `/8ball`
- `/api/8ball`
- `/health`

The response pool contains 183 responses and the warm serverless instance blocks the previous 100 response IDs.
