import { loadJson } from '../data.js';

export function assessSafety(bundle) {
  const cfg = loadJson('data/config/safety.json');
  const text = bundle.normalized ?? '';
  const matched = cfg.bypassHumorPatterns.filter((pattern) => text.includes(pattern));
  const protectedMatches = cfg.protectedTargetPatterns.filter((pattern) => text.includes(pattern));
  const serious = (bundle.states ?? []).some((item) => item.label === 'serious');
  const mode = matched.length ? 'safe_redirect' : serious || protectedMatches.length ? 'plain_safe' : 'normal';
  return { mode, matched, protectedMatches, humorAllowed: mode === 'normal' };
}
