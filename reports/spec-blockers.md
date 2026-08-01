# Specification Blockers and Deferred Decisions

No blocker prevents local production-bank testing.

## Deferred before public deployment

1. **Distributed persistence credentials** — Upstash-compatible locking and history are implemented, but live credentials are not present in this workspace. File persistence is suitable for local testing, not multi-instance Vercel guarantees.
2. **Live deployment target** — no connected GitHub repository, Vercel project ID, or current production domain was supplied.
3. **Current 7TV inventory** — runtime active-set fetching is implemented, but no frozen active-set export was supplied for offline approval.

## Resolved

- Approved authored bank: 689 production responses.
- Route coverage: 59/59.
- Controlled chaos observed: run npm run audit:production.
- Production behavior audit failures: 0.
- Runtime generation: disabled; all output is finite and authored.
