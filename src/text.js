const COMMAND_RE = /^\s*!?8ball\b[\s,:-]*/i;

export function normalizeInquiry(raw = '') {
  const original = String(raw ?? '');
  const withoutCommand = original.replace(COMMAND_RE, '');
  const normalized = withoutCommand
    .normalize('NFKC')
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[_]+/g, ' ')
    .replace(/[^\p{L}\p{N}'!?.,:+\-\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  const tokens = normalized.match(/[a-z0-9]+(?:'[a-z0-9]+)?/g) ?? [];
  return {
    raw: original,
    normalized,
    tokens,
    missingInquiry: normalized.length === 0,
  };
}

export function containsPhrase(text, phrase) {
  const escaped = phrase
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('\\s+');
  return new RegExp(`(?:^|\\b)${escaped}(?:\\b|$)`, 'i').test(text);
}

export function stableHash(input) {
  let hash = 2166136261;
  const value = String(input);
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
