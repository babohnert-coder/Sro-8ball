import fs from 'node:fs';
import path from 'node:path';
import { groupRewrites, newGroups } from '../editorial/rewrite-v4.5.mjs';

const responses = [];

function openingFamily(text, verdict) {
  const known = [
    ['ASK AGAIN LATER', 'ask_again_later'],
    ['OUTLOOK UNCLEAR', 'outlook_unclear'],
    ['OUTLOOK GOOD', 'outlook_good'],
    ['VERY DOUBTFUL', 'very_doubtful'],
    ['THE SIGNS SAY YES', 'signs_yes'],
    ['THE SIGNS SAY NO', 'signs_no'],
    ['NOT YET', 'not_yet'],
    ['THE FIRST', 'first'],
    ['THE SECOND', 'second'],
  ];
  for (const [prefix, family] of known) if (text.startsWith(prefix)) return family;
  return String(verdict ?? text.split(/\s+/)[0]).toLowerCase().replace(/[^a-z0-9]+/g, '_');
}

function addGroup(prefix, meta, lines) {
  lines.forEach((line, index) => {
    const item = typeof line === 'string' ? { text: line } : line;
    const id = `${prefix}_${String(index + 1).padStart(2, '0')}`;
    responses.push({
      id,
      text: item.text,
      intents: item.intents ?? meta.intents,
      domains_any: item.domains_any ?? meta.domains_any ?? ['general_oracle'],
      domains_all: item.domains_all ?? meta.domains_all ?? [],
      domains_forbidden: item.domains_forbidden ?? meta.domains_forbidden ?? [],
      entities_required: item.entities_required ?? meta.entities_required ?? [],
      entities_preferred: item.entities_preferred ?? meta.entities_preferred ?? [],
      entities_forbidden: item.entities_forbidden ?? meta.entities_forbidden ?? [],
      concepts_any: item.concepts_any ?? meta.concepts_any ?? [],
      concepts_all: item.concepts_all ?? meta.concepts_all ?? [],
      concepts_forbidden: item.concepts_forbidden ?? meta.concepts_forbidden ?? [],
      states_any: item.states_any ?? meta.states_any ?? [],
      states_forbidden: item.states_forbidden ?? meta.states_forbidden ?? [],
      verdict: item.verdict ?? meta.verdict ?? 'unclear',
      delivery: item.delivery ?? meta.delivery ?? 'classic',
      league_intensity: item.league_intensity ?? meta.league_intensity ?? 0,
      sro_intensity: item.sro_intensity ?? meta.sro_intensity ?? 0,
      seriousness: item.seriousness ?? meta.seriousness ?? 2,
      chaos: item.chaos ?? meta.chaos ?? 0,
      emote: item.emote ?? null,
      min_specificity: item.min_specificity ?? meta.min_specificity ?? 0,
      max_specificity: item.max_specificity ?? meta.max_specificity ?? 1,
      status: 'approved',
      reference_ids: item.reference_ids ?? meta.reference_ids ?? [],
      semantic_family: item.semantic_family ?? `${prefix}_${item.verdict ?? meta.verdict ?? 'unclear'}`,
      opening_family: item.opening_family ?? openingFamily(item.text, item.verdict ?? meta.verdict),
      syntax_family: item.syntax_family ?? (item.text.includes('—') ? 'verdict_dash_single_clause' : 'direct_single_clause'),
      editorial_notes: item.editorial_notes ?? meta.editorial_notes ?? 'Approved V4.2 editorial bank.',
      source_assumptions: item.source_assumptions ?? meta.source_assumptions ?? [],
    });
  });
}

addGroup('general_prediction', {
  intents: ['prediction'], domains_any: ['general_oracle'], delivery: 'classic', min_specificity: 0, max_specificity: 0.65,
}, [
  { text: 'YES — the signs are unusually cooperative.', verdict: 'yes' },
  { text: 'NO — this ends before it improves.', verdict: 'no', delivery: 'direct' },
  { text: 'MAYBE — one useful mistake could change it.', verdict: 'maybe' },
  { text: 'OUTLOOK GOOD — not safely, but convincingly.', verdict: 'outlook_good' },
  { text: 'VERY DOUBTFUL — confidence arrived without evidence.', verdict: 'very_doubtful', delivery: 'dry' },
  { text: 'ASK AGAIN LATER — the answer is still moving.', verdict: 'ask_again_later' },
  { text: 'LIKELY — the path is ugly, not closed.', verdict: 'likely' },
  { text: 'UNLIKELY — the timing has already turned.', verdict: 'unlikely' },
  { text: 'YES — somehow, the door remains open.', verdict: 'yes' },
  { text: 'NO — the Ball has seen enough.', verdict: 'no', delivery: 'direct' },
  { text: 'OUTLOOK UNCLEAR — the next decision owns it.', verdict: 'outlook_unclear' },
  { text: 'NOT YET — the moment has not committed.', verdict: 'not_yet' },
  { text: 'THE SIGNS SAY YES — proceed without celebrating.', verdict: 'yes', delivery: 'dry' },
  { text: 'THE SIGNS SAY NO — optimism has lost standing.', verdict: 'no', delivery: 'dry' },
  { text: 'MAYBE — fortune is waiting for someone else to blink.', verdict: 'maybe' },
  { text: 'YES — against better judgment.', verdict: 'yes', delivery: 'dry' },
  { text: 'NO — the prophecy has chosen a victim.', verdict: 'no', delivery: 'dry' },
  { text: 'OUTLOOK GOOD — barely, which still counts.', verdict: 'outlook_good' },
]);

addGroup('general_permission', {
  intents: ['permission'], domains_any: ['general_oracle'], delivery: 'classic', min_specificity: 0, max_specificity: 0.7,
}, [
  { text: 'YES — do it before caution returns.', verdict: 'yes' },
  { text: 'NO — leave this one untested.', verdict: 'no' },
  { text: 'MAYBE — only if you can survive being wrong.', verdict: 'maybe' },
  { text: 'ASK AGAIN LATER — impulse is currently answering for you.', verdict: 'ask_again_later', delivery: 'dry' },
  { text: 'YES — the consequences appear manageable.', verdict: 'yes', delivery: 'direct' },
  { text: 'NO — this is how a preventable story begins.', verdict: 'no', delivery: 'dry' },
  { text: 'MAYBE — commit lightly.', verdict: 'maybe' },
  { text: 'YES — permission granted; dignity not included.', verdict: 'yes', delivery: 'dry', syntax_family: 'verdict_semicolon_clause' },
  { text: 'NO — the Ball refuses to become an accomplice.', verdict: 'no', delivery: 'dry' },
  { text: 'MAYBE — one clean attempt.', verdict: 'maybe' },
  { text: 'YES — but stop after the first bad sign.', verdict: 'yes', delivery: 'direct' },
  { text: 'NO — let the idea die undefeated.', verdict: 'no', delivery: 'dry' },
]);

addGroup('general_evaluation', {
  intents: ['evaluation', 'reaction'], domains_any: ['general_oracle'], delivery: 'classic', min_specificity: 0, max_specificity: 0.7,
}, [
  { text: 'YES — better than it has any right to be.', verdict: 'yes', delivery: 'dry' },
  { text: 'NO — the premise is carrying the result.', verdict: 'no', delivery: 'dry' },
  { text: 'MAYBE — the evidence is split.', verdict: 'maybe' },
  { text: 'OUTLOOK GOOD — the flaws are not fatal.', verdict: 'outlook_good', delivery: 'direct' },
  { text: 'VERY DOUBTFUL — the confidence is decorative.', verdict: 'very_doubtful', delivery: 'dry' },
  { text: 'NO — this did not survive inspection.', verdict: 'no', delivery: 'direct' },
  { text: 'YES — the result counts, even if the method does not.', verdict: 'yes', delivery: 'direct' },
  { text: 'OUTLOOK UNCLEAR — success and good judgment are arguing.', verdict: 'outlook_unclear', delivery: 'dry' },
  { text: 'MAYBE — technically alive.', verdict: 'maybe', delivery: 'dry' },
  { text: 'NO — the Ball rejects the appeal.', verdict: 'no', delivery: 'dry' },
  { text: 'YES — regrettably valid.', verdict: 'yes', delivery: 'dry' },
  { text: 'OUTLOOK UNCLEAR — one more failure will clarify it.', verdict: 'outlook_unclear' },
]);

addGroup('general_timing', {
  intents: ['timing'], domains_any: ['general_oracle'], delivery: 'classic', min_specificity: 0, max_specificity: 0.8,
}, [
  { text: 'SOON — sooner than wisdom recommends.', verdict: 'soon', delivery: 'dry' },
  { text: 'NOT YET — the moment is still forming.', verdict: 'not_yet' },
  { text: 'ASK AGAIN LATER — the timing is still hiding.', verdict: 'ask_again_later' },
  { text: 'OUTLOOK UNCLEAR — the clock is hiding behind circumstance.', verdict: 'unclear' },
  { text: 'SOON — after one unnecessary delay.', verdict: 'soon' },
  { text: 'NOT YET — impatience is early.', verdict: 'not_yet', delivery: 'dry' },
  { text: 'ASK AGAIN LATER — the answer has not arrived.', verdict: 'ask_again_later' },
  { text: 'OUTLOOK UNCLEAR — before too long, after too much.', verdict: 'unclear', delivery: 'dry' },
]);

addGroup('general_comparison', {
  intents: ['comparison'], domains_any: ['general_oracle'], delivery: 'classic', min_specificity: 0, max_specificity: 0.8,
}, [
  { text: 'THE FIRST — it has fewer ways to betray you.', verdict: 'first', delivery: 'dry' },
  { text: 'THE SECOND — the first is relying on reputation.', verdict: 'second', delivery: 'dry' },
  { text: 'NEITHER — the Ball recognizes a false choice.', verdict: 'neither' },
  { text: 'BOTH — one for the result, one for the excuse.', verdict: 'both', delivery: 'dry' },
  { text: 'OUTLOOK UNCLEAR — the comparison needs better evidence.', verdict: 'unclear' },
  { text: 'THE FIRST — cleaner, not kinder.', verdict: 'first' },
  { text: 'THE SECOND — uglier, but more honest.', verdict: 'second' },
  { text: 'NEITHER — choose the option not yet mentioned.', verdict: 'neither', delivery: 'dry' },
]);

addGroup('general_explanation', {
  intents: ['explanation'], domains_any: ['general_oracle'], delivery: 'direct', min_specificity: 0, max_specificity: 0.85,
}, [
  { text: 'BECAUSE — someone confused confidence with permission.', verdict: 'because', delivery: 'dry' },
  { text: 'BECAUSE — the easy answer arrived first.', verdict: 'because' },
  { text: 'OUTLOOK UNCLEAR — the cause left before the replay.', verdict: 'unclear', delivery: 'dry' },
  { text: 'BECAUSE — one small mistake found friends.', verdict: 'because', delivery: 'dry' },
  { text: 'BECAUSE — the plan survived longer than the judgment.', verdict: 'because', delivery: 'dry' },
  { text: 'OUTLOOK UNCLEAR — motive and outcome are no longer speaking.', verdict: 'unclear', delivery: 'dry' },
]);

addGroup('general_location', {
  intents: ['location'], domains_any: ['general_oracle'], delivery: 'direct', min_specificity: 0, max_specificity: 0.8,
}, [
  { text: 'NEARBY — avoiding responsibility.', verdict: 'direct_location', delivery: 'dry' },
  { text: 'OUTLOOK UNCLEAR — the trail ends at poor judgment.', verdict: 'unclear', delivery: 'dry' },
  { text: 'RIGHT WHERE YOU LEFT IT — probably.', verdict: 'direct_location' },
  { text: 'ELSEWHERE — with the better decision.', verdict: 'direct_location', delivery: 'dry' },
  { text: 'CLOSER THAN EXPECTED — farther than useful.', verdict: 'direct_location' },
  { text: 'ASK AGAIN LATER — location services have chosen secrecy.', verdict: 'ask_again_later', delivery: 'dry' },
]);

addGroup('general_fragment', {
  intents: ['reaction', 'nonsense'], domains_any: ['general_oracle'], delivery: 'classic', min_specificity: 0, max_specificity: 0.35,
}, [
  { text: 'OUTLOOK UNCLEAR — that was not a full inquiry.', verdict: 'unclear' },
  { text: 'YES — the Ball respects the confidence.', verdict: 'yes', delivery: 'dry' },
  { text: 'NO — punctuation cannot save this.', verdict: 'no', delivery: 'dry' },
  { text: 'MAYBE — translate the omen and try again.', verdict: 'maybe' },
  { text: 'ASK AGAIN LATER — the question is still assembling.', verdict: 'ask_again_later' },
  { text: 'YES — spiritually coherent.', verdict: 'yes', delivery: 'dry' },
  { text: 'NO — the Ball declines to infer the rest.', verdict: 'no', delivery: 'direct' },
  { text: 'OUTLOOK UNCLEAR — several meanings survived.', verdict: 'unclear' },
  { text: 'MAYBE — the fragment has potential.', verdict: 'maybe' },
  { text: 'NO — the omen requires at least one verb.', verdict: 'no', delivery: 'dry' },
]);

