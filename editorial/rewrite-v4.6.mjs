import fs from 'node:fs';

const responsePath = 'data/runtime/responses.json';
const payload = JSON.parse(fs.readFileSync(responsePath, 'utf8'));
const responses = payload.responses;

const verdictRe = /^(YES|NO|MAYBE|NOT YET|OUTLOOK GOOD|OUTLOOK UNCLEAR|VERY DOUBTFUL|LIKELY|UNLIKELY|ASK AGAIN LATER|THE SIGNS SAY YES|THE SIGNS SAY NO|UNCLEAR)\b/i;
const legalRe = /\b(case|charge|charged|guilty|sentence|sentencing|appeal|hearing|court|custody|police|illegal|ruled|ruling|evidence|witness|alibi|accomplice|conviction|jurisdiction|parole|prison|jail|arrest|report|ban|mods?|moderators?)\b/i;
const roomEntityRe = /\b(Mike|SRO|MTF|Michael|Nidalee|Bones|Misanthrope|John(?: West| East)?|Teamplay|Jokic)\b/i;
const leagueRe = /\b(lane|wave|Baron|Dragon|Smite|LP|MMR|Masters|Challenger|rank|build|item|rune|matchup|counterpick|jungle|jungler|top|mid|ADC|support|shutdown|bounty|gold|fight|teamfight|queue|lobby|draft|champ|champion|Renekton|Jax|Nidalee|proxy|scaling|spike|cannon|tower|nexus|macro|hands|mechanics|feed|max|inting|int)\b/i;
const lifeDomainSet = new Set(['ordinary_life','relationships_social','work_money','food_health_outside']);
const leagueDomainSet = new Set(['current_game','rank_climb','builds_items_runes','champion_matchup','lane_wave_state','player_role_performance','objective_macro','fight_dive_trade_shutdown','sro']);

const manualText = new Map([
  ['game_outcome_01', 'Still winnable. Do not tell confidence.'],
  ['game_outcome_02', 'One fight decides whether this was macro or content.'],
  ['game_outcome_04', 'The map picked a side. The players may appeal.'],
  ['build_eval_01', 'The build has a defense. It should not testify.'],
  ['build_eval_04', 'The pieces agree. That is not the same as innocence.'],
  ['build_eval_12', 'Playable. Unfortunately, that is enough.'],
  ['matchup_01', 'Playable. Enjoyable was never promised.'],
  ['matchup_04', 'The champion has tools. The pilot has history.'],
  ['rank_climb_01', 'The climb is alive. Keep chat away from it.'],
  ['rank_climb_11', 'One clean block turns doubt into paperwork.'],
  ['comeback_01', 'One clean fight. Nobody improvise.'],
  ['comeback_08', 'Hope is carrying the only useful item.'],
  ['throw_risk_02', 'Bad. Not yet legally a throw.'],
  ['wave_state_03', 'One crash repairs it. Naturally, this requires cooperation.'],
  ['sro_skill_eval_06', 'The replay has objected. Mike may continue.'],
  ['worth_cope_01', 'The cope arrived before the gold did.'],
  ['objective_call_05', 'Free objectives do not require this many witnesses.']
]);

for (const response of responses) {
  if (manualText.has(response.id)) {
    response.text = manualText.get(response.id);
    response.editorial_notes = 'Deliberately rewritten for V4.6 humor grammar.';
  }
}

function allDomains(response) {
  return new Set([...(response.domains_any ?? []), ...(response.domains_all ?? [])]);
}

function isLeagueResponse(response) {
  const domains = allDomains(response);
  return response.league_intensity > 0 || [...domains].some((d) => leagueDomainSet.has(d));
}

function isLifeResponse(response) {
  const domains = allDomains(response);
  return [...domains].some((d) => lifeDomainSet.has(d));
}

