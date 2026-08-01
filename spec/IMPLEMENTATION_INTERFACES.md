# Fixed Implementation Interfaces

Codex may choose filenames within the existing project structure, but these behavioral interfaces are authoritative.

```ts
export type RuntimeMode = "production" | "development" | "test";

export function normalizeInquiry(raw: string): {
  raw: string;
  normalized: string;
  tokens: string[];
  missingInquiry: boolean;
};

export function recognizeInquiry(raw: string): FeatureBundle;

export function getEligibleResponses(
  bundle: FeatureBundle,
  responses: AuthoredResponse[],
  mode: RuntimeMode,
  activeEmotes: Set<string>
): EligibilityResult[];

export function scoreEligibleResponse(
  bundle: FeatureBundle,
  response: AuthoredResponse,
  history: VarietySnapshot
): ScoreBreakdown;

export async function selectResponse(input: {
  bundle: FeatureBundle;
  responses: AuthoredResponse[];
  memory: MemoryStore;
  userId: string;
  seed?: string;
  mode: RuntimeMode;
}): Promise<SelectionResult>;
```

## Memory interface

```ts
export interface MemoryStore {
  getSnapshot(userHash: string): Promise<VarietySnapshot>;
  recordSelection(event: SelectionMemoryEvent): Promise<void>;
  getInquiryFingerprint(userHash: string, fingerprint: string): Promise<boolean>;
  recordInquiryFingerprint(userHash: string, fingerprint: string, ttlSeconds: number): Promise<void>;
  health(): Promise<{ ready: boolean; degraded: boolean; adapter: string }>;
}
```

## Required debug evidence

Every recognition and selection debug result must include:

- rules and phrases that fired
- competing intent/domain interpretations
- unresolved aliases
- hard eligibility rejection reasons
- relevance subtotal before variety penalties
- every variety penalty
- final candidate score
- fallback level used
- selected response ID

## No hidden heuristics

If a heuristic affects routing or selection, it must be represented in a data file or documented with a named rule and covered by a fixture. Codex must not add silent special cases.