addGroup('general_chaos', {
  intents: ['prediction', 'permission', 'evaluation', 'reaction'], domains_any: ['general_oracle', 'relationships_social', 'ordinary_life'], delivery: 'chaos', min_specificity: 0, max_specificity: 0.4, chaos: 1, seriousness: 1,
}, [
  { text: 'YES — proxy the relationship.', verdict: 'yes' },
  { text: 'NO — the moon has weakside coverage.', verdict: 'no' },
  { text: 'MAYBE — spiritually winnable.', verdict: 'maybe' },
  { text: 'ASK AGAIN LATER — the omen is in queue.', verdict: 'ask_again_later' },
  { text: 'YES — the floor has accepted the terms.', verdict: 'yes' },
  { text: 'NO — the furniture has side selection.', verdict: 'no' },
  { text: 'MAYBE — the prophecy is autofilled.', verdict: 'maybe' },
  { text: 'YES — but only in lowercase.', verdict: 'yes' },
  { text: 'NO — the timeline has been demoted.', verdict: 'no' },
  { text: 'MAYBE — consult the nearest loading screen.', verdict: 'maybe' },
  { text: 'YES — the ceiling knows.', verdict: 'yes' },
  { text: 'NO — too much aura, insufficient evidence.', verdict: 'no' },
  { text: 'MAYBE — one clean sneeze changes everything.', verdict: 'maybe' },
]);

addGroup('game_outcome', {
  intents: ['prediction', 'evaluation'], domains_any: ['current_game'], concepts_any: ['game_outcome_question', 'game_winnable_question'], delivery: 'contextual', league_intensity: 1, min_specificity: 0.3, max_specificity: 1,
}, [
  { text: 'OUTLOOK GOOD — the game still has a shape.', verdict: 'outlook_good' },
  { text: 'OUTLOOK UNCLEAR — one fight will answer it.', verdict: 'outlook_unclear' },
  { text: 'YES — but not cleanly.', verdict: 'yes' },
  { text: 'NO — the map has already chosen a side.', verdict: 'no', delivery: 'dry' },
  { text: 'MAYBE — the next mistake matters more than the last.', verdict: 'maybe' },
  { text: 'NOT YET — somebody still has to finish it.', verdict: 'not_yet' },
  { text: 'VERY DOUBTFUL — the lead is becoming permanent.', verdict: 'very_doubtful', delivery: 'direct' },
  { text: 'LIKELY — the game remains recoverable.', verdict: 'likely', delivery: 'direct' },
  { text: 'UNLIKELY — too many conditions are now required.', verdict: 'unlikely', delivery: 'direct' },
  { text: 'YES — there is still one honest win condition.', verdict: 'yes' },
  { text: 'NO — the comeback needs enemy cooperation.', verdict: 'no', delivery: 'dry' },
  { text: 'MAYBE — one clean reset keeps it alive.', verdict: 'maybe' },
  { text: 'OUTLOOK GOOD — the bad part is still reversible.', verdict: 'outlook_good' },
  { text: 'OUTLOOK UNCLEAR — neither team has earned certainty.', verdict: 'outlook_unclear', delivery: 'dry' },
]);

addGroup('sro_game_outcome', {
  intents: ['prediction', 'evaluation'], domains_any: ['current_game', 'sro'], entities_required: ['sro'], concepts_any: ['game_outcome_question', 'game_winnable_question'], delivery: 'contextual', league_intensity: 1, sro_intensity: 1, min_specificity: 0.35, max_specificity: 1, reference_ids: ['sro'],
}, [
  { text: 'YES — Mike still has a path.', verdict: 'yes' },
  { text: 'NO — Mike has found the expensive route.', verdict: 'no', delivery: 'dry' },
  { text: 'MAYBE — it depends which Mike returns from base.', verdict: 'maybe', delivery: 'dry' },
  { text: 'OUTLOOK GOOD — the haters have briefly lost jurisdiction.', verdict: 'outlook_good', delivery: 'dry' },
  { text: 'VERY DOUBTFUL — the comeback now requires a speech.', verdict: 'very_doubtful', delivery: 'dry' },
  { text: 'YES — Mike will call it calculated afterward.', verdict: 'yes', delivery: 'dry' },
  { text: 'NO — the Ball has reviewed the last three minutes.', verdict: 'no', delivery: 'direct' },
  { text: 'MAYBE — the hands are present; the game is negotiating.', verdict: 'maybe', delivery: 'dry', syntax_family: 'verdict_semicolon_clause' },
  { text: 'OUTLOOK UNCLEAR — Mike has not finished making this harder.', verdict: 'outlook_unclear', delivery: 'dry' },
  { text: 'YES — somehow, this remains his game to lose.', verdict: 'yes' },
  { text: 'NO — content has overtaken result.', verdict: 'no', delivery: 'dry' },
  { text: 'NOT YET — Mike has one more theory.', verdict: 'not_yet', delivery: 'dry' },
]);

addGroup('game_over', {
  intents: ['evaluation', 'prediction'], domains_any: ['current_game'], concepts_any: ['game_over_question'], delivery: 'contextual', league_intensity: 1, min_specificity: 0.45, max_specificity: 1,
}, [
  { text: 'NO — not over, merely damaged.', verdict: 'no' },
  { text: 'YES — the remaining path is ceremonial.', verdict: 'yes', delivery: 'dry' },
  { text: 'MAYBE — one clean fight still exists.', verdict: 'maybe' },
  { text: 'VERY DOUBTFUL — the game has started closing doors.', verdict: 'very_doubtful' },
  { text: 'NOT YET — the lead changed, not the result.', verdict: 'not_yet' },
  { text: 'YES — this is now a lesson with a scoreboard.', verdict: 'yes', delivery: 'dry' },
  { text: 'OUTLOOK UNCLEAR — one mistake can still reopen it.', verdict: 'outlook_unclear' },
  { text: 'NO — the ending has not been earned.', verdict: 'no', delivery: 'direct' },
]);

addGroup('comeback', {
  intents: ['prediction', 'evaluation'], domains_any: ['current_game'], concepts_any: ['comeback_possible'], states_any: ['comeback_possible', 'reversible'], delivery: 'contextual', league_intensity: 1, min_specificity: 0.45, max_specificity: 1,
}, [
  { text: 'YES — one clean fight is enough.', verdict: 'yes' },
  { text: 'NO — the comeback needs too many volunteers.', verdict: 'no', delivery: 'dry' },
  { text: 'MAYBE — the gold says no; the map says ask again.', verdict: 'maybe', syntax_family: 'verdict_semicolon_clause' },
  { text: 'OUTLOOK GOOD — the deficit is ugly, not terminal.', verdict: 'outlook_good' },
  { text: 'VERY DOUBTFUL — every route back charges interest.', verdict: 'very_doubtful', delivery: 'dry' },
  { text: 'NOT YET — the enemy still has to close.', verdict: 'not_yet' },
  { text: 'YES — the game left one door unlocked.', verdict: 'yes' },
  { text: 'NO — hope is currently the strongest resource.', verdict: 'no', delivery: 'dry' },
]);

addGroup('throw_risk', {
  intents: ['evaluation', 'reaction', 'prediction'], domains_any: ['fight_dive_trade_shutdown', 'current_game'], concepts_any: ['throw_risk'], states_any: ['throw_risk', 'negative_event'], delivery: 'dry', league_intensity: 1, min_specificity: 0.4, max_specificity: 1,
}, [
  { text: 'YES — that was a throw with witnesses.', verdict: 'yes' },
  { text: 'NO — bad, but not yet a throw.', verdict: 'no', delivery: 'direct' },
  { text: 'MAYBE — the lead is filing for separation.', verdict: 'maybe' },
  { text: 'YES — the game was returned without a receipt.', verdict: 'yes' },
  { text: 'NO — the mistake was expensive, not decisive.', verdict: 'no', delivery: 'direct' },
  { text: 'OUTLOOK UNCLEAR — one more like that settles it.', verdict: 'outlook_unclear' },
  { text: 'YES — the advantage has changed owners.', verdict: 'yes', delivery: 'contextual' },
  { text: 'MAYBE — call it pressure until the next fight.', verdict: 'maybe' },
]);

addGroup('shutdown_given', {
  intents: ['evaluation', 'prediction', 'reaction'], domains_any: ['fight_dive_trade_shutdown', 'current_game'], concepts_any: ['shutdown_given'], states_any: ['negative_event', 'reversible', 'sarcastic_or_cope'], delivery: 'contextual', league_intensity: 2, min_specificity: 0.5, max_specificity: 1,
}, [
  { text: 'NOT YET — the gold changed hands, not the result.', verdict: 'not_yet' },
  { text: 'VERY DOUBTFUL — that shutdown changed the forecast.', verdict: 'very_doubtful' },
  { text: 'NO — the game is not over; the margin is.', verdict: 'no', syntax_family: 'verdict_semicolon_clause' },
  { text: 'MAYBE — the bounty found a better owner.', verdict: 'maybe', delivery: 'dry' },
  { text: 'OUTLOOK UNCLEAR — one death just became several decisions.', verdict: 'outlook_unclear' },
  { text: 'YES — they found another way back in.', verdict: 'yes', delivery: 'dry' },
  { text: 'VERY DOUBTFUL — 700 gold has entered the argument.', verdict: 'very_doubtful', delivery: 'dry' },
  { text: 'NOT YET — the shutdown only changed the math.', verdict: 'not_yet' },
  { text: 'NO — that was not a reset; it was financing.', verdict: 'no', delivery: 'dry', syntax_family: 'verdict_semicolon_clause' },
  { text: 'MAYBE — the cope is weak, but the game survives.', verdict: 'maybe', delivery: 'dry' },
]);

addGroup('shutdown_collected', {
  intents: ['evaluation', 'prediction'], domains_any: ['fight_dive_trade_shutdown', 'current_game'], concepts_any: ['shutdown_collected'], states_any: ['positive_event'], delivery: 'contextual', league_intensity: 2, min_specificity: 0.5, max_specificity: 1,
}, [
  { text: 'YES — that bounty arrived on time.', verdict: 'yes' },
  { text: 'OUTLOOK GOOD — the shutdown repaired several mistakes.', verdict: 'outlook_good' },
  { text: 'MAYBE — the gold helps; the hands still decide.', verdict: 'maybe', syntax_family: 'verdict_semicolon_clause' },
  { text: 'YES — the comeback just received funding.', verdict: 'yes', delivery: 'dry' },
  { text: 'NO — collecting it was the easy part.', verdict: 'no', delivery: 'dry' },
  { text: 'OUTLOOK UNCLEAR — the bounty opened the door, not the nexus.', verdict: 'outlook_unclear' },
]);

addGroup('lane_won', {
  intents: ['evaluation'], domains_any: ['lane_wave_state', 'player_role_performance'], concepts_any: ['won_lane'], states_any: ['positive_event'], delivery: 'contextual', league_intensity: 2, min_specificity: 0.45, max_specificity: 1,
}, [
  { text: 'YES — lane was won; the game remains separate.', verdict: 'yes', syntax_family: 'verdict_semicolon_clause' },
  { text: 'OUTLOOK GOOD — the matchup has paid out.', verdict: 'outlook_good' },
  { text: 'YES — the pressure was real.', verdict: 'yes' },
  { text: 'MAYBE — won lane, pending use.', verdict: 'maybe', delivery: 'dry' },
  { text: 'NO — not cleanly enough to call it won.', verdict: 'no', delivery: 'direct' },
  { text: 'YES — the opponent has accepted weakside status.', verdict: 'yes', delivery: 'dry' },
]);

addGroup('lane_lost', {
  intents: ['evaluation'], domains_any: ['lane_wave_state', 'player_role_performance'], concepts_any: ['lost_lane'], states_any: ['negative_event'], delivery: 'contextual', league_intensity: 2, min_specificity: 0.45, max_specificity: 1,
}, [
  { text: 'YES — lane is gone; dignity may follow.', verdict: 'yes', delivery: 'dry', syntax_family: 'verdict_semicolon_clause' },
  { text: 'NO — behind is not the same as lost.', verdict: 'no', delivery: 'direct' },
  { text: 'MAYBE — the wave knows more than the scoreboard.', verdict: 'maybe' },
  { text: 'VERY DOUBTFUL — that lane belongs to someone else now.', verdict: 'very_doubtful' },
  { text: 'YES — the matchup has finished its statement.', verdict: 'yes', delivery: 'dry' },
  { text: 'NO — one bad recall is not a conviction.', verdict: 'no', delivery: 'direct' },
]);

