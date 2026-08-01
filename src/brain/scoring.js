import { auditVoice } from '../renderer/voice.js';
import { enrichResponse } from './response-metadata.js';
export function scoreResponseForPlan(response, plan) {
  const r=enrichResponse(response); let score=0;
  if (r.verdicts.includes(plan.verdict)) score+=4;
  if (r.stances.includes(plan.stance)) score+=6;
  if (r.motives.includes(plan.motive)) score+=2;
  if (r.targets.includes(plan.target)) score+=2;
  if (plan.leagueSpecificity>0 && response.league_intensity>0) score+=3;
  if (plan.leagueSpecificity===0 && response.league_intensity===0) score+=2;
  if (response.reply_move===plan.responseMove) score+=4;
  if ((r.oracleModes??[]).includes(plan.oracleMode)) score+=5;
  if ((r.worldviewSupports??[]).includes(plan.valueAtStake)) score+=3;
  if (plan.diagnosis?.respectEarned && ['understatement','straight_verdict'].includes(response.reply_move)) score+=3;
  if (plan.relationshipStage==='distant_observer' && response.delivery==='room_lore') score-=2;
  if (plan.revealDepth>=3 && response.delivery==='room_lore') score+=2;
  if (plan.personalityCurve?.plainAnswerBias>=.3 && ['direct','classic'].includes(response.delivery)) score+=2;
  const aggression=r.aggression??{min:0,max:10};
  if (plan.aggression>=aggression.min && plan.aggression<=aggression.max) score+=1;
  if (plan.absurdity<3 && response.delivery==='chaos') score-=5;
  score-=auditVoice(response.text).penalty;
  return score;
}
export function planCohort(candidates, plan) {
  if (candidates.length<=1) return {candidates,scores:[],bestScore:0,relaxed:false};
  const scores=candidates.map(candidate=>({candidate,score:scoreResponseForPlan(candidate.response,plan)}));
  const bestScore=Math.max(...scores.map(x=>x.score));
  const cohort=scores.filter(x=>x.score>=bestScore-3).map(x=>x.candidate);
  return {candidates:cohort.length>=2?cohort:candidates,scores,bestScore,relaxed:cohort.length<2};
}
