const stanceMap={
  dry:['dry_witness','league_realist','suspicious_reader','soft_roast'], direct:['dry_witness','clean_no','odd_sincerity'],
  classic:['dry_witness','clean_no','odd_sincerity'], contextual:['league_realist','chat_regular','soft_roast'], room_lore:['chat_regular','league_realist'], chaos:['controlled_chaos','omen']
};
export function enrichResponse(response) {
  const verdicts=[response.verdict??'direct']; const stances=stanceMap[response.delivery]??['dry_witness'];
  const text=(response.text??'').toLowerCase();
  const values=[];
  if (/blame|fault|deserved|decision|chose|choice|review/.test(text)) values.push('accountability');
  if (/wait|eventually|patience|freeze|scale|later|not yet/.test(text)) values.push('patience');
  if (/confidence|certain|sure|free|easy|humble|ego/.test(text)) values.push('humility');
  if (/pattern|again|always|history|before|already/.test(text)) values.push('pattern_recognition');
  if (/adapt|change|plan|adjust/.test(text)) values.push('adaptability');
  if (/honest|truth|admit|my bad/.test(text)) values.push('honesty');
  if (!values.length) values.push('curiosity');
  const modes=[];
  if (response.delivery==='chaos') modes.push('controlled_omen');
  if (response.delivery==='room_lore'||response.delivery==='contextual') modes.push('league_witness');
  if (response.reply_move==='confirm_then_undercut') modes.push('reluctant_approval');
  if (response.reply_move==='deadpan_diagnosis') modes.push('dry_diagnosis');
  if (response.reply_move==='straight_verdict') modes.push('clean_verdict','restrained_correction','plain_truth');
  if (response.reply_move==='understatement') modes.push('quiet_respect','plain_truth');
  if (response.reply_move==='premise_check') modes.push('motive_exposure');
  return { ...response, verdicts, stances, motives:['curiosity','prediction_seek','permission_laundering','bait_or_tease','shared_reaction','reassurance_loop'],
    targets:[response.target_family??'decision','decision','game_state','chat','streamer','asker','team'], aggression:{min:0,max:response.chaos?8:6},
    sincerity:{min:0,max:10}, leagueSpecificity:{min:0,max:response.league_intensity*3+1}, loreIds:response.reference_ids??[],
    worldviewSupports:values, worldviewConflicts:[], oracleModes:modes, responseMove:response.reply_move, semanticFamily:response.semantic_family,
    syntaxSkeleton:response.syntax_family, aiFingerprintTags:[], safetyClass:response.seriousness>=2?'general_safe':'playful', maxPersonalityVolume:10 };
}