addGroup('wave_state', {
  intents: ['evaluation', 'prediction', 'permission'], domains_any: ['lane_wave_state'], concepts_any: ['wave_freeze', 'wave_denial'], delivery: 'contextual', league_intensity: 2, min_specificity: 0.4, max_specificity: 1,
}, [
  { text: 'NO — the wave is frozen.', verdict: 'no' },
  { text: 'VERY DOUBTFUL — walking up is now a negotiation.', verdict: 'very_doubtful', delivery: 'dry' },
  { text: 'MAYBE — one crash repairs it.', verdict: 'maybe' },
  { text: 'NO — the minions have chosen custody.', verdict: 'no', delivery: 'dry' },
  { text: 'OUTLOOK UNCLEAR — the next wave decides the lane.', verdict: 'outlook_unclear' },
  { text: 'YES — the freeze is real and the options are not.', verdict: 'yes' },
  { text: 'NOT YET — the wave can still be broken.', verdict: 'not_yet' },
  { text: 'NO — that XP no longer belongs to him.', verdict: 'no', delivery: 'dry' },
]);

addGroup('jungle_pressure', {
  intents: ['evaluation', 'prediction', 'reaction'], domains_any: ['lane_wave_state', 'player_role_performance'], concepts_any: ['jungle_pressure_enemy', 'jungle_pressure_ally', 'jungle_gank_prediction'], delivery: 'contextual', league_intensity: 2, min_specificity: 0.45, max_specificity: 1,
}, [
  { text: 'YES — the enemy jungle lives here now.', verdict: 'yes', delivery: 'dry' },
  { text: 'NO — one gank is not a lease.', verdict: 'no', delivery: 'dry' },
  { text: 'MAYBE — the pathing looks personal.', verdict: 'maybe', delivery: 'dry' },
  { text: 'YES — weakside has been officially declared.', verdict: 'yes' },
  { text: 'NO — the jungler has other crimes.', verdict: 'no', delivery: 'dry' },
  { text: 'OUTLOOK UNCLEAR — top is on the next route.', verdict: 'outlook_unclear' },
  { text: 'YES — three people is technically pressure.', verdict: 'yes', delivery: 'dry' },
  { text: 'MAYBE — the ward knows first.', verdict: 'maybe' },
  { text: 'LIKELY — top is asking for visitors.', verdict: 'likely' },
  { text: 'UNLIKELY — the path is pointing elsewhere.', verdict: 'unlikely' },
]);

addGroup('dive_trade', {
  intents: ['permission', 'evaluation', 'prediction'], domains_any: ['fight_dive_trade_shutdown'], concepts_any: ['dive_attempt', 'trade_attempt'], delivery: 'contextual', league_intensity: 2, min_specificity: 0.4, max_specificity: 1,
}, [
  { text: 'YES — the dive exists; survival is optional.', verdict: 'yes', delivery: 'dry', syntax_family: 'verdict_semicolon_clause', concepts_any: ['dive_attempt'] },
  { text: 'NO — the tower is still employed.', verdict: 'no', delivery: 'dry', concepts_any: ['dive_attempt'] },
  { text: 'MAYBE — one cooldown changes the answer.', verdict: 'maybe', concepts_any: ['dive_attempt', 'trade_attempt'] },
  { text: 'VERY DOUBTFUL — the health bars have filed an objection.', verdict: 'very_doubtful', delivery: 'dry', concepts_any: ['dive_attempt', 'trade_attempt'] },
  { text: 'YES — clean execution makes it legal.', verdict: 'yes', concepts_any: ['dive_attempt'] },
  { text: 'NO — that trade pays the other side.', verdict: 'no', concepts_any: ['trade_attempt'] },
  { text: 'MAYBE — the damage works; the exit does not.', verdict: 'maybe', syntax_family: 'verdict_semicolon_clause', concepts_any: ['dive_attempt'] },
  { text: 'OUTLOOK GOOD — if the first second is perfect.', verdict: 'outlook_good', concepts_any: ['dive_attempt', 'trade_attempt'] },
]);

addGroup('objective_call', {
  intents: ['evaluation', 'prediction', 'permission'], domains_any: ['objective_macro'], concepts_any: ['objective_free', 'objective_flip', 'baron_call', 'dragon_call', 'smite_objective'], delivery: 'contextual', league_intensity: 2, min_specificity: 0.4, max_specificity: 1,
}, [
  { text: 'MAYBE — Baron is free only if the map agrees.', verdict: 'maybe', concepts_any: ['objective_free'], entities_required: ['baron'] },
  { text: 'YES — Baron is free until someone checks the river.', verdict: 'yes', delivery: 'dry', concepts_any: ['objective_free'], entities_required: ['baron'] },
  { text: 'NO — Baron is bait with a health bar.', verdict: 'no', delivery: 'dry', concepts_any: ['objective_free'], entities_required: ['baron'] },
  { text: 'OUTLOOK UNCLEAR — Baron is free in the dangerous sense.', verdict: 'outlook_unclear', delivery: 'dry', concepts_any: ['objective_free'], entities_required: ['baron'] },
  { text: 'NO — free objectives do not need this much discussion.', verdict: 'no', delivery: 'dry', concepts_any: ['objective_free'] },
  { text: 'YES — take it before the enemy develops courage.', verdict: 'yes', concepts_any: ['baron_call', 'dragon_call'] },
  { text: 'VERY DOUBTFUL — the flip has already begun.', verdict: 'very_doubtful', concepts_any: ['objective_flip'] },
  { text: 'OUTLOOK GOOD — vision is doing its job.', verdict: 'outlook_good', concepts_any: ['baron_call', 'dragon_call', 'objective_free'] },
  { text: 'NO — the objective is bait wearing a timer.', verdict: 'no', delivery: 'dry', concepts_any: ['baron_call', 'dragon_call', 'objective_free'] },
  { text: 'MAYBE — the call is right; the setup is not.', verdict: 'maybe', syntax_family: 'verdict_semicolon_clause', concepts_any: ['baron_call', 'dragon_call'] },
  { text: 'YES — the smite fight is avoidable, which is encouraging.', verdict: 'yes', delivery: 'dry', concepts_any: ['smite_objective'] },
  { text: 'NO — Dragon has become a coin with health bars.', verdict: 'no', delivery: 'dry', concepts_any: ['objective_flip'], entities_required: ['dragon'] },
  { text: 'YES — Dragon is already a flip.', verdict: 'yes', concepts_any: ['objective_flip'], entities_required: ['dragon'] },
  { text: 'MAYBE — Dragon is fifty-fifty only if both teams misbehave equally.', verdict: 'maybe', delivery: 'dry', concepts_any: ['objective_flip'], entities_required: ['dragon'] },
  { text: 'VERY DOUBTFUL — the Dragon setup has become gambling.', verdict: 'very_doubtful', delivery: 'dry', concepts_any: ['objective_flip'], entities_required: ['dragon'] },
  { text: 'OUTLOOK UNCLEAR — one ward changes the vote.', verdict: 'outlook_unclear', concepts_any: ['baron_call', 'dragon_call', 'objective_free', 'objective_flip'] },
  { text: 'YES — the enemy showed elsewhere.', verdict: 'yes', concepts_any: ['baron_call', 'dragon_call', 'objective_free'] },
  { text: 'NO — the map is not empty just because chat is confident.', verdict: 'no', delivery: 'dry', concepts_any: ['baron_call', 'dragon_call', 'objective_free'] },
]);

addGroup('sro_skill_eval', {
  intents: ['evaluation', 'reaction'], domains_any: ['sro', 'player_role_performance'], entities_required: ['sro'], concepts_any: ['sro_skill_evaluation'], delivery: 'contextual', league_intensity: 1, sro_intensity: 1, min_specificity: 0.4, max_specificity: 1, reference_ids: ['sro'],
}, [
  { text: 'YES — the hands are real.', verdict: 'yes', delivery: 'direct' },
  { text: 'NO — not in the last three minutes.', verdict: 'no', delivery: 'dry' },
  { text: 'MAYBE — the mechanics arrived before the consistency.', verdict: 'maybe', delivery: 'dry' },
  { text: 'OUTLOOK GOOD — the ceiling is not the problem.', verdict: 'outlook_good' },
  { text: 'YES — good enough to make the bad ideas dangerous.', verdict: 'yes', delivery: 'dry' },
  { text: 'NO — the replay has objections.', verdict: 'no', delivery: 'dry' },
  { text: 'MAYBE — it depends which Mike loaded in.', verdict: 'maybe', delivery: 'dry' },
  { text: 'VERY DOUBTFUL — chat has timestamps.', verdict: 'very_doubtful', delivery: 'dry' },
]);

addGroup('worth_cope', {
  intents: ['evaluation', 'reaction'], domains_any: ['fight_dive_trade_shutdown'], concepts_any: ['worth_cope'], delivery: 'contextual', league_intensity: 1, min_specificity: 0.3, max_specificity: 1,
}, [
  { text: 'NO — the cope arrived before the value.', verdict: 'no', delivery: 'dry' },
  { text: 'MAYBE — the trade was bad; the story is improving.', verdict: 'maybe', delivery: 'dry', syntax_family: 'verdict_semicolon_clause' },
  { text: 'YES — technically, which is how the trouble starts.', verdict: 'yes', delivery: 'dry' },
  { text: 'NO — one cannon does not clear the debt.', verdict: 'no', delivery: 'dry' },
  { text: 'MAYBE — worth is doing emotional labor.', verdict: 'maybe', delivery: 'dry' },
  { text: 'YES — if survival was never part of the plan.', verdict: 'yes', delivery: 'dry' },
  { text: 'OUTLOOK UNCLEAR — the gold and dignity disagree.', verdict: 'outlook_unclear' },
  { text: 'NO — the replay rejects the bargain.', verdict: 'no', delivery: 'direct' },
]);

addGroup('lead_built', {
  intents: ['evaluation', 'prediction'], domains_any: ['current_game', 'player_role_performance'], concepts_any: ['lead_built'], delivery: 'contextual', league_intensity: 1, min_specificity: 0.35, max_specificity: 1,
}, [
  { text: 'YES — the lead exists; custody is pending.', verdict: 'yes', delivery: 'dry', syntax_family: 'verdict_semicolon_clause' },
  { text: 'NO — pressure is not a lead.', verdict: 'no', delivery: 'direct' },
  { text: 'MAYBE — the gold says yes; the map wants proof.', verdict: 'maybe', syntax_family: 'verdict_semicolon_clause' },
  { text: 'OUTLOOK GOOD — the lane has started paying.', verdict: 'outlook_good' },
  { text: 'YES — the advantage is finally visible.', verdict: 'yes' },
  { text: 'VERY DOUBTFUL — the lead is mostly posture.', verdict: 'very_doubtful', delivery: 'dry' },
]);

addGroup('build_free', {
  intents: ['evaluation', 'prediction'], domains_any: ['builds_items_runes'], concepts_any: ['build_free'], delivery: 'contextual', league_intensity: 1, min_specificity: 0.3, max_specificity: 1,
}, [
  { text: 'NO — free is not the word the items chose.', verdict: 'no', delivery: 'dry' },
  { text: 'MAYBE — playable, not free.', verdict: 'maybe', delivery: 'direct' },
  { text: 'YES — the build has room for one mistake.', verdict: 'yes' },
  { text: 'VERY DOUBTFUL — the opponent must cooperate.', verdict: 'very_doubtful' },
  { text: 'OUTLOOK GOOD — the pieces are doing their jobs.', verdict: 'outlook_good' },
  { text: 'NO — this build charges interest.', verdict: 'no', delivery: 'dry' },
]);

addGroup('lane_free', {
  intents: ['evaluation', 'prediction'], domains_any: ['lane_wave_state'], concepts_any: ['lane_free'], delivery: 'contextual', league_intensity: 1, min_specificity: 0.3, max_specificity: 1,
}, [
  { text: 'NO — top is never free; the bill arrives later.', verdict: 'no', delivery: 'dry', syntax_family: 'verdict_semicolon_clause' },
  { text: 'MAYBE — the wave is free, the lane is not.', verdict: 'maybe' },
  { text: 'YES — for one recall window.', verdict: 'yes', delivery: 'direct' },
  { text: 'VERY DOUBTFUL — the jungler has heard the claim.', verdict: 'very_doubtful', delivery: 'dry' },
  { text: 'OUTLOOK GOOD — the matchup is allowing movement.', verdict: 'outlook_good' },
  { text: 'NO — free ended at champ select.', verdict: 'no', delivery: 'dry' },
]);

addGroup('flash_use', {
  intents: ['explanation', 'evaluation', 'reaction'], domains_any: ['fight_dive_trade_shutdown'], concepts_any: ['flash_use'], delivery: 'dry', league_intensity: 1, min_specificity: 0.3, max_specificity: 1,
}, [
  { text: 'BECAUSE — panic found the key first.', verdict: 'because' },
  { text: 'BECAUSE — the plan needed one more button.', verdict: 'because' },
  { text: 'BECAUSE — walking away lacked drama.', verdict: 'because' },
  { text: 'BECAUSE — the cooldown was apparently lonely.', verdict: 'because' },
  { text: 'BECAUSE — the wall looked negotiable.', verdict: 'because' },
  { text: 'OUTLOOK UNCLEAR — the cursor knows.', verdict: 'outlook_unclear', delivery: 'contextual' },
]);

