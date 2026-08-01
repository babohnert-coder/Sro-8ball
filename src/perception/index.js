import { stableHash } from '../text.js';
import { assessSafety } from '../safety/index.js';

function scored(label, confidence) { return { label, confidence }; }
function domains(bundle) { return bundle.domains ?? []; }
function inferQuestionShape(bundle) {
  const intent = bundle.intent?.label ?? 'nonsense';
  if (['prediction','permission','evaluation'].includes(intent)) return scored('binary_oracle', .92);
  if (intent === 'comparison') return scored('choice', .9);
  if (intent === 'reaction') return scored('reaction', .8);
  return scored('open', .65);
}
function inferMotive(bundle, repeated) {
  const text = bundle.normalized ?? '';
  if (repeated) return scored('reassurance_loop', .9);
  if (bundle.intent?.label === 'permission') return scored('permission_laundering', .86);
  if (/washed|problem|bad|int|feed|throw|fault/.test(text)) return scored('bait_or_tease', .78);
  if (/will|win|carry|climb|challenger/.test(text)) return scored('prediction_seek', .82);
  if (bundle.intent?.label === 'reaction') return scored('shared_reaction', .72);
  return scored('curiosity', .62);
}
function inferSeriousness(bundle) {
  const serious = (bundle.states ?? []).some((item) => item.label === 'serious');
  return scored(serious ? 'serious' : 'playful', serious ? .95 : .8);
}
const LEAGUE_DOMAINS=new Set(['league_gameplay','current_game','champion_matchup','lane_wave_state','player_role_performance','objective_macro','fight_dive_trade_shutdown','builds_items_runes','ranked_climb']);
function targetCandidates(bundle) {
  const text = bundle.normalized ?? '';
  const out = [];
  if ((bundle.domains ?? []).some((d) => LEAGUE_DOMAINS.has(d.label))) out.push({ target:'game_state', confidence:.9, safe:true });
  if (/chat/.test(text)) out.push({ target:'chat', confidence:.9, safe:true });
  if (/sro|mike|solo renekton/.test(text)) out.push({ target:'streamer', confidence:.9, safe:true });
  if (/jungl|bot lane|team/.test(text)) out.push({ target:'team', confidence:.8, safe:true });
  out.push({ target:'decision', confidence:.72, safe:true });
  out.push({ target:'asker', confidence:.55, safe:true });
  return out;
}
export function buildPerceptionBundle({ bundle, repeatedInquiry = false, userHash = 'anonymous' }) {
  const motive = inferMotive(bundle, repeatedInquiry);
  const safety = assessSafety(bundle);
  const candidates = targetCandidates(bundle);
  return {
    version:'6.0', normalized:bundle.normalized, inquiryFingerprint:stableHash(bundle.normalized),
    intent:bundle.intent, questionShape:inferQuestionShape(bundle), domains:domains(bundle), entities:bundle.entities ?? [],
    asker:{ id:userHash, kind:'viewer', public:true }, subject:null, targetCandidates:candidates,
    motive, seriousness:inferSeriousness(bundle), safety,
    repetition:{ repeated:repeatedInquiry, ordinal:repeatedInquiry ? 2 : 1, semantic:true },
    contextConfidence:bundle.confidence ?? .5, evidence:bundle.evidence ?? [], sourceBundle:bundle,
  };
}
