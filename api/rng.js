export const RECENT_LIMIT = 100;

export function chooseResponseIndex(responseCount, recent, random = Math.random) {
  const clean = Array.isArray(recent)
    ? recent.filter((value, index, list) =>
        Number.isInteger(value) &&
        value >= 0 &&
        value < responseCount &&
        list.indexOf(value) === index
      ).slice(-Math.min(RECENT_LIMIT, responseCount - 1))
    : [];

  const blocked = new Set(clean);
  const available = [];

  for (let index = 0; index < responseCount; index += 1) {
    if (!blocked.has(index)) available.push(index);
  }

  const selected = available[Math.floor(random() * available.length)];

  return {
    index: selected,
    recent: [...clean, selected].slice(-Math.min(RECENT_LIMIT, responseCount - 1)),
  };
}