addGroup('jax_renekton_comparison', {
  intents: ['comparison'], domains_any: ['champion_matchup'], entities_required: ['jax', 'renekton'], concepts_any: ['champion_comparison'], delivery: 'contextual', league_intensity: 2, min_specificity: 0.45, max_specificity: 1, reference_ids: ['renekton'],
}, [
  { text: 'RENEKTON — the Ball respects the brand.', verdict: 'renekton', delivery: 'dry' },
  { text: 'JAX — patience has the better scaling.', verdict: 'jax' },
  { text: 'RENEKTON — win early and refuse discussion.', verdict: 'renekton', delivery: 'dry' },
  { text: 'JAX — if the game plans to age.', verdict: 'jax' },
  { text: 'NEITHER — nostalgia has entered champ select.', verdict: 'neither', delivery: 'dry' },
  { text: 'RENEKTON — the name already voted.', verdict: 'renekton', delivery: 'dry' },
]);

addGroup('build_eval', {
  intents: ['evaluation', 'prediction', 'permission'], domains_any: ['builds_items_runes'], concepts_any: ['build_evaluation', 'build_success', 'build_failure'], delivery: 'contextual', league_intensity: 1, min_specificity: 0.35, max_specificity: 1,
}, [
  { text: 'YES — the build has a real argument.', verdict: 'yes' },
  { text: 'NO — the items are asking the player to apologize.', verdict: 'no', delivery: 'dry' },
  { text: 'MAYBE — one good game will make this look intentional.', verdict: 'maybe', delivery: 'dry' },
  { text: 'OUTLOOK GOOD — the pieces agree.', verdict: 'outlook_good' },
  { text: 'VERY DOUBTFUL — the damage arrives after the game.', verdict: 'very_doubtful' },
  { text: 'YES — ugly can still be correct.', verdict: 'yes', delivery: 'dry' },
  { text: 'NO — this is content-positive and LP-negative.', verdict: 'no', delivery: 'dry' },
  { text: 'MAYBE — the build works if the game cooperates.', verdict: 'maybe' },
  { text: 'YES — the item spike is doing actual work.', verdict: 'yes' },
  { text: 'NO — the theory has outrun the numbers.', verdict: 'no', delivery: 'dry' },
  { text: 'OUTLOOK UNCLEAR — the build has not confessed yet.', verdict: 'outlook_unclear', delivery: 'dry' },
  { text: 'YES — playable is enough.', verdict: 'yes', delivery: 'direct' },
  { text: 'NO — this path requires the opponent’s permission.', verdict: 'no', delivery: 'dry' },
  { text: 'MAYBE — the first fight will expose it.', verdict: 'maybe' },
  { text: 'VERY DOUBTFUL — too many items are waiting to matter.', verdict: 'very_doubtful' },
  { text: 'YES — the build survived contact with reality.', verdict: 'yes', delivery: 'dry' },
  { text: 'NO — the result is carrying the theory.', verdict: 'no', delivery: 'dry' },
]);

addGroup('sro_build_eval', {
  intents: ['evaluation', 'prediction', 'permission'], domains_any: ['builds_items_runes', 'sro'], entities_required: ['sro'], concepts_any: ['build_evaluation', 'build_success', 'build_failure'], delivery: 'dry', league_intensity: 1, sro_intensity: 1, min_specificity: 0.45, max_specificity: 1, reference_ids: ['sro'],
}, [
  { text: 'YES — Mike has enough evidence to become dangerous.', verdict: 'yes' },
  { text: 'NO — Mike is already explaining the next version.', verdict: 'no' },
  { text: 'MAYBE — one win turns this into a weeklong commitment.', verdict: 'maybe' },
  { text: 'OUTLOOK GOOD — unfortunately, the build may encourage him.', verdict: 'outlook_good' },
  { text: 'VERY DOUBTFUL — the theory is ahead of the damage.', verdict: 'very_doubtful' },
  { text: 'YES — the build works; restraint will not follow.', verdict: 'yes', syntax_family: 'verdict_semicolon_clause' },
  { text: 'NO — the items have not earned the speech.', verdict: 'no' },
  { text: 'MAYBE — Mike needs one clean fight before declaring victory.', verdict: 'maybe' },
]);

addGroup('experimental_build', {
  intents: ['evaluation', 'prediction', 'permission'], domains_any: ['builds_items_runes', 'sro'], concepts_any: ['experimental_build'], delivery: 'dry', league_intensity: 1, sro_intensity: 0, min_specificity: 0.4, max_specificity: 1,
}, [
  { text: 'YES — one win and Mike builds it all week.', verdict: 'yes', entities_required: ['sro'], reference_ids: ['sro'], sro_intensity: 1 },
  { text: 'MAYBE — Feedmax remains undefeated in explanation.', verdict: 'maybe' },
  { text: 'NO — the thumbnail is ahead of the build.', verdict: 'no' },
  { text: 'YES — Mike is cooking; the kitchen has no insurance.', verdict: 'yes', entities_required: ['sro'], reference_ids: ['sro'], sro_intensity: 1, syntax_family: 'verdict_semicolon_clause' },
  { text: 'MAYBE — the haters are one win from deletion.', verdict: 'maybe' },
  { text: 'NO — interesting has become a warning label.', verdict: 'no' },
  { text: 'OUTLOOK GOOD — unfortunately, this may reinforce him.', verdict: 'outlook_good', entities_required: ['sro'], reference_ids: ['sro'], sro_intensity: 1 },
  { text: 'YES — the build has earned another bad idea.', verdict: 'yes' },
  { text: 'NO — the experiment found the loss condition.', verdict: 'no' },
  { text: 'MAYBE — one clean game turns theory into propaganda.', verdict: 'maybe' },
  { text: 'YES — Mike has mistaken evidence for permission.', verdict: 'yes', entities_required: ['sro'], reference_ids: ['sro'], sro_intensity: 1 },
  { text: 'NO — Mike is cooking without a fire code.', verdict: 'no', entities_required: ['sro'], reference_ids: ['sro'], sro_intensity: 1 },
  { text: 'MAYBE — Mike needs one win before the lecture begins.', verdict: 'maybe', entities_required: ['sro'], reference_ids: ['sro'], sro_intensity: 1 },
]);

addGroup('rank_climb', {
  intents: ['prediction', 'evaluation', 'reaction', 'nonsense'], domains_any: ['rank_climb'], concepts_any: ['rank_goal_masters', 'rank_goal_challenger', 'rank_streak_goal', 'lp_movement'], delivery: 'contextual', league_intensity: 1, min_specificity: 0.35, max_specificity: 1,
}, [
  { text: 'OUTLOOK GOOD — the climb is still alive.', verdict: 'outlook_good' },
  { text: 'YES — Masters remains within one honest streak.', verdict: 'yes' },
  { text: 'NO — the queue has other plans.', verdict: 'no', delivery: 'dry' },
  { text: 'MAYBE — six wins must arrive before six explanations.', verdict: 'maybe', delivery: 'dry' },
  { text: 'VERY DOUBTFUL — the LP is asking for proof.', verdict: 'very_doubtful', delivery: 'dry' },
  { text: 'YES — the doubters may begin drafting excuses.', verdict: 'yes', delivery: 'dry' },
  { text: 'NOT YET — the streak has not chosen a direction.', verdict: 'not_yet' },
  { text: 'OUTLOOK UNCLEAR — one lobby can move the whole day.', verdict: 'outlook_unclear' },
  { text: 'YES — Challenger remains mathematically impolite.', verdict: 'yes', delivery: 'dry' },
  { text: 'NO — the climb is generating content faster than LP.', verdict: 'no', delivery: 'dry' },
  { text: 'MAYBE — one clean block changes the forecast.', verdict: 'maybe' },
  { text: 'OUTLOOK GOOD — the losses have stopped multiplying.', verdict: 'outlook_good' },
  { text: 'VERY DOUBTFUL — the goal is several teammates away.', verdict: 'very_doubtful', delivery: 'dry' },
  { text: 'YES — the rank can still be bullied upward.', verdict: 'yes', delivery: 'dry' },
]);

addGroup('sro_rank', {
  intents: ['prediction', 'evaluation'], domains_any: ['rank_climb', 'sro'], entities_required: ['sro'], concepts_any: ['rank_goal_masters', 'rank_streak_goal', 'lp_movement'], delivery: 'room_lore', league_intensity: 1, sro_intensity: 1, min_specificity: 0.55, max_specificity: 1, reference_ids: ['sro'],
}, [
  { text: 'YES — Mike can reach Masters before the next new theory.', verdict: 'yes', delivery: 'dry' },
  { text: 'NO — Masters has reviewed the build history.', verdict: 'no', delivery: 'dry' },
  { text: 'MAYBE — six wins before six losses remains legally possible.', verdict: 'maybe', delivery: 'dry' },
  { text: 'OUTLOOK GOOD — the doubters have gone quiet for a reason.', verdict: 'outlook_good', delivery: 'dry' },
  { text: 'VERY DOUBTFUL — the next lobby has read the title.', verdict: 'very_doubtful', delivery: 'dry' },
  { text: 'NOT YET — Mike has more LP to argue with.', verdict: 'not_yet' },
  { text: 'YES — one streak makes the whole day look planned.', verdict: 'yes', delivery: 'dry' },
  { text: 'OUTLOOK UNCLEAR — Masters is close enough to become dangerous.', verdict: 'outlook_unclear' },
]);

addGroup('sro_rank_timing', {
  intents: ['timing'], domains_any: ['rank_climb', 'sro'], entities_required: ['sro'], concepts_any: ['rank_goal_masters', 'rank_goal_challenger', 'rank_streak_goal', 'lp_movement'], delivery: 'contextual', league_intensity: 1, sro_intensity: 1, min_specificity: 0.45, max_specificity: 1, reference_ids: ['sro'],
}, [
  { text: 'SOON — after one clean streak.', verdict: 'soon' },
  { text: 'NOT YET — Mike still owes the ladder wins.', verdict: 'not_yet', delivery: 'direct' },
  { text: 'ASK AGAIN LATER — the next lobby has voting rights.', verdict: 'ask_again_later', delivery: 'dry' },
  { text: 'OUTLOOK UNCLEAR — one queue can move the date.', verdict: 'outlook_unclear' },
  { text: 'SOON — if six wins arrive before six explanations.', verdict: 'soon', delivery: 'dry' },
  { text: 'NOT YET — Masters is visible, not secured.', verdict: 'not_yet', delivery: 'direct' },
]);

addGroup('sro_challenger', {
  intents: ['prediction', 'evaluation'], domains_any: ['rank_climb', 'sro'], entities_required: ['sro'], concepts_any: ['rank_goal_challenger'], delivery: 'contextual', league_intensity: 1, sro_intensity: 1, min_specificity: 0.5, max_specificity: 1, reference_ids: ['sro'],
}, [
  { text: 'YES — Challenger is still on the map.', verdict: 'yes' },
  { text: 'NO — Masters must stop being a negotiation first.', verdict: 'no', delivery: 'dry' },
  { text: 'MAYBE — the distance is measured in clean lobbies.', verdict: 'maybe' },
  { text: 'VERY DOUBTFUL — Challenger does not accept content as LP.', verdict: 'very_doubtful', delivery: 'dry' },
  { text: 'OUTLOOK GOOD — the climb is moving in the right direction.', verdict: 'outlook_good' },
  { text: 'NOT YET — the ladder has another floor.', verdict: 'not_yet', delivery: 'direct' },
  { text: 'YES — but the queue wants several demonstrations.', verdict: 'yes', delivery: 'dry' },
  { text: 'OUTLOOK UNCLEAR — Challenger is a long way from one good day.', verdict: 'outlook_unclear', delivery: 'direct' },
]);

addGroup('matchup', {
  intents: ['evaluation', 'prediction', 'comparison', 'permission'], domains_any: ['champion_matchup', 'player_role_performance'], concepts_any: ['matchup_evaluation', 'counterpick', 'champion_pick', 'scaling_question'], delivery: 'contextual', league_intensity: 2, min_specificity: 0.35, max_specificity: 1,
}, [
  { text: 'YES — the matchup is playable.', verdict: 'yes' },
  { text: 'NO — the lane starts uphill.', verdict: 'no', delivery: 'direct' },
  { text: 'MAYBE — the first three waves decide it.', verdict: 'maybe' },
  { text: 'OUTLOOK GOOD — the champion has the tools.', verdict: 'outlook_good' },
  { text: 'VERY DOUBTFUL — the counterpick is doing its job.', verdict: 'very_doubtful' },
  { text: 'YES — skill can still override the draft.', verdict: 'yes' },
  { text: 'NO — scaling will not arrive on sympathy.', verdict: 'no', delivery: 'dry' },
  { text: 'MAYBE — one item changes the lane.', verdict: 'maybe' },
  { text: 'YES — the pick has an opening.', verdict: 'yes' },
  { text: 'NO — the opponent has chosen violence.', verdict: 'no', delivery: 'dry' },
  { text: 'OUTLOOK UNCLEAR — the matchup turns on spacing.', verdict: 'outlook_unclear' },
  { text: 'MAYBE — the pick is good; the pilot matters more.', verdict: 'maybe', syntax_family: 'verdict_semicolon_clause' },
]);

