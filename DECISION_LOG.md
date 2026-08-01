# Decision Log — V4.9

## Fixed decisions

1. Runtime output is finite and pre-authored.
2. Runtime LLM use and fragment assembly are prohibited.
3. Keywords identify the correct response pool; they do not dictate output wording.
4. Durable League/Twitch speech acts may become routes; temporary daily banter may not.
5. Canonical route families unify equivalent phrasings.
6. Specific concept/entity pools outrank broad domain and general pools.
7. Relevance controls admission only; RNG controls order inside the admitted cycle.
8. Every admitted answer appears once before exact repetition.
9. Humor grammar rotates retort logic, not merely sentence openings.
10. Controlled chaos is approximately 10% only for clearly understood, low-risk, broad prompts.
11. The entire active SRO 7TV set is inventory.
12. Emotes are selected by expression, discourse function, target affinity, and context after the response is chosen.
13. Authored line-level emote intent and route-level context must be combined.
14. Manual room-specific emote meanings override name heuristics.
15. At least 60% of eligible long-window replies carry an emote; semantic correctness outranks quota.
16. Compound emote phrases are reviewed semantic units; random concatenation is prohibited.
17. Serious replies are quota-exempt.
18. Chat observations teach expression grammar but do not automatically prove provider membership or permanent lore.
19. Distributed persistence is required for shared serverless cycles and locks.
20. Deployment and Git publication require an explicit user request.

## Deferred operational work

1. Synchronize and visually review the current live 7TV snapshot in a networked deployment environment.
2. Supply production Upstash credentials.
3. Supply the connected GitHub/Vercel deployment target.


## V5.1.0 brain stance pass

The selector now forms an internal stance before choosing wording. The stance is deterministic for seeded tests, rotates against recent stance history, and only narrows an already relevant authored pool. It never writes or mutates response text. Small pools relax rather than fail.
