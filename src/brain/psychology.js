import { loadJson } from '../data.js';
import { stableHash } from '../text.js';

const cfg = () => loadJson('data/config/oracle-personality.json');
const LEAGUE_DOMAINS = new Set(['league_gameplay','current_game','champion_matchup','lane_wave_state','player_role_performance','objective_macro','fight_dive_trade_shutdown','builds_items_runes','ranked_climb']);

function includesAny(text, terms=[]) { return terms.some((term) => text.includes(term)); }
function unit(seed) { return Number.parseInt(stableHash(seed), 16) / 0xffffffff; }

export function relationshipStage(snapshot={}) {
  const count = snapshot.oracleProfile?.interactionCount ?? 0;
  return cfg().arcStages.find((stage) => count >= stage.minInteractions && count <= stage.maxInteractions) ?? cfg().arcStages.at(-1);
}

export function diagnoseBehavior(perception, snapshot={}, seed='') {
  const text = perception.normalized ?? '';
  const personality = cfg();
  const base = personality.behaviorPatterns[perception.motive.label] ?? personality.behaviorPatterns.curiosity;
  let diagnosisId = perception.motive.label;
  let value = base.value;
  let alignment = 'neutral';
  let respectEarned = false;

  if (includesAny(text, personality.respectSignals)) {
    diagnosisId = 'accountability_shown'; value = 'accountability'; alignment = 'aligned'; respectEarned = true;
  } else if (includesAny(text, personality.egoSignals)) {
    diagnosisId = 'confidence_ahead_of_evidence'; value = 'humility'; alignment = 'challenged';
  } else if (includesAny(text, personality.blameSignals)) {
    diagnosisId = 'blame_before_review'; value = 'accountability'; alignment = 'challenged';
  } else if (includesAny(text, personality.patienceSignals)) {
    diagnosisId = 'discipline_under_pressure'; value = 'patience'; alignment = 'aligned';
  } else if (perception.repetition.repeated) {
    diagnosisId = 'uncertainty_recycling'; value = 'patience'; alignment = 'challenged';
  }

  const league = perception.domains.some((domain) => LEAGUE_DOMAINS.has(domain.label));
  const stage = relationshipStage(snapshot);
  const rareRespect = respectEarned && unit(`${seed}:respect:${text}`) < Math.min(.85, .18 + stage.revealDepth * .14);
  return {
    id: diagnosisId,
    valueAtStake: value,
    valueAlignment: alignment,
    respectEarned: rareRespect,
    leagueNative: league,
    description: diagnosisId === perception.motive.label ? base.diagnosis : diagnosisId.replaceAll('_',' '),
    defaultMove: rareRespect ? 'quiet_respect' : base.defaultMove,
  };
}

export function personalityCurve({ perception, diagnosis, snapshot={}, volume=6 }) {
  const stage = relationshipStage(snapshot);
  const normalized = Math.max(1, Math.min(10, Number(volume)||6));
  const base = (normalized / 10) ** 1.35;
  const seriousBrake = perception.safety.humorAllowed ? 1 : 0;
  const repeatLift = perception.repetition.repeated ? .12 : 0;
  const challengedLift = diagnosis.valueAlignment === 'challenged' ? .09 : 0;
  const familiarityLift = (stage.revealDepth - 1) * .035;
  const expressivePressure = Math.max(0, Math.min(1, base * seriousBrake + repeatLift + challengedLift + familiarityLift));
  return {
    stage: stage.id,
    interactionCount: snapshot.oracleProfile?.interactionCount ?? 0,
    revealDepth: stage.revealDepth,
    expressivePressure,
    plainAnswerBias: Math.max(.08, .42 - expressivePressure * .28),
    sharpness: Math.round(expressivePressure * 10),
    warmth: diagnosis.respectEarned ? Math.min(7, 2 + stage.revealDepth) : Math.max(0, 3 - Math.floor(expressivePressure*2)),
    callbackPermission: stage.revealDepth >= 3,
    lorePermission: diagnosis.leagueNative && stage.revealDepth >= 2,
  };
}

export function chooseOracleMode({ perception, diagnosis, curve, verdict, seed='' }) {
  if (!perception.safety.humorAllowed) return perception.safety.mode === 'safe_redirect' ? 'safe_redirect' : 'plain_truth';
  if (diagnosis.respectEarned) return 'quiet_respect';
  if (perception.repetition.repeated) return 'motive_exposure';
  if (diagnosis.valueAlignment === 'challenged') return curve.sharpness >= 6 ? 'dry_diagnosis' : 'restrained_correction';
  if (diagnosis.valueAlignment === 'aligned') return curve.warmth >= 4 ? 'reluctant_approval' : 'clean_verdict';
  const x = unit(`${seed}:oracle-mode:${perception.normalized}:${curve.stage}`);
  if (curve.plainAnswerBias > x) return 'clean_verdict';
  if (curve.sharpness >= 8 && x > .86) return 'controlled_omen';
  if (diagnosis.leagueNative && curve.lorePermission) return 'league_witness';
  return verdict === 'direct' ? 'dry_diagnosis' : 'clean_verdict';
}

export function oracleProfileDelta({ perception, diagnosis, plan }) {
  return {
    interactionCount: 1,
    repeatedCount: perception.repetition.repeated ? 1 : 0,
    leagueCount: diagnosis.leagueNative ? 1 : 0,
    respectCount: diagnosis.respectEarned ? 1 : 0,
    challengedCount: diagnosis.valueAlignment === 'challenged' ? 1 : 0,
    seriousCount: perception.seriousness.label === 'serious' ? 1 : 0,
    lastValue: diagnosis.valueAtStake,
    lastDiagnosis: diagnosis.id,
    lastMode: plan.oracleMode,
  };
}