addGroup('renekton_matchup', {
  intents: ['evaluation', 'prediction', 'comparison', 'permission'], domains_any: ['champion_matchup'], entities_required: ['renekton'], concepts_any: ['matchup_evaluation', 'champion_pick', 'scaling_question'], delivery: 'contextual', league_intensity: 2, sro_intensity: 0, min_specificity: 0.4, max_specificity: 1, reference_ids: ['renekton'],
}, [
  { text: 'YES — Renekton has an opening.', verdict: 'yes' },
  { text: 'NO — the lane does not forgive a slow start.', verdict: 'no' },
  { text: 'MAYBE — fury and spacing decide it.', verdict: 'maybe' },
  { text: 'OUTLOOK GOOD — the early windows are real.', verdict: 'outlook_good' },
  { text: 'VERY DOUBTFUL — the range gap is collecting interest.', verdict: 'very_doubtful', delivery: 'dry' },
  { text: 'YES — one clean trade changes the lane.', verdict: 'yes' },
]);

addGroup('surrender', {
  intents: ['permission', 'evaluation', 'prediction'], domains_any: ['current_game'], concepts_any: ['surrender_question'], delivery: 'direct', league_intensity: 1, min_specificity: 0.35, max_specificity: 1,
}, [
  { text: 'NO — the nexus is still standing.', verdict: 'no' },
  { text: 'YES — this one has become educational.', verdict: 'yes', delivery: 'dry' },
  { text: 'MAYBE — vote after the next fight, not before it.', verdict: 'maybe' },
  { text: 'NO — five more minutes is still information.', verdict: 'no' },
  { text: 'YES — preserve the mental for the next lobby.', verdict: 'yes' },
  { text: 'NOT YET — make them prove it.', verdict: 'not_yet' },
]);

addGroup('queue_one_more', {
  intents: ['permission', 'prediction'], domains_any: ['ordinary_life'], delivery: 'dry', league_intensity: 0, min_specificity: 0.2, max_specificity: 0.65,
}, [
  { text: 'NO — one more is how tomorrow gets involved.', verdict: 'no' },
  { text: 'YES — the next game has not hurt you yet.', verdict: 'yes' },
  { text: 'MAYBE — stop after the first warning sign.', verdict: 'maybe' },
  { text: 'NO — protect the version of you that wants sleep.', verdict: 'no', delivery: 'direct' },
  { text: 'YES — the queue has accepted your sacrifice.', verdict: 'yes' },
  { text: 'MAYBE — one game, no negotiations.', verdict: 'maybe' },
]);

addGroup('proxy_lane', {
  intents: ['permission', 'evaluation', 'prediction'], domains_any: ['lane_wave_state'], concepts_any: ['proxy_lane'], delivery: 'contextual', league_intensity: 2, min_specificity: 0.4, max_specificity: 1,
}, [
  { text: 'YES — proxying is the cleanest bad idea available.', verdict: 'yes', delivery: 'dry' },
  { text: 'NO — the wave is not worth the funeral.', verdict: 'no', delivery: 'dry' },
  { text: 'MAYBE — the escape route decides it.', verdict: 'maybe' },
  { text: 'YES — if the lane has already stopped being normal.', verdict: 'yes' },
]);

addGroup('item_spike', {
  intents: ['evaluation', 'prediction'], domains_any: ['builds_items_runes'], concepts_any: ['item_spike'], delivery: 'contextual', league_intensity: 2, min_specificity: 0.4, max_specificity: 1,
}, [
  { text: 'YES — the item spike is real.', verdict: 'yes' },
  { text: 'NO — the purchase has not become power yet.', verdict: 'no' },
  { text: 'MAYBE — one fight will reveal the spike.', verdict: 'maybe' },
  { text: 'OUTLOOK GOOD — the spike finally matters.', verdict: 'outlook_good', delivery: 'contextual' },
]);

addGroup('int_feed', {
  intents: ['evaluation', 'reaction'], domains_any: ['fight_dive_trade_shutdown', 'player_role_performance'], concepts_any: ['int_feed'], states_any: ['negative_event'], delivery: 'dry', league_intensity: 1, min_specificity: 0.3, max_specificity: 1,
}, [
  { text: 'YES — that is inting with plausible deniability.', verdict: 'yes' },
  { text: 'NO — bad is not the same as intentional.', verdict: 'no', delivery: 'direct' },
  { text: 'MAYBE — the replay knows motive.', verdict: 'maybe' },
  { text: 'OUTLOOK UNCLEAR — intent remains the least reliable stat.', verdict: 'outlook_unclear', delivery: 'dry' },
]);

addGroup('sro_smite', {
  intents: ['evaluation', 'prediction', 'permission'], domains_any: ['objective_macro', 'sro'], entities_required: ['sro'], concepts_any: ['smite_objective'], delivery: 'dry', league_intensity: 2, sro_intensity: 1, min_specificity: 0.55, max_specificity: 1, reference_ids: ['sro'],
}, [
  { text: 'NO — not unless autofill changed the assignment.', verdict: 'no' },
  { text: 'MAYBE — check whether jungle was forced upon him.', verdict: 'maybe' },
  { text: 'YES — only if top lane has been taken away from him.', verdict: 'yes' },
  { text: 'VERY DOUBTFUL — Mike usually delivers judgment, not Smite.', verdict: 'very_doubtful' },
]);

addGroup('sro_nidalee_pick', {
  intents: ['prediction', 'evaluation', 'permission'], domains_any: ['champion_matchup', 'sro'], entities_required: ['sro', 'nidalee'], concepts_any: ['champion_pick'], delivery: 'room_lore', league_intensity: 1, sro_intensity: 1, min_specificity: 0.5, max_specificity: 1, reference_ids: ['sro'],
}, [
  { text: 'NO — the Nidalee request survives another day.', verdict: 'no' },
  { text: 'MAYBE — the pick remains one bad idea away.', verdict: 'maybe' },
  { text: 'YES — the Ball has made a dangerous promise.', verdict: 'yes', delivery: 'dry' },
  { text: 'VERY DOUBTFUL — top lane still has custody.', verdict: 'very_doubtful', delivery: 'dry' },
]);


addGroup('carry_game', {
  intents: ['prediction', 'evaluation'], domains_any: ['current_game', 'player_role_performance'], concepts_any: ['carry_game'], delivery: 'contextual', league_intensity: 1, min_specificity: 0.3, max_specificity: 1,
}, [
  { text: 'YES — one clean fight gives him the game.', verdict: 'yes' },
  { text: 'NO — the load is heavier than the lead.', verdict: 'no', delivery: 'dry' },
  { text: 'MAYBE — the hands are ready; the map is not.', verdict: 'maybe', delivery: 'dry', syntax_family: 'verdict_semicolon_clause' },
  { text: 'OUTLOOK GOOD — the win condition still has a player.', verdict: 'outlook_good' },
  { text: 'VERY DOUBTFUL — four passengers have become cargo.', verdict: 'very_doubtful', delivery: 'dry' },
  { text: 'YES — the 1v9 paperwork is almost complete.', verdict: 'yes', delivery: 'dry' },
  { text: 'NO — carrying requires something left to carry.', verdict: 'no', delivery: 'direct' },
  { text: 'MAYBE — one shutdown changes the weight.', verdict: 'maybe' },
]);

addGroup('smite_objective_general', {
  intents: ['evaluation', 'prediction', 'permission'], domains_any: ['objective_macro'], concepts_any: ['smite_objective'], delivery: 'contextual', league_intensity: 2, min_specificity: 0.35, max_specificity: 1,
}, [
  { text: 'YES — Smite settled the argument.', verdict: 'yes' },
  { text: 'NO — the objective survived the summoner spell.', verdict: 'no', delivery: 'dry' },
  { text: 'MAYBE — the health bar and Smite disagreed.', verdict: 'maybe' },
  { text: 'OUTLOOK UNCLEAR — the replay owns the verdict.', verdict: 'outlook_unclear' },
  { text: 'VERY DOUBTFUL — the Smite arrived after the obituary.', verdict: 'very_doubtful', delivery: 'dry' },
  { text: 'YES — barely, which is still secure.', verdict: 'yes', delivery: 'dry' },
]);

addGroup('baron_flip', {
  intents: ['evaluation', 'prediction', 'permission'], domains_any: ['objective_macro'], entities_required: ['baron'], concepts_any: ['objective_flip'], delivery: 'contextual', league_intensity: 2, min_specificity: 0.4, max_specificity: 1,
}, [
  { text: 'NO — flipping Baron is surrender with extra steps.', verdict: 'no', delivery: 'dry' },
  { text: 'MAYBE — the coin has ten players attached.', verdict: 'maybe', delivery: 'dry' },
  { text: 'YES — if certainty has already left the lobby.', verdict: 'yes', delivery: 'dry' },
  { text: 'VERY DOUBTFUL — Baron has become a casino.', verdict: 'very_doubtful', delivery: 'dry' },
  { text: 'OUTLOOK UNCLEAR — one Smite owns the prophecy.', verdict: 'outlook_unclear' },
]);

addGroup('item_scaling', {
  intents: ['evaluation', 'prediction'], domains_any: ['builds_items_runes'], concepts_any: ['item_scaling'], delivery: 'contextual', league_intensity: 1, min_specificity: 0.3, max_specificity: 1,
}, [
  { text: 'YES — the item gets better than the purchase looks.', verdict: 'yes' },
  { text: 'NO — the scaling ends before the game does.', verdict: 'no', delivery: 'dry' },
  { text: 'MAYBE — one breakpoint makes the answer honest.', verdict: 'maybe' },
  { text: 'OUTLOOK GOOD — the later fights favor the item.', verdict: 'outlook_good' },
  { text: 'VERY DOUBTFUL — the item is waiting for a game that will not arrive.', verdict: 'very_doubtful', delivery: 'dry' },
  { text: 'YES — but the spike has an appointment.', verdict: 'yes', delivery: 'dry' },
]);

addGroup('lane_over', {
  intents: ['evaluation', 'prediction'], domains_any: ['lane_wave_state'], concepts_any: ['lane_over'], delivery: 'contextual', league_intensity: 1, min_specificity: 0.3, max_specificity: 1,
}, [
  { text: 'YES — the lane belongs to someone else now.', verdict: 'yes' },
  { text: 'NO — behind is not the same as over.', verdict: 'no', delivery: 'direct' },
  { text: 'MAYBE — one wave can still reopen it.', verdict: 'maybe' },
  { text: 'VERY DOUBTFUL — walking up has become a hearing.', verdict: 'very_doubtful', delivery: 'dry' },
  { text: 'OUTLOOK UNCLEAR — the next recall decides custody.', verdict: 'outlook_unclear', delivery: 'dry' },
  { text: 'NOT YET — the tower has not signed the papers.', verdict: 'not_yet', delivery: 'dry' },
]);

addGroup('wave_lost', {
  intents: ['evaluation', 'reaction'], domains_any: ['lane_wave_state'], concepts_any: ['wave_lost'], delivery: 'contextual', league_intensity: 1, min_specificity: 0.3, max_specificity: 1,
}, [
  { text: 'YES — that wave has left the economy.', verdict: 'yes', delivery: 'dry' },
  { text: 'NO — the next wave can still repair it.', verdict: 'no' },
  { text: 'MAYBE — the XP matters more than the gold.', verdict: 'maybe' },
  { text: 'VERY DOUBTFUL — those minions are no longer family.', verdict: 'very_doubtful', delivery: 'dry' },
  { text: 'OUTLOOK UNCLEAR — catch the next one before mourning.', verdict: 'outlook_unclear', delivery: 'dry' },
  { text: 'YES — the wave is gone; the lane remains appealable.', verdict: 'yes', delivery: 'dry', syntax_family: 'verdict_semicolon_clause' },
]);

addGroup('availability_question', {
  intents: ['evaluation', 'prediction'], domains_any: ['ordinary_life'], concepts_any: ['availability_question'], delivery: 'direct', min_specificity: 0.25, max_specificity: 1,
}, [
  { text: 'YES — the schedule appears merciful.', verdict: 'yes' },
  { text: 'NO — tomorrow already has plans.', verdict: 'no', delivery: 'dry' },
  { text: 'MAYBE — one obligation is still hiding.', verdict: 'maybe' },
  { text: 'OUTLOOK GOOD — the calendar has room.', verdict: 'outlook_good' },
  { text: 'VERY DOUBTFUL — free time has been counterpicked.', verdict: 'very_doubtful', delivery: 'dry' },
  { text: 'ASK AGAIN LATER — the schedule is still moving.', verdict: 'ask_again_later' },
]);

