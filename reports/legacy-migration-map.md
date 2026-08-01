# Legacy Migration Map

- Legacy regex routes are preserved under `source/legacy-build/` for audit only.
- Runtime recognition now uses the V4 ontology, named rules, and feature bundles.
- Legacy response strings were not automatically imported or approved; the production bank was rebuilt as structured authored responses.
- Legacy in-memory anti-repeat logic is replaced by a MemoryStore interface with in-memory, file-persistent, and Upstash REST adapters.
- Relevance now admits a route pool; it does not decide the final line inside that pool.
- Exact route cycles exhaust all admitted answers before repeating.
- Existing public paths `/8ball`, `/api/8ball`, `/health`, and `/api/health` are preserved.
- 7TV failure is isolated from core response selection.
