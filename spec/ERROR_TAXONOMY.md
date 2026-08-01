# Recognition and Selection Error Taxonomy

Codex must label every failed golden fixture with exactly one primary error type and any secondary types.

- `intent_miss` - wrong question form.
- `domain_miss` - required domain absent or wrong primary domain.
- `entity_false_positive` - resolved an entity without enough evidence.
- `entity_false_negative` - missed an explicit entity.
- `reference_permission_error` - candidate or untriggered lore became eligible.
- `concept_false_positive` - inferred a concept not supported by the input.
- `concept_false_negative` - missed a required multiword concept.
- `state_invention` - inferred live state not present or allowed by a concept rule.
- `specificity_overreach` - selected or classified more specifically than the inquiry supports.
- `specificity_underreach` - ignored supported explicit context.
- `fallback_error` - used the wrong fallback level.
- `eligibility_error` - allowed a response that violates a hard rule.
- `relevance_floor_error` - selected a weak candidate because it was fresh.
- `variety_error` - repeated an avoidable answer/family/cadence.
- `editorial_identity_error` - output no longer reads as an 8 Ball.
- `unsupported_league_reference` - inserted a champion, mechanic, objective, or role not supported by the inquiry.
