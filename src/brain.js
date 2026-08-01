import { buildPerceptionBundle } from './perception/index.js';
import { formDecisionPlan } from './brain/decision-plan.js';
import { planCohort, scoreResponseForPlan } from './brain/scoring.js';
export { formDecisionPlan, buildPerceptionBundle, scoreResponseForPlan };

const LEGACY_PREFS = {
  dry_witness:{delivery:['dry','direct'],reply_move:['deadpan_diagnosis','straight_verdict','understatement'],twist_family:['none','premise_undercut'],payoff_family:['recognition','judgment','utility'],target_family:['game_state','subject','asker']},
  reluctant_approval:{delivery:['dry','contextual','direct'],reply_move:['confirm_then_undercut','conditional_verdict','straight_verdict'],twist_family:['premise_undercut','none'],payoff_family:['reversal','judgment','recognition'],target_family:['asker','subject','streamer']},
  clean_no:{delivery:['direct','dry','classic'],reply_move:['straight_verdict','deadpan_diagnosis'],twist_family:['none','premise_undercut'],payoff_family:['utility','judgment'],target_family:['decision','asker']},
  league_realist:{delivery:['contextual','dry','room_lore'],reply_move:['deadpan_diagnosis','blame_shift','confirm_then_undercut','straight_verdict'],twist_family:['social_frame_on_league','blame_transfer','none'],payoff_family:['recognition','judgment','reversal'],target_family:['game_state','team','enemy','streamer']},
  chat_regular:{delivery:['room_lore','dry','direct'],reply_move:['callback_substitution','deadpan_diagnosis','mock_sentence'],twist_family:['callback_jump','none','premise_undercut'],payoff_family:['recognition','judgment','reversal'],target_family:['chat','streamer','subject']},
  suspicious_reader:{delivery:['dry','direct'],reply_move:['deadpan_diagnosis','straight_verdict'],twist_family:['motive_gap','premise_undercut','none'],payoff_family:['recognition','judgment'],target_family:['asker','decision']},
  soft_roast:{delivery:['dry','contextual'],reply_move:['deadpan_diagnosis','mock_sentence'],twist_family:['premise_undercut','status_reversal'],payoff_family:['judgment','reversal'],target_family:['asker','streamer','team']},
  odd_sincerity:{delivery:['direct','classic'],reply_move:['straight_verdict','understatement'],twist_family:['none'],payoff_family:['utility','recognition'],target_family:['asker','subject']},
  omen:{delivery:['chaos','dry'],reply_move:['omen','absurd_declaration'],twist_family:['confident_nonsense','scale_shift'],payoff_family:['absurdity','escalation'],target_family:['fate','game_state']},
  controlled_chaos:{delivery:['chaos','dry'],reply_move:['absurd_declaration','false_choice','omen'],twist_family:['confident_nonsense','scale_shift','role_reversal'],payoff_family:['absurdity','escalation'],target_family:['subject','fate','game_state']},
  safe_redirect:{delivery:['direct','classic'],reply_move:['straight_verdict'],twist_family:['none'],payoff_family:['utility'],target_family:['asker']},
};

export function formStance({bundle,snapshot={},seed='',repeatedInquiry=false,userHash='anonymous',personalityVolume=6}) {
  const safeBundle={intent:bundle.intent??{label:'prediction',confidence:.5},domains:bundle.domains??[],entities:bundle.entities??[],states:bundle.states??[],evidence:bundle.evidence??[],confidence:bundle.confidence??.5,normalized:bundle.normalized??''};
  const perception=buildPerceptionBundle({bundle:safeBundle,repeatedInquiry,userHash});
  const plan=formDecisionPlan({perception,snapshot,seed,personalityVolume});
  const prefs=LEGACY_PREFS[plan.stance]??LEGACY_PREFS.dry_witness;
  return { id:plan.stance, ...plan, ...prefs, leagueNative:safeBundle.domains.some((d)=>['league_gameplay','current_game','champion_matchup','lane_wave_state','player_role_performance','objective_macro','fight_dive_trade_shutdown','builds_items_runes','ranked_climb'].includes(d.label)), perception };
}

export function scoreResponseForStance(response, stance) {
  if (stance.version==='6.0' || stance.version==='7.0') return scoreResponseForPlan(response, stance);
  let score=0;
  const pref=(field,value,first=4,other=2)=>{const list=stance[field]??[];const i=list.indexOf(value);return i<0?0:i===0?first:other;};
  score+=pref('delivery',response.delivery); score+=pref('reply_move',response.reply_move,5,3); score+=pref('twist_family',response.twist_family); score+=pref('payoff_family',response.payoff_family); score+=pref('target_family',response.target_family,3,1);
  if (stance.leagueNative && response.league_intensity>0) score+=2;
  return score;
}
export function stanceCohort(candidates, stance) {
  if (stance.version==='6.0' || stance.version==='7.0') return planCohort(candidates, stance);
  const scores=candidates.map(candidate=>({candidate,score:scoreResponseForStance(candidate.response,stance)}));
  const bestScore=Math.max(...scores.map(x=>x.score)); const cohort=scores.filter(x=>x.score>=bestScore-3).map(x=>x.candidate);
  return {candidates:cohort.length>=2?cohort:candidates,scores,bestScore,relaxed:cohort.length<2};
}