addGroup('structure_building', {
  intents: ['permission', 'evaluation', 'prediction'], domains_any: ['ordinary_life'], concepts_any: ['structure_building'], delivery: 'direct', min_specificity: 0.3, max_specificity: 1,
}, [
  { text: 'YES — the foundation has a real argument.', verdict: 'yes' },
  { text: 'NO — measure again before creating a landmark.', verdict: 'no', delivery: 'dry' },
  { text: 'MAYBE — the plan needs one adult with a level.', verdict: 'maybe', delivery: 'dry' },
  { text: 'OUTLOOK GOOD — the structure may outlive the confidence.', verdict: 'outlook_good', delivery: 'dry' },
  { text: 'VERY DOUBTFUL — the lumber has concerns.', verdict: 'very_doubtful', delivery: 'dry' },
  { text: 'YES — but the Ball refuses inspection duty.', verdict: 'yes', delivery: 'dry' },
]);

addGroup('recipe_scaling', {
  intents: ['permission', 'evaluation'], domains_any: ['food_health_outside'], concepts_any: ['recipe_scaling'], delivery: 'direct', min_specificity: 0.25, max_specificity: 1,
}, [
  { text: 'YES — scale the ingredients, not the confidence.', verdict: 'yes', delivery: 'dry' },
  { text: 'NO — baking has already filed an objection.', verdict: 'no', delivery: 'dry' },
  { text: 'MAYBE — the ratios survive if the pan does.', verdict: 'maybe' },
  { text: 'OUTLOOK GOOD — double carefully and taste once.', verdict: 'outlook_good' },
  { text: 'VERY DOUBTFUL — the recipe is load-bearing.', verdict: 'very_doubtful', delivery: 'dry' },
  { text: 'YES — arithmetic may enter the kitchen.', verdict: 'yes', delivery: 'dry' },
]);

addGroup('counterpick', {
  intents: ['evaluation', 'prediction'], domains_any: ['champion_matchup', 'sro'], concepts_any: ['counterpick'], delivery: 'contextual', league_intensity: 1, min_specificity: 0.35, max_specificity: 1,
}, [
  { text: 'YES — the draft found its own enemy.', verdict: 'yes', delivery: 'dry' },
  { text: 'NO — uncomfortable is not a counterpick.', verdict: 'no', delivery: 'direct' },
  { text: 'MAYBE — the matchup is bad; the hands still vote.', verdict: 'maybe', delivery: 'dry', syntax_family: 'verdict_semicolon_clause' },
  { text: 'OUTLOOK UNCLEAR — the pick and plan disagree.', verdict: 'outlook_unclear' },
  { text: 'VERY DOUBTFUL — champ select has submitted evidence.', verdict: 'very_doubtful', delivery: 'dry' },
  { text: 'YES — he drafted the explanation first.', verdict: 'yes', delivery: 'dry' },
]);

addGroup('weather_question', {
  intents: ['prediction', 'evaluation'], domains_any: ['food_health_outside'], concepts_any: ['weather_question'], delivery: 'classic', min_specificity: 0.25, max_specificity: 1,
}, [
  { text: 'OUTLOOK GOOD — the sky appears cooperative.', verdict: 'outlook_good' },
  { text: 'OUTLOOK UNCLEAR — the clouds have not committed.', verdict: 'outlook_unclear' },
  { text: 'YES — bring a jacket anyway.', verdict: 'yes', delivery: 'dry' },
  { text: 'NO — the forecast has chosen restraint.', verdict: 'no' },
  { text: 'MAYBE — the weather is still negotiating.', verdict: 'maybe', delivery: 'dry' },
  { text: 'ASK AGAIN LATER — the sky changes its answer hourly.', verdict: 'ask_again_later', delivery: 'dry' },
]);

addGroup('food_decision', {
  intents: ['permission', 'evaluation'], domains_any: ['food_health_outside'], concepts_any: ['food_decision'], delivery: 'direct', min_specificity: 0.25, max_specificity: 1,
}, [
  { text: 'YES — eat before judgment gets louder.', verdict: 'yes' },
  { text: 'NO — ordering again is not a meal plan.', verdict: 'no', delivery: 'dry' },
  { text: 'MAYBE — cook something that survives one pan.', verdict: 'maybe', delivery: 'dry' },
  { text: 'YES — dinner is the obvious win condition.', verdict: 'yes', delivery: 'dry' },
  { text: 'NO — hunger is currently drafting the idea.', verdict: 'no', delivery: 'dry' },
  { text: 'MAYBE — choose food before choosing difficulty.', verdict: 'maybe' },
]);

addGroup('groceries_task', {
  intents: ['permission', 'evaluation'], domains_any: ['food_health_outside', 'ordinary_life'], concepts_any: ['groceries_task'], delivery: 'dry', min_specificity: 0.25, max_specificity: 1,
}, [
  { text: 'YES — carry them before asking the Ball to lift.', verdict: 'yes' },
  { text: 'NO — make two trips; pride is not a handle.', verdict: 'no', syntax_family: 'verdict_semicolon_clause' },
  { text: 'MAYBE — one bag is a decision, six is a warning.', verdict: 'maybe' },
  { text: 'YES — the groceries have already won.', verdict: 'yes' },
]);

addGroup('job_decision', {
  intents: ['permission', 'prediction', 'evaluation'], domains_any: ['work_money'], concepts_any: ['job_decision'], delivery: 'direct', min_specificity: 0.25, max_specificity: 1,
}, [
  { text: 'NO — do not quit on the worst hour.', verdict: 'no' },
  { text: 'MAYBE — leave when the plan is stronger than the frustration.', verdict: 'maybe' },
  { text: 'YES — the job has already answered for you.', verdict: 'yes' },
  { text: 'NOT YET — secure the next step first.', verdict: 'not_yet' },
  { text: 'OUTLOOK GOOD — a cleaner exit is available.', verdict: 'outlook_good' },
  { text: 'NO — anger is not severance pay.', verdict: 'no', delivery: 'dry' },
]);

addGroup('purchase_decision', {
  intents: ['permission', 'evaluation'], domains_any: ['work_money'], concepts_any: ['purchase_decision', 'worth_literal'], delivery: 'direct', min_specificity: 0.25, max_specificity: 1,
}, [
  { text: 'YES — the money has a purpose; use it.', verdict: 'yes', syntax_family: 'verdict_semicolon_clause' },
  { text: 'NO — buying it will not become research.', verdict: 'no', delivery: 'dry' },
  { text: 'MAYBE — worth it only if tomorrow agrees.', verdict: 'maybe' },
  { text: 'YES — useful beats impressive.', verdict: 'yes' },
  { text: 'NO — desire has overstated the utility.', verdict: 'no', delivery: 'dry' },
  { text: 'MAYBE — wait until the price stops feeling urgent.', verdict: 'maybe' },
]);

addGroup('social_message', {
  intents: ['permission', 'prediction', 'evaluation'], domains_any: ['relationships_social'], concepts_any: ['social_message'], delivery: 'direct', min_specificity: 0.25, max_specificity: 1,
}, [
  { text: 'YES — send the text; stop editing courage out of it.', verdict: 'yes', syntax_family: 'verdict_semicolon_clause' },
  { text: 'NO — silence is doing useful work.', verdict: 'no' },
  { text: 'MAYBE — say less than your anxiety drafted.', verdict: 'maybe', delivery: 'dry' },
  { text: 'YES — clarity beats another hour of guessing.', verdict: 'yes' },
  { text: 'NO — do not turn uncertainty into a paragraph.', verdict: 'no' },
  { text: 'MAYBE — wait until the message sounds like you.', verdict: 'maybe' },
  { text: 'YES — one honest sentence is enough.', verdict: 'yes' },
  { text: 'NO — the Ball has seen this double text before.', verdict: 'no', delivery: 'dry' },
]);

addGroup('personal_cooked', {
  intents: ['evaluation', 'reaction'], domains_any: ['ordinary_life'], concepts_any: ['personal_cooked'], delivery: 'dry', min_specificity: 0.1, max_specificity: 1,
}, [
  { text: 'NO — inconvenienced is not cooked.', verdict: 'no' },
  { text: 'MAYBE — there is smoke, but no obituary.', verdict: 'maybe', delivery: 'dry' },
  { text: 'YES — but recovery remains annoyingly possible.', verdict: 'yes' },
  { text: 'OUTLOOK UNCLEAR — check again after sleep.', verdict: 'outlook_unclear' },
  { text: 'NO — the Ball has seen worse positioning.', verdict: 'no' },
  { text: 'MAYBE — lightly seared.', verdict: 'maybe' },
]);

addGroup('relationships', {
  intents: ['permission', 'prediction', 'evaluation'], domains_any: ['relationships_social'], delivery: 'direct', min_specificity: 0.15, max_specificity: 0.85,
}, [
  { text: 'YES — honesty has the better matchup.', verdict: 'yes', delivery: 'dry' },
  { text: 'NO — attention is not the same as intention.', verdict: 'no' },
  { text: 'MAYBE — let consistency answer before chemistry does.', verdict: 'maybe' },
  { text: 'OUTLOOK GOOD — the connection appears mutual.', verdict: 'outlook_good' },
  { text: 'VERY DOUBTFUL — one person is carrying the entire forecast.', verdict: 'very_doubtful', delivery: 'dry' },
  { text: 'NOT YET — the situation needs fewer guesses.', verdict: 'not_yet' },
  { text: 'YES — but keep your dignity in the starting lineup.', verdict: 'yes', delivery: 'dry' },
  { text: 'NO — the mixed signal is still a signal.', verdict: 'no', delivery: 'dry' },
]);

addGroup('work_money', {
  intents: ['permission', 'prediction', 'evaluation'], domains_any: ['work_money'], delivery: 'direct', min_specificity: 0.15, max_specificity: 0.9,
}, [
  { text: 'YES — the practical case is stronger than the fear.', verdict: 'yes' },
  { text: 'NO — the numbers are not being dramatic.', verdict: 'no', delivery: 'dry' },
  { text: 'MAYBE — wait until urgency stops setting the price.', verdict: 'maybe' },
  { text: 'OUTLOOK GOOD — the plan can survive daylight.', verdict: 'outlook_good' },
  { text: 'VERY DOUBTFUL — hope is doing unpaid accounting.', verdict: 'very_doubtful', delivery: 'dry' },
  { text: 'NOT YET — preserve the option before spending it.', verdict: 'not_yet' },
]);

addGroup('food_outside', {
  intents: ['permission', 'prediction', 'evaluation'], domains_any: ['food_health_outside'], delivery: 'direct', min_specificity: 0.1, max_specificity: 0.8,
}, [
  { text: 'YES — handle the obvious need first.', verdict: 'yes' },
  { text: 'NO — your current condition is answering too loudly.', verdict: 'no', delivery: 'dry' },
  { text: 'MAYBE — step outside and ask again.', verdict: 'maybe' },
  { text: 'YES — the practical answer wins.', verdict: 'yes', delivery: 'direct' },
  { text: 'NO — rest has the stronger claim.', verdict: 'no' },
  { text: 'OUTLOOK GOOD — the outside world appears survivable.', verdict: 'outlook_good', delivery: 'dry' },
]);

addGroup('bot_status', {
  intents: ['identity', 'evaluation'], domains_any: ['stream_chat_moderation'], concepts_any: ['bot_status'], delivery: 'direct', min_specificity: 0.35, max_specificity: 1,
}, [
  { text: 'NO — the Ball is an object with excellent timing.', verdict: 'direct_identity', delivery: 'dry' },
  { text: 'YES — it works; that is all the personality you get.', verdict: 'direct_identity', syntax_family: 'verdict_semicolon_clause' },
  { text: 'NO — the Ball does not have feelings to hurt.', verdict: 'direct_identity' },
  { text: 'OUTLOOK UNCLEAR — ask a better object.', verdict: 'unclear', delivery: 'dry' },
]);

addGroup('creator_origin', {
  intents: ['identity'], domains_any: ['stream_chat_moderation'], concepts_any: ['creator_origin'], delivery: 'direct', min_specificity: 0.4, max_specificity: 1, reference_ids: ['bones'],
}, [
  { text: 'Bones built the command; the Ball supplies the verdict.', verdict: 'direct_identity', syntax_family: 'direct_semicolon_clause' },
  { text: 'Bones wrote the machinery. The omen is older.', verdict: 'direct_identity', syntax_family: 'direct_two_sentence' },
  { text: 'Nightbot carries the message; Bones built the route.', verdict: 'direct_identity', syntax_family: 'direct_semicolon_clause' },
  { text: 'Created by Bones; blamed on chat.', verdict: 'direct_identity', delivery: 'dry', syntax_family: 'direct_semicolon_clause' },
]);

addGroup('mtf_nidalee', {
  intents: ['prediction', 'evaluation', 'reaction', 'explanation', 'identity'], domains_any: ['room_lore', 'stream_chat_moderation'], entities_required: ['mtf'], delivery: 'room_lore', league_intensity: 0, sro_intensity: 2, min_specificity: 0.5, max_specificity: 1, reference_ids: ['mtf'],
}, [
  { text: 'YES — the Nidalee request is already in motion.', verdict: 'yes' },
  { text: 'OUTLOOK GOOD — persistence has outscaled refusal.', verdict: 'outlook_good', delivery: 'dry' },
  { text: 'VERY DOUBTFUL — silence has never been the build.', verdict: 'very_doubtful', delivery: 'dry' },
  { text: 'YES — MTF has discovered another opportunity to ask.', verdict: 'yes', delivery: 'dry' },
  { text: 'MAYBE — the request is waiting for one quiet moment.', verdict: 'maybe' },
  { text: 'NO — not today; the request will survive.', verdict: 'no', syntax_family: 'verdict_semicolon_clause' },
]);

