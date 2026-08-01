import { loadJson } from '../data.js';
import { stableHash } from '../text.js';
import { chooseOracleMode, diagnoseBehavior, oracleProfileDelta, personalityCurve } from './psychology.js';

function unit(seed) { return Number.parseInt(stableHash(seed), 16) / 0xffffffff; }
function pickWeighted(items, seed) {
  const total = items.reduce((s,x)=>s+x.weight,0); let cursor=unit(seed)*total;
  for (const item of items) { cursor -= item.weight; if (cursor <= 0) return item; }
  return items.at(-1);
}
const LEAGUE_DOMAINS=new Set(['league_gameplay','current_game','champion_matchup','lane_wave_state','player_role_performance','objective_macro','fight_dive_trade_shutdown','builds_items_runes','ranked_climb']);
function domainSet(perception) { return new Set(perception.domains.map((d)=>d.label)); }
function isLeague(perception) { return perception.domains.some((d)=>LEAGUE_DOMAINS.has(d.label)); }
function inferVerdict(perception, seed) {
  if (perception.safety.mode === 'safe_redirect') return 'refuse';
  const intent = perception.intent.label;
  if (!['prediction','permission','evaluation','comparison'].includes(intent)) return 'direct';
  const x = unit(`${seed}:verdict:${perception.normalized}`);
  if (x < .4) return 'yes'; if (x < .72) return 'no'; if (x < .9) return 'maybe'; return 'unclear';
}
function selectTarget(perception) {
  const safe = perception.targetCandidates.filter((x)=>x.safe).sort((a,b)=>b.confidence-a.confidence);
  return safe[0]?.target ?? 'decision';
}
function selectStance(perception, snapshot, seed, volume) {
  if (!perception.safety.humorAllowed) return perception.safety.mode === 'safe_redirect' ? 'safe_redirect' : 'odd_sincerity';
  const cfg=loadJson('data/config/brain-v6.json'); const domains=domainSet(perception); const league=isLeague(perception);
  let candidates=Object.entries(cfg.stances).map(([id,v])=>({id,...v})).filter(x=>!x.requiresDomain||domains.has(x.requiresDomain)||(x.requiresDomain==='league_gameplay'&&league));
  if (perception.repetition.repeated) candidates = candidates.map(x=>({...x,weight:x.id==='suspicious_reader'?x.weight*3:x.weight}));
  if (volume <= 3) candidates = candidates.filter(x=>!['controlled_chaos','soft_roast','omen'].includes(x.id));
  if (volume >= 8) candidates = candidates.map(x=>({...x,weight:['soft_roast','controlled_chaos','league_realist'].includes(x.id)?x.weight*1.6:x.weight}));
  const recent=(snapshot.stances??[]).slice(-cfg.stanceWindow);
  candidates=candidates.map(x=>({...x,weight:Math.max(1,x.weight-(recent.filter(s=>s===x.id).length>=cfg.maxSameStanceInWindow?x.weight*.8:0))}));
  return pickWeighted(candidates,`${seed}:stance:${perception.normalized}`).id;
}
function mapMove(stance, verdict, motive) {
  if (stance==='safe_redirect') return 'safe_redirect';
  if (motive==='permission_laundering') return 'call_out_predecided';
  if (stance==='reluctant_approval') return 'confirm_then_undercut';
  if (stance==='clean_no') return 'straight_verdict';
  if (stance==='suspicious_reader') return 'premise_check';
  if (stance==='soft_roast') return 'deadpan_diagnosis';
  if (stance==='omen') return 'omen';
  if (stance==='controlled_chaos') return 'absurd_declaration';
  return verdict==='direct'?'deadpan_diagnosis':'straight_verdict';
}

function stanceForMode(mode, fallback) {
  const map = {
    safe_redirect:'safe_redirect', plain_truth:'odd_sincerity', quiet_respect:'odd_sincerity',
    motive_exposure:'suspicious_reader', dry_diagnosis:'soft_roast', restrained_correction:'dry_witness',
    reluctant_approval:'reluctant_approval', controlled_omen:'omen',
  };
  return map[mode] ?? fallback;
}

function moveForMode(mode, fallback) {
  const map = {
    safe_redirect:'safe_redirect', plain_truth:'straight_verdict', quiet_respect:'understatement',
    motive_exposure:'premise_check', dry_diagnosis:'deadpan_diagnosis', restrained_correction:'straight_verdict',
    reluctant_approval:'confirm_then_undercut', clean_verdict:'straight_verdict', controlled_omen:'omen',
    league_witness:'deadpan_diagnosis',
  };
  return map[mode] ?? fallback;
}
export function formDecisionPlan({ perception, snapshot={}, seed='', personalityVolume=6 }) {
  const volume=Math.max(1,Math.min(10,Number(personalityVolume)||6));
  const verdict=inferVerdict(perception,seed);
  const diagnosis=diagnoseBehavior(perception,snapshot,seed);
  const curve=personalityCurve({perception,diagnosis,snapshot,volume});
  const oracleMode=chooseOracleMode({perception,diagnosis,curve,verdict,seed});
  const selectedStance=selectStance(perception,snapshot,seed,volume);
  const stance=stanceForMode(oracleMode,selectedStance);
  const league=isLeague(perception);
  const aggression=Math.max(0,Math.min(10,Math.round(curve.sharpness*.7+(stance==='soft_roast'?1:0))));
  const sincerity=Math.max(0,Math.min(10, diagnosis.respectEarned?9:stance==='odd_sincerity'?8:Math.round(7-curve.sharpness*.3)));
  const absurdity=Math.max(0,Math.min(10, oracleMode==='controlled_omen'?Math.max(5,curve.sharpness):Math.floor(curve.sharpness*.18)));
  const responseMove=moveForMode(oracleMode,mapMove(stance,verdict,perception.motive.label));
  const plan={ version:'7.0', verdict, stance, oracleMode, motive:perception.motive.label, target:selectTarget(perception), aggression, sincerity,
    leagueSpecificity:league?Math.min(10,4+Math.floor(volume/2)):0, loreDensity:league?Math.floor(volume/3):0, absurdity,
    responseMove, safetyMode:perception.safety.mode, diagnosis, personalityCurve:curve,
    valueAtStake:diagnosis.valueAtStake, valueAlignment:diagnosis.valueAlignment, relationshipStage:curve.stage,
    revealDepth:curve.revealDepth, contextConfidence:perception.contextConfidence,
    reasons:[`intent:${perception.intent.label}`,`motive:${perception.motive.label}`,`diagnosis:${diagnosis.id}`,`value:${diagnosis.valueAtStake}`,`mode:${oracleMode}`,`stage:${curve.stage}`,`volume:${volume}`] };
  plan.profileDelta=oracleProfileDelta({perception,diagnosis,plan});
  return plan;
}