function replyMove(response) {
  const t = response.text;
  if (response.opening_family === 'direct_location') return 'location_answer';
  if (response.opening_family === 'direct_identity') return 'identity_answer';
  if (response.delivery === 'chaos') return 'absurd_declaration';
  if (/^(NEITHER|BOTH|CHOOSE)|funnier mistake|refuses? to choose/i.test(t)) return 'false_choice';
  if (/^(FIRST|SECOND|JAX|RENEKTON)\b/i.test(t)) return 'comparison_pick';
  if (/^(Choose|Pick|Play|Build|Queue|Stop|Keep|Ask|Report|Ban|Take|Let|Protect|Catch|Make|Check|Call|Behave|Believe|Doubt|Run|Go|Wait)\b/i.test(t)) return 'instruction';
  if (/\b(refuses?|declines?|denied|will not|won't|cannot become an accomplice)\b/i.test(t)) return 'refusal';
  if (legalRe.test(t)) return /\b(guilty|did it|charge|crime|culprit|suspect|allegation)\b/i.test(t) ? 'mock_accusation' : 'mock_sentence';
  if (verdictRe.test(t)) {
    const afterVerdict = t.replace(verdictRe, '').replace(/^\s*[—:;,.\-]+\s*/, '');
    if (/^(eat|cook|choose|leave|secure|do not|stop|keep|ask|play|build|queue|wait|protect|check|call)\b/i.test(afterVerdict)) return 'instruction';
    if (/\b(if|unless|only if|but|assuming|provided|until|when)\b/i.test(afterVerdict)) return 'conditional_verdict';
    if (/\b(is not|was not|isn't|wasn't|not a|not the same|does not)\b/i.test(afterVerdict)) return 'deny_then_reframe';
    if (/[.!?]\s+/.test(afterVerdict)) return 'confirm_then_undercut';
    return 'straight_verdict';
  }
  if (/^[^.!?]{2,45}[.!?]\s+/.test(t)) return 'confirm_then_undercut';
  if (/\bnot\b.*\b(is|was|means?|same as)\b|\bnot .*\. /i.test(t)) return 'deny_then_reframe';
  if (/\b(technically|barely|merely|only|just|lightly|not yet|still alive|not terminal|not decisive)\b/i.test(t)) return 'understatement';
  if (/\b(motive|did it|guilty|allegation|crime|culprit|suspect)\b/i.test(t)) return 'mock_accusation';
  if (/\b(chat|team|enemy|map|queue|lobby|replay|panic|cursor)\b/i.test(t) && /\b(problem|fault|blame|owns?|decides?|chose|did it|cooperation|volunteer|found|knows|plans?)\b/i.test(t)) return 'blame_shift';
  if (/\b(literally|lease|rent|financing|interest|custody|family|marriage|divorce|economy|property rights|looked lonely|looked negotiable|outscaled)\b/i.test(t)) return 'literalize_slang';
  if (/\b(now|already|another|entire|all week|forever|inevitable|officially|gained momentum)\b/i.test(t) && response.delivery === 'dry') return 'escalation';
  if ((response.reference_ids?.length || response.delivery === 'room_lore') && roomEntityRe.test(t)) return 'callback_substitution';
  if (/\b(the signs|prophecy|forecast|fate|omen)\b/i.test(t) || response.delivery === 'classic') return 'omen';
  return response.delivery === 'direct' ? 'straight_verdict' : 'deadpan_diagnosis';
}

function twistFamily(response, move) {
  const t = response.text;
  const lower = t.toLowerCase();
  if (response.delivery === 'chaos') return 'confident_nonsense';
  if (/\bmotive\b/i.test(t)) return 'motive_gap';
  if (legalRe.test(t)) return 'mock_authority';
  if ((response.reference_ids?.length || response.delivery === 'room_lore') && roomEntityRe.test(t)) return 'callback_jump';
  if (isLifeResponse(response) && leagueRe.test(t)) return 'league_frame_on_social';
  if (isLeagueResponse(response) && /\b(custody|lease|rent|financing|interest|warranty|insurance|paperwork|hearing|appeal|case|crime|legal|economy|family|divorce|receipt|contract|property|accounting|obituary|funeral|kitchen|adult)\b/i.test(t)) return 'social_frame_on_league';
  if (/\b(if|unless|assuming|only if|requires cooperation|enemy agrees|team agrees|nobody touch|stop after)\b/i.test(t)) return 'impossible_condition';
  if (/\b(content|thumbnail|wrong lesson|encourage|propaganda|all week|evidence for permission|win once)\b/i.test(t)) return 'status_reversal';
  if (/\b(technically|barely|merely|not terminal|not decisive|not over|lightly seared|inconvenienced)\b/i.test(t)) return 'quiet_doom';
  if (/\b(chat|team|enemy|map|queue|lobby|replay|jungler)\b/i.test(t) && /\b(problem|fault|cooperation|owns?|decides?|chose|volunteer|helping|plans?)\b/i.test(t)) return 'blame_transfer';
  if (/\bnot\b.*\b(is|was|same|means?)\b|\bthe premise\b|\bquestion itself\b/i.test(t)) return 'premise_undercut';
  if (/\b(literally|lease|rent|financing|interest|custody|family|property rights|load-bearing)\b/i.test(t)) return 'literal_slang';
  if (/\b(one .* becomes|entire|all week|forever|inevitable|officially|has entered the argument|gained momentum)\b/i.test(t)) return 'scale_shift';
  if (move === 'false_choice' || move === 'refusal') return 'expectation_denial';
  if (move === 'callback_substitution') return 'compression';
  if (/\b(swap|changed owners|other side|instead|helper|saving people|victim)\b/i.test(t)) return 'role_reversal';
  if (/\b(evidence against|case is building itself|volunteering|question lowered|asking the ball)\b/i.test(t)) return 'self_incrimination';
  if (/\b(gone|doomed|obituary|funeral|closing doors|last honest|already over|no path)\b/i.test(t)) return 'quiet_doom';
  return 'none';
}

function targetFamily(response) {
  const t = response.text;
  if (/\b(mods?|moderators?|Teamplay|ban|report)\b/i.test(t)) return 'moderators';
  if (/\bchat\b/i.test(t)) return 'chat';
  if (/\b(enemy|opponent)\b/i.test(t)) return 'enemy';
  if (/\b(team|teammates|four unwilling)\b/i.test(t)) return 'team';
  if (/\b(Mike|SRO|SoloRenektonOnly)\b/i.test(t) || response.entities_required?.includes('sro')) return 'streamer';
  if (response.entities_required?.some((e) => ['mtf','bones','misanthrope','john_west_gamer','teamplay'].includes(e)) || roomEntityRe.test(t)) return 'subject';
  if (/\b(build|item|rune|inventory|shopkeeper|purchase|wave|Baron|Dragon|objective|tower|nexus|recipe|food|pizza|groceries)\b/i.test(t)) return 'object_or_build';
  if (isLeagueResponse(response) || /\b(game|lane|fight|queue|lobby|map|rank|LP|MMR)\b/i.test(t)) return 'game_state';
  if (/\b(you|your)\b/i.test(t)) return 'asker';
  if (response.domains_any?.includes('general_oracle')) return 'fate';
  return 'subject';
}

function payoffFamily(response, move, twist) {
  if (response.delivery === 'chaos' || twist === 'confident_nonsense') return 'absurdity';
  if (twist === 'callback_jump' || twist === 'compression' || response.delivery === 'room_lore') return 'recognition';
  if (twist === 'status_reversal' || twist === 'premise_undercut' || twist === 'role_reversal' || move === 'deny_then_reframe' || move === 'false_choice') return 'reversal';
  if (twist === 'scale_shift' || move === 'escalation') return 'escalation';
  if (twist === 'quiet_doom') return 'doom';
  if ((response.concepts_any ?? []).includes('worth_cope') || /\bcope|worth|resetting his gold\b/i.test(response.text)) return 'cope';
  if (['mock_accusation','mock_sentence','deadpan_diagnosis','literalize_slang'].includes(move) || twist === 'mock_authority' || twist === 'self_incrimination') return 'judgment';
  if (response.delivery === 'direct' || response.seriousness >= 3 || move === 'straight_verdict' || move === 'omen') return 'utility';
  return 'reversal';
}

const exactOverrides = {
  bones_pizza_01: ['mock_accusation','motive_gap','subject','recognition'],
  mtf_hater_01: ['callback_substitution','callback_jump','subject','recognition'],
  doubters_lore_03: ['false_choice','expectation_denial','asker','reversal'],
  mtf_safe_04: ['callback_substitution','callback_jump','subject','recognition']
};

for (const response of responses) {
  const move = replyMove(response);
  const twist = twistFamily(response, move);
  response.reply_move = move;
  response.twist_family = twist;
  response.target_family = targetFamily(response);
  response.payoff_family = payoffFamily(response, move, twist);
  if (exactOverrides[response.id]) {
    [response.reply_move, response.twist_family, response.target_family, response.payoff_family] = exactOverrides[response.id];
  }
  if (!String(response.editorial_notes ?? '').includes('V4.6 humor grammar reviewed.')) response.editorial_notes = `${response.editorial_notes ?? ''} V4.6 humor grammar reviewed.`.trim();
}

payload.version = '4.6.0';
fs.writeFileSync(responsePath, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`Annotated ${responses.length} responses for V4.6 humor grammar.`);