addGroup('mtf_safe', {
  intents: ['evaluation', 'identity', 'location', 'reaction', 'explanation'], domains_any: ['room_lore', 'stream_chat_moderation'], entities_required: ['mtf'], delivery: 'direct', league_intensity: 0, sro_intensity: 1, min_specificity: 0.35, max_specificity: 1, reference_ids: ['mtf'],
}, [
  { text: 'YES — painfully British. You can hear the extra letters.', verdict: 'yes', delivery: 'dry' },
  { text: 'YES — even his Nidalee requests require a licence.', verdict: 'yes', delivery: 'room_lore' },
  { text: 'OUTLOOK GOOD — the unnecessary vowels are mounting.', verdict: 'outlook_good', delivery: 'dry' },
  { text: 'THE SIGNS SAY YES — chat has already notified the Crown.', verdict: 'yes', delivery: 'room_lore' },
  { text: 'YES — the accent survived compression.', verdict: 'yes', delivery: 'dry' },
  { text: 'MAYBE — ask him to pronounce aluminum.', verdict: 'maybe', delivery: 'dry' },
  { text: 'YES — geographically and, somehow, competitively.', verdict: 'yes', delivery: 'dry' },
  { text: 'WITHOUT A DOUBT — the queue has become a proper queue.', verdict: 'yes', delivery: 'room_lore' },
]);

addGroup('john_west', {
  intents: ['prediction', 'evaluation', 'location', 'reaction'], domains_any: ['room_lore', 'stream_chat_moderation', 'player_role_performance'], entities_required: ['john_west_gamer'], delivery: 'room_lore', sro_intensity: 0, min_specificity: 0.45, max_specificity: 1, reference_ids: ['john_west_gamer'],
}, [
  { text: 'YES — John West has retained directional control.', verdict: 'yes', delivery: 'dry' },
  { text: 'MAYBE — John East has filed a competing claim.', verdict: 'maybe', delivery: 'dry' },
  { text: 'NO — geography has not improved the gameplay.', verdict: 'no', delivery: 'dry' },
  { text: 'OUTLOOK UNCLEAR — John West is still disputing the map.', verdict: 'outlook_unclear', delivery: 'dry' },
]);

addGroup('john_direction_choice', {
  intents: ['comparison'], domains_any: ['room_lore'], concepts_any: ['john_direction_choice'], delivery: 'room_lore', sro_intensity: 0, min_specificity: 0.45, max_specificity: 1, reference_ids: ['john_west_gamer'],
}, [
  { text: 'JOHN EAST — West has coasted on geography long enough.', verdict: 'first', delivery: 'dry' },
  { text: 'JOHN WEST — the incumbent retains directional control.', verdict: 'second', delivery: 'dry' },
  { text: 'JOHN EAST — fresh cardinal direction, same legal exposure.', verdict: 'first', delivery: 'room_lore' },
  { text: 'JOHN WEST — experience beats compass innovation.', verdict: 'second', delivery: 'dry' },
  { text: 'JOHN EAST — the rebrand has cleared inspection.', verdict: 'first', delivery: 'room_lore' },
  { text: 'JOHN WEST — East remains an unlicensed expansion.', verdict: 'second', delivery: 'room_lore' },
]);

addGroup('sro_future_performance', {
  intents: ['prediction'], domains_any: ['sro', 'rank_climb'], concepts_any: ['sro_future_performance'], entities_required: ['sro'], delivery: 'room_lore', league_intensity: 2, sro_intensity: 1, min_specificity: 0.45, max_specificity: 1, reference_ids: ['sro'],
}, [
  { text: 'OUTLOOK GOOD — lane wins early; matchmaking files an appeal.', verdict: 'outlook_good', delivery: 'dry' },
  { text: 'YES — tomorrow has strong LP and weak emotional regulation.', verdict: 'yes', delivery: 'room_lore' },
  { text: 'MAYBE — top lane cooperates, the other four remain unsupervised.', verdict: 'maybe', delivery: 'dry' },
  { text: 'THE SIGNS SAY YES — at least until the first experimental item.', verdict: 'yes', delivery: 'room_lore' },
  { text: 'OUTLOOK UNCLEAR — SRO is ready; solo queue has retained counsel.', verdict: 'outlook_unclear', delivery: 'dry' },
  { text: 'LIKELY — clean lane, suspicious midgame, content secured.', verdict: 'likely', delivery: 'room_lore' },
  { text: 'VERY DOUBTFUL — not of SRO, of the four strangers assigned to him.', verdict: 'very_doubtful', delivery: 'dry' },
  { text: 'YES — the climb continues by force or by thumbnail.', verdict: 'yes', delivery: 'room_lore' },
]);

addGroup('gamba_outcome', {
  intents: ['comparison', 'prediction', 'evaluation'], domains_any: ['room_doubters_believers'], concepts_any: ['gamba_outcome'], delivery: 'room_lore', league_intensity: 0, sro_intensity: 0, min_specificity: 0.35, max_specificity: 1,
}, [
  { text: 'WIN — the believers escape taxation this time.', verdict: 'first', delivery: 'room_lore' },
  { text: 'LOSS — channel points are returning to their natural predator.', verdict: 'second', delivery: 'dry' },
  { text: 'WIN — ugly money remains legal tender.', verdict: 'first', delivery: 'dry' },
  { text: 'LOSS — the payout screen has begun avoiding eye contact.', verdict: 'second', delivery: 'dry' },
  { text: 'WIN — doubt has once again failed as a financial strategy.', verdict: 'first', delivery: 'room_lore' },
  { text: 'LOSS — the doubters may approach the window in an orderly fashion.', verdict: 'second', delivery: 'room_lore' },
]);

addGroup('teamplay_mod', {
  intents: ['prediction', 'evaluation', 'permission'], domains_any: ['stream_chat_moderation', 'room_lore'], entities_required: ['teamplay'], delivery: 'room_lore', sro_intensity: 0, min_specificity: 0.45, max_specificity: 1, reference_ids: ['teamplay'],
}, [
  { text: 'MAYBE — moderators prefer evidence.', verdict: 'maybe', delivery: 'direct' },
  { text: 'NO — Teamplay has not ruled yet.', verdict: 'no' },
  { text: 'YES — but only if you keep volunteering.', verdict: 'yes', delivery: 'dry' },
  { text: 'OUTLOOK UNCLEAR — behave briefly and test the theory.', verdict: 'outlook_unclear', delivery: 'dry' },
]);

addGroup('misanthrope', {
  intents: ['location'], domains_any: ['stream_chat_moderation', 'room_lore'], entities_required: ['misanthrope'], delivery: 'room_lore', sro_intensity: 0, min_specificity: 0.4, max_specificity: 1, reference_ids: ['misanthrope'],
}, [
  { text: 'NEARBY — Misanthrope rarely misses the next line.', verdict: 'direct_location', delivery: 'dry' },
  { text: 'SOMEWHERE IN CHAT — the next message will narrow it.', verdict: 'direct_location', delivery: 'direct' },
  { text: 'INCOMING — another message is already warming up.', verdict: 'direct_location', delivery: 'dry' },
  { text: 'CLOSE — silence would be the real plot twist.', verdict: 'direct_location', delivery: 'dry' },
  { text: 'ELSEWHERE — Misanthrope is between messages.', verdict: 'direct_location', delivery: 'dry' },
  { text: 'ASK AGAIN LATER — the next line will locate him.', verdict: 'ask_again_later' },
]);

addGroup('misanthrope_problem', {
  intents: ['evaluation'], domains_any: ['stream_chat_moderation', 'room_lore'], entities_required: ['misanthrope'], concepts_any: ['person_problem'], delivery: 'room_lore', sro_intensity: 0, min_specificity: 0.4, max_specificity: 1, reference_ids: ['misanthrope'],
}, [
  { text: 'YES — Misanthrope remains load-bearing degeneracy.', verdict: 'yes', delivery: 'dry' },
  { text: 'NO — a problem can usually be removed.', verdict: 'no', delivery: 'dry' },
  { text: 'YES — but by now it qualifies as room infrastructure.', verdict: 'yes', delivery: 'room_lore' },
  { text: 'OUTLOOK UNCLEAR — the problem has posting privileges.', verdict: 'outlook_unclear', delivery: 'dry' },
  { text: 'WITHOUT A DOUBT — silence would be more suspicious.', verdict: 'yes', delivery: 'room_lore' },
  { text: 'MAYBE — ask again after his next completely normal message.', verdict: 'maybe', delivery: 'dry' },
]);

addGroup('person_appearance', {
  intents: ['evaluation'], domains_any: ['general_oracle'], concepts_any: ['person_appearance'], delivery: 'direct', sro_intensity: 0, league_intensity: 0, min_specificity: 0.2, max_specificity: 1,
}, [
  { text: 'YES — suspiciously so.', verdict: 'yes', delivery: 'dry' },
  { text: 'OUTLOOK GOOD — the face card has cleared.', verdict: 'outlook_good', delivery: 'direct' },
  { text: 'YES — the mirror has withdrawn its objection.', verdict: 'yes', delivery: 'dry' },
  { text: 'MAYBE — excellent lighting remains undefeated.', verdict: 'maybe', delivery: 'dry' },
  { text: 'NO — aura cannot carry the full balance.', verdict: 'no', delivery: 'dry' },
  { text: 'THE SIGNS SAY YES — measurements were deemed unnecessary.', verdict: 'yes', delivery: 'direct' },
]);

addGroup('plumbing_lore', {
  intents: ['identity', 'prediction', 'evaluation', 'permission'], domains_any: ['room_lore', 'work_money', 'sro'], concepts_any: ['plumbing_topic'], delivery: 'room_lore', sro_intensity: 2, min_specificity: 0.45, max_specificity: 1, reference_ids: ['plumbing'],
}, [
  { text: 'YES — the pipes remain the most stable lane.', verdict: 'yes', delivery: 'dry' },
  { text: 'NO — the drain has better flow than this plan.', verdict: 'no', delivery: 'dry' },
  { text: 'MAYBE — call a plumber before calling it macro.', verdict: 'maybe', delivery: 'dry' },
  { text: 'OUTLOOK GOOD — the business model has actual pressure.', verdict: 'outlook_good', delivery: 'dry' },
]);

addGroup('bitcoin_lore', {
  intents: ['prediction', 'evaluation', 'permission'], domains_any: ['room_lore', 'work_money', 'sro'], concepts_any: ['bitcoin_topic'], delivery: 'room_lore', sro_intensity: 2, min_specificity: 0.45, max_specificity: 1, reference_ids: ['bitcoin'],
}, [
  { text: 'MAYBE — the Ball predicts volatility and refuses the invoice.', verdict: 'maybe', delivery: 'dry' },
  { text: 'NO — conviction is not a price target.', verdict: 'no', delivery: 'direct' },
  { text: 'YES — but conviction is not due diligence.', verdict: 'yes', delivery: 'dry', entities_required: ['sro'], reference_ids: ['bitcoin', 'sro'] },
  { text: 'OUTLOOK UNCLEAR — the candle has not consulted the Ball.', verdict: 'outlook_unclear', delivery: 'dry' },
  { text: 'NO — Mike already owns enough conviction.', verdict: 'no', delivery: 'dry', entities_required: ['sro'], reference_ids: ['bitcoin', 'sro'] },
  { text: 'MAYBE — Mike will buy the argument before the coin.', verdict: 'maybe', delivery: 'dry', entities_required: ['sro'], reference_ids: ['bitcoin', 'sro'] },
  { text: 'YES — if Mike treats the dip like a matchup.', verdict: 'yes', delivery: 'dry', entities_required: ['sro'], reference_ids: ['bitcoin', 'sro'] },
]);

addGroup('jokic_lore', {
  intents: ['prediction', 'evaluation', 'identity'], domains_any: ['room_lore', 'ordinary_life'], concepts_any: ['jokic_topic'], delivery: 'room_lore', sro_intensity: 2, min_specificity: 0.45, max_specificity: 1, reference_ids: ['jokic'],
}, [
  { text: 'YES — the merch has better court vision than chat.', verdict: 'yes', delivery: 'dry' },
  { text: 'NO — the Ball will not invent a photograph.', verdict: 'no', delivery: 'direct' },
  { text: 'MAYBE — the crossover remains stronger than the evidence.', verdict: 'maybe' },
  { text: 'OUTLOOK GOOD — Jokic has already improved the lore.', verdict: 'outlook_good', delivery: 'dry' },
]);

