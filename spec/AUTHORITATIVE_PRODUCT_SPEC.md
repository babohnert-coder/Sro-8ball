# Authoritative Product Specification v4.0.0

## Role separation

This package contains the product reasoning. Codex is the execution layer.

Codex must implement the supplied schemas, ontology, scoring configuration, fixtures, and constraints. Codex must not redesign the product, choose a new architecture, broaden references, approve content, or invent missing rules.

When a contradiction or missing rule blocks implementation, Codex must record it in `reports/spec-blockers.md` and stop only the affected workstream. It must not guess.

## Runtime product

The runtime is a finite authored response selector. It reads the text after `!8ball`, recognizes the inquiry, filters a structured bank of complete authored responses, applies relevance and anti-repeat rules, and returns one response unchanged.

No runtime LLM. No sentence fragments. No dynamic joke writing. No streamer impersonation. No fake sentience.

## Required data authority

`data/reference/source-evidence.json` contains direct source excerpts used to verify room references. Association-level permissions in `references.json` control output eligibility. A verified entity does not make every candidate association verified.

## Recognition order

1. Normalize safely while preserving raw input, negation, names, and meaningful word order.
2. Classify intent using `data/ontology/intents.json` and its precedence rules.
3. Score domains using `data/ontology/domains.json`.
4. Extract entities using `data/ontology/entities.json`.
5. Extract multiword concepts using `data/ontology/concepts.json`, longest phrase first.
6. Add only the state implications listed in `data/ontology/states.json`.
7. Calculate specificity and confidence exactly as configured in `data/config/recognition.json`.
8. Return a feature bundle validated by `schemas/feature-bundle.schema.json`.

## Reference rule

Entity recognition, reference verification, and permission to use lore are separate decisions.

Only a `verified` reference with an allowed trigger may unlock a lore-dependent response. Candidate references may appear in debug evidence but cannot make a response eligible.

## Selection order

1. Validate response objects.
2. Apply hard eligibility in the order defined by `data/config/selection.json`.
3. Score relevance using the supplied weights.
4. Reject all candidates below the relevance floor.
5. Apply anti-repeat and distribution penalties.
6. Select among the strongest remaining candidates using a deterministic seed in tests and weighted randomness in runtime.
7. Use the fixed fallback chain. Chaos is never a recognition fallback.

## Editorial boundary

The first Codex run is engineering only. The test response pool is marked `test_only` and is not production content. Codex may build the editorial workbench, audit legacy lines, and export review files. It must not write or approve any new editorial or production responses in the first run. The supplied test-only pool is sufficient for engineering.

## Deployment boundary

Codex may prepare deployment configuration and tests. It must not deploy, change the live Nightbot command, create production secrets, or mark a release production-ready without an explicit later instruction.
