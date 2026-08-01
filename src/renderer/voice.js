import { loadJson } from '../data.js';
export function auditVoice(text='') {
  const cfg=loadJson('data/config/voice-contract.json'); const lower=String(text).toLowerCase();
  const flags=[]; for (const p of cfg.forbiddenPatterns) if (lower.includes(p)) flags.push(`forbidden:${p}`);
  for (const p of cfg.explanationPatterns) if (lower.includes(p)) flags.push(`explains:${p}`);
  if ((text.match(/[.!?]/g)||[]).length>cfg.maxSentences) flags.push('too_many_sentences');
  if (text.length>cfg.preferredMaxChars) flags.push('too_long');
  return { valid:flags.length===0, flags, penalty:flags.length*4 };
}