addGroup('old_jax_lore', {
  intents: ['evaluation', 'identity', 'reaction', 'prediction'], domains_any: ['room_lore', 'builds_items_runes', 'sro'], concepts_any: ['old_six_nashors_jax'], delivery: 'room_lore', league_intensity: 1, sro_intensity: 2, min_specificity: 0.55, max_specificity: 1, reference_ids: ['old_six_nashors_jax'],
}, [
  { text: 'YES — six Nashor’s remain undefeated in memory.', verdict: 'yes', delivery: 'dry' },
  { text: 'NO — nostalgia is carrying the build.', verdict: 'no', delivery: 'dry' },
  { text: 'MAYBE — old YouTube Mike would upload the evidence.', verdict: 'maybe', delivery: 'dry', entities_required: ['sro'], reference_ids: ['old_six_nashors_jax', 'sro'] },
  { text: 'YES — the build returns whenever judgment gets comfortable.', verdict: 'yes', delivery: 'dry' },
  { text: 'MAYBE — six Nashor’s still scale with nostalgia.', verdict: 'maybe', delivery: 'dry' },
  { text: 'OUTLOOK GOOD — memory has already sold the build.', verdict: 'outlook_good', delivery: 'dry' },
]);

addGroup('doubters_lore', {
  intents: ['prediction', 'evaluation', 'reaction', 'comparison', 'permission'], domains_any: ['room_lore', 'rank_climb', 'sro'], concepts_any: ['room_doubters_believers'], delivery: 'room_lore', league_intensity: 1, sro_intensity: 1, min_specificity: 0.35, max_specificity: 1, reference_ids: ['doubters_believers'],
}, [
  { text: 'NO — the doubters are early, as tradition requires.', verdict: 'no', delivery: 'dry' },
  { text: 'YES — for now, which is their favorite timeframe.', verdict: 'yes', delivery: 'dry' },
  { text: 'MAYBE — believers still have one fight.', verdict: 'maybe' },
  { text: 'OUTLOOK GOOD — the doubters have stopped typing.', verdict: 'outlook_good', delivery: 'dry' },
  { text: 'VERY DOUBTFUL — belief has reached the evidence-free phase.', verdict: 'very_doubtful', delivery: 'dry' },
  { text: 'YES — someone will delete the prediction history.', verdict: 'yes', delivery: 'dry' },
]);


addGroup('gold_reset_cope', {
  intents: ['reaction', 'evaluation', 'prediction'], domains_any: ['fight_dive_trade_shutdown', 'current_game'], concepts_any: ['gold_reset_cope'], delivery: 'dry', league_intensity: 1, min_specificity: 0.2, max_specificity: 1,
}, [
  { text: 'Calculated. The bounty simply changed managers.', verdict: 'unclear' },
  { text: 'Good reset. The enemy owns the gold now.', verdict: 'no' },
  { text: 'The economy has accepted the explanation.', verdict: 'maybe' },
  { text: 'Worth, provided winning was never the objective.', verdict: 'no' },
  { text: 'The gold reset. The problem did not.', verdict: 'not_yet' },
  { text: 'Yes. That is what the death will be called.', verdict: 'yes' },
]);

addGroup('mock_diff', {
  intents: ['reaction', 'evaluation'], domains_any: ['player_role_performance', 'current_game'], concepts_any: ['mock_diff'], delivery: 'dry', league_intensity: 1, min_specificity: 0.15, max_specificity: 1,
}, [
  { text: 'Mana diff. Case closed.', verdict: 'direct_reaction' },
  { text: 'The bar was blue. The decision was not.', verdict: 'no' },
  { text: 'Diagnosis accepted. Treatment unavailable.', verdict: 'unclear' },
  { text: 'One resource was managed. It was not judgment.', verdict: 'no' },
  { text: 'Diff confirmed. Category remains negotiable.', verdict: 'maybe' },
  { text: 'The scoreboard will list it as something else.', verdict: 'unclear' },
]);

addGroup('wave_clear_jab', {
  intents: ['reaction', 'evaluation'], domains_any: ['lane_wave_state'], concepts_any: ['wave_clear_jab'], delivery: 'dry', league_intensity: 1, min_specificity: 0.15, max_specificity: 1,
}, [
  { text: 'The wave survived the attempt.', verdict: 'no' },
  { text: 'NA wave clear has entered the evidence.', verdict: 'direct_reaction' },
  { text: 'Three spells. Six healthy minions.', verdict: 'no' },
  { text: 'The caster minions are filing for tenure.', verdict: 'unclear' },
  { text: 'The wave has declined to move.', verdict: 'no' },
  { text: 'Clear is a generous verb.', verdict: 'very_doubtful' },
]);

addGroup('premature_hype', {
  intents: ['reaction', 'prediction', 'evaluation'], domains_any: ['current_game'], concepts_any: ['premature_hype'], delivery: 'dry', league_intensity: 1, min_specificity: 0.15, max_specificity: 1,
}, [
  { text: 'Easy penta. One target has been located.', verdict: 'outlook_good' },
  { text: 'Four kills remain. Confidence is complete.', verdict: 'maybe' },
  { text: 'The penta is secured in chat.', verdict: 'yes' },
  { text: 'One reset and the prophecy is already yelling.', verdict: 'outlook_good' },
  { text: 'The first kill has become a documentary.', verdict: 'unclear' },
  { text: 'Yes. Begin celebrating before the second target.', verdict: 'yes' },
]);

addGroup('reckless_commitment', {
  intents: ['reaction', 'permission', 'evaluation'], domains_any: ['current_game', 'builds_items_runes'], concepts_any: ['reckless_commitment'], delivery: 'dry', league_intensity: 1, min_specificity: 0.15, max_specificity: 1,
}, [
  { text: 'Send it. Evidence can arrive later.', verdict: 'yes' },
  { text: 'Let him cook. The extinguisher is nearby.', verdict: 'yes' },
  { text: 'Full commitment. Partial information.', verdict: 'maybe' },
  { text: 'Run it. Regret needs footage.', verdict: 'yes' },
  { text: 'The plan is bad enough to work once.', verdict: 'outlook_good' },
  { text: 'Yes. Restraint has left the lobby.', verdict: 'yes' },
]);

addGroup('viewer_games', {
  intents: ['reaction', 'prediction', 'evaluation', 'timing'], domains_any: ['room_lore', 'stream_chat_moderation'], concepts_any: ['viewer_games'], delivery: 'room_lore', league_intensity: 0, sro_intensity: 1, min_specificity: 0.15, max_specificity: 1,
}, [
  { text: 'Viewer games return when peace is no longer required.', verdict: 'likely' },
  { text: 'Chat has volunteered five new loss conditions.', verdict: 'yes' },
  { text: 'The viewers are ready. Matchmaking is not.', verdict: 'not_yet' },
  { text: 'Yes. The lobby deserves to learn.', verdict: 'yes' },
  { text: 'Soon. Liability waivers are still loading.', verdict: 'soon' },
  { text: 'The Ball sees ten players and no supervision.', verdict: 'outlook_unclear' },
]);

addGroup('creator_collab_money', {
  intents: ['explanation', 'evaluation', 'prediction'], domains_any: ['work_money', 'sro'], concepts_any: ['creator_collab_money'], delivery: 'room_lore', sro_intensity: 1, min_specificity: 0.25, max_specificity: 1,
}, [
  { text: 'Enough for ninety seconds. Not enough for dignity.', verdict: 'unclear' },
  { text: 'Mike’s manager has already invented a percentage.', verdict: 'likely' },
  { text: 'The Ball sees five figures and several missing disclosures.', verdict: 'maybe' },
  { text: 'More than chat guessed. Less than chat will claim.', verdict: 'unclear' },
  { text: 'The integration pays in money. The replies pay in evidence.', verdict: 'yes' },
  { text: 'Ask again after the invoice develops confidence.', verdict: 'ask_again_later' },
]);

addGroup('bot_completion', {
  intents: ['timing', 'evaluation', 'identity'], domains_any: ['stream_chat_moderation'], concepts_any: ['bot_completion'], delivery: 'dry', min_specificity: 0.2, max_specificity: 1,
}, [
  { text: 'Finished is a strong word. Committed is accurate.', verdict: 'not_yet' },
  { text: 'Version seven has been informed of the situation.', verdict: 'soon' },
  { text: 'The answer was yesterday. Quality arrives later.', verdict: 'ask_again_later' },
  { text: 'Soon. One more bug needs a personality.', verdict: 'soon' },
  { text: 'Done enough for chat to find the rest.', verdict: 'yes' },
  { text: 'The Ball ships when the questions stop improving it.', verdict: 'unclear' },
]);

addGroup('bot_challenge', {
  intents: ['evaluation', 'reaction', 'explanation'], domains_any: ['stream_chat_moderation'], concepts_any: ['bot_challenge'], delivery: 'dry', min_specificity: 0.2, max_specificity: 1,
}, [
  { text: 'No. This is the sober build.', verdict: 'no' },
  { text: 'The Ball read the question correctly. That is worse.', verdict: 'yes' },
  { text: 'High confidence. Low supervision.', verdict: 'unclear' },
  { text: 'Bones gave it League knowledge before judgment.', verdict: 'yes', entities_required: ['bones'], reference_ids: ['bones'] },
  { text: 'The answer stands. Sobriety remains irrelevant.', verdict: 'yes' },
  { text: 'No substances. Chat was sufficient.', verdict: 'no' },
]);

addGroup('mock_mod_call', {
  intents: ['reaction', 'permission', 'prediction'], domains_any: ['stream_chat_moderation'], concepts_any: ['mock_mod_call'], delivery: 'dry', min_specificity: 0.15, max_specificity: 1,
}, [
  { text: 'Mods have entered the sentencing phase.', verdict: 'yes' },
  { text: 'Alcatraz has acknowledged the ping.', verdict: 'likely' },
  { text: 'The case is weak. The punishment is ready.', verdict: 'yes' },
  { text: 'Another prisoner has volunteered.', verdict: 'yes' },
  { text: 'Ban request received. Evidence remains optional.', verdict: 'maybe' },
  { text: 'The mods are typing with administrative joy.', verdict: 'outlook_good' },
]);

addGroup('love_question', {
  intents: ['evaluation', 'prediction'], domains_any: ['relationships_social'], concepts_any: ['love_question'], delivery: 'dry', min_specificity: 0.15, max_specificity: 1,
}, [
  { text: 'The Ball respects you professionally.', verdict: 'maybe' },
  { text: 'Love is unclear. Repeat usage is confirmed.', verdict: 'unclear' },
  { text: 'Yes, but the cooldown needs boundaries.', verdict: 'yes' },
  { text: 'The Ball recognizes the attachment.', verdict: 'likely' },
  { text: 'Affection pending. Inquiry volume approved.', verdict: 'not_yet' },
  { text: 'Maybe. Ask something less vulnerable.', verdict: 'maybe' },
]);

addGroup('chat_laugh_reaction', {
  intents: ['reaction'], domains_any: ['stream_chat_moderation'], concepts_any: ['chat_laugh_reaction'], delivery: 'dry', min_specificity: 0.05, max_specificity: 1,
}, [
  { text: 'Correct reaction.', verdict: 'yes' },
  { text: 'Laughter is the only stable outcome.', verdict: 'yes' },
  { text: 'The replay agrees.', verdict: 'yes' },
  { text: 'Yes. That was the response.', verdict: 'yes' },
  { text: 'Nothing further is required.', verdict: 'direct_reaction' },
  { text: 'The evidence has become comedy.', verdict: 'outlook_good' },
]);

function syntaxFamily(text) {
  if (text.includes('—')) return 'verdict_dash_single_clause';
  const sentenceMarks = (text.match(/[.!?]/g) ?? []).length;
  if (sentenceMarks >= 2) return 'two_short_sentences';
  if (text.includes(';')) return 'semicolon_clause';
  return 'plain_single_clause';
}

for (const [prefixName, rewrites] of Object.entries(groupRewrites)) {
  const exactGroupPattern = new RegExp(`^${prefixName}_[0-9]+$`);
  const group = responses.filter((response) => exactGroupPattern.test(response.id));
  if (group.length !== rewrites.length) {
    throw new Error(`V4.5 rewrite mismatch for ${prefixName}: ${rewrites.length} rewrites for ${group.length} responses`);
  }
  group.forEach((response, index) => {
    const rewrite = rewrites[index];
    Object.assign(response, rewrite);
    response.opening_family = rewrite.opening_family ?? openingFamily(response.text, response.verdict);
    response.syntax_family = rewrite.syntax_family ?? syntaxFamily(response.text);
    response.editorial_notes = 'Deliberately reviewed and rebuilt for V4.5.';
  });
}

for (const group of newGroups) addGroup(group.prefix, group.meta, group.lines);
for (const response of responses) {
  if (response.editorial_notes === 'Approved V4.2 editorial bank.') {
    response.editorial_notes = 'Reviewed and retained during the V4.5 editorial rebuild.';
  }
}

const outputPath = path.resolve('data/runtime/responses.json');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify({ version: '4.8.0', responses }, null, 2)}
`);
console.log(`Wrote ${responses.length} approved responses to ${outputPath}`);
