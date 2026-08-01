# Live V7 Routing Failures

## Failure 001 — entity lore overrode choice intent

**Input**

```text
!8ball john west or east
```

**Actual**

```text
John brought confidence. Equipment list ends there.
```

**Diagnosis**

The engine recognized `John` and selected a generic John-lore response. It failed to preserve the `A or B` choice contract.

**Required class-level correction**

Question form and answer shape must outrank entity lore. Extract alternatives (`west`, `east`), admit only choice-compatible responses, then apply John-specific flavor.
