export const RECENT_LIMIT = 25;

function normalizeRecent(recent, responseCount, limit) {
  if (!Array.isArray(recent)) return [];

  const newestFirst = [];
  const seen = new Set();

  for (let position = recent.length - 1; position >= 0; position -= 1) {
    const index = recent[position];
    if (!Number.isInteger(index) || index < 0 || index >= responseCount || seen.has(index)) {
      continue;
    }

    seen.add(index);
    newestFirst.push(index);
    if (newestFirst.length === limit) break;
  }

  return newestFirst.reverse();
}

export function chooseResponseIndex(
  responseCount,
  recent,
  random = Math.random,
  limit = RECENT_LIMIT,
) {
  if (!Number.isInteger(responseCount) || responseCount < 1) {
    throw new RangeError("responseCount must be a positive integer");
  }

  const effectiveLimit = Math.min(Math.max(0, limit), responseCount - 1);
  const cleanRecent = normalizeRecent(recent, responseCount, effectiveLimit);
  const blocked = new Set(cleanRecent);
  const availableCount = responseCount - blocked.size;
  const randomValue = Math.min(Math.max(Number(random()), 0), 1 - Number.EPSILON);
  let target = Math.floor(randomValue * availableCount);
  let selectedIndex = 0;

  for (let index = 0; index < responseCount; index += 1) {
    if (blocked.has(index)) continue;
    if (target === 0) {
      selectedIndex = index;
      break;
    }
    target -= 1;
  }

  return {
    index: selectedIndex,
    recent: [...cleanRecent, selectedIndex].slice(-effectiveLimit),
  };
}
