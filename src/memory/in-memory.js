import { emptyVarietySnapshot } from '../selection/scoring.js';
import { loadRuntimeData } from '../data.js';

function boundedPush(array, value, max) {
  const next = [...array, value];
  return next.slice(Math.max(0, next.length - max));
}

export class InMemoryStore {
  constructor() {
    this.users = new Map();
    this.routes = new Map();
    this.global = emptyVarietySnapshot();
    this.fingerprints = new Map();
    this.routeLocks = new Map();
    this.chaosCountdown = null;
  }


  async withRouteLock(routeKey, operation) {
    const key = routeKey || 'general';
    const previous = this.routeLocks.get(key) ?? Promise.resolve();
    let release;
    const gate = new Promise((resolve) => { release = resolve; });
    const tail = previous.then(() => gate);
    this.routeLocks.set(key, tail);
    await previous;
    try {
      return await operation();
    } finally {
      release();
      if (this.routeLocks.get(key) === tail) {
        tail.finally(() => {
          if (this.routeLocks.get(key) === tail) this.routeLocks.delete(key);
        });
      }
    }
  }

  async getSnapshot(userHash, routeKey) {
    const user = this.users.get(userHash) ?? emptyVarietySnapshot();
    return {
      ...emptyVarietySnapshot(),
      ...this.global,
      userResponseIds: [...(user.userResponseIds ?? [])],
      oracleProfile: { ...(user.oracleProfile ?? {}) },
      pathResponseIds: [...(this.routes.get(routeKey) ?? [])],
      chaosCountdown: this.chaosCountdown,
    };
  }

  async recordSelection(event) {
    const windows = loadRuntimeData().memoryConfig.windows;
    const user = this.users.get(event.userHash) ?? emptyVarietySnapshot();
    user.userResponseIds = boundedPush(user.userResponseIds, event.responseId, windows.same_user_exact_response_count);
    const previousProfile = user.oracleProfile ?? {};
    const delta = event.oracleProfileDelta ?? {};
    user.oracleProfile = {
      interactionCount: (previousProfile.interactionCount ?? 0) + (delta.interactionCount ?? 0),
      repeatedCount: (previousProfile.repeatedCount ?? 0) + (delta.repeatedCount ?? 0),
      leagueCount: (previousProfile.leagueCount ?? 0) + (delta.leagueCount ?? 0),
      respectCount: (previousProfile.respectCount ?? 0) + (delta.respectCount ?? 0),
      challengedCount: (previousProfile.challengedCount ?? 0) + (delta.challengedCount ?? 0),
      seriousCount: (previousProfile.seriousCount ?? 0) + (delta.seriousCount ?? 0),
      lastValue: delta.lastValue ?? previousProfile.lastValue ?? null,
      lastDiagnosis: delta.lastDiagnosis ?? previousProfile.lastDiagnosis ?? null,
      lastMode: delta.lastMode ?? previousProfile.lastMode ?? null,
    };
    this.users.set(event.userHash, user);

    if (event.routeKey) {
      const routeHistory = this.routes.get(event.routeKey) ?? [];
      this.routes.set(event.routeKey, boundedPush(routeHistory, event.responseId, windows.path_exact_response_count));
    }

    this.global.globalResponseIds = boundedPush(this.global.globalResponseIds, event.responseId, windows.global_exact_response_count);
    this.global.semanticFamilies = boundedPush(this.global.semanticFamilies, event.semanticFamily, windows.semantic_family_count);
    this.global.openingFamilies = boundedPush(this.global.openingFamilies, event.openingFamily, windows.opening_family_count);
    this.global.syntaxFamilies = boundedPush(this.global.syntaxFamilies, event.syntaxFamily, windows.syntax_family_count);
    this.global.replyMoves = boundedPush(this.global.replyMoves, event.replyMove, windows.reply_move_count);
    this.global.twistFamilies = boundedPush(this.global.twistFamilies, event.twistFamily, windows.twist_family_count);
    this.global.targetFamilies = boundedPush(this.global.targetFamilies, event.targetFamily, windows.target_family_count);
    this.global.payoffFamilies = boundedPush(this.global.payoffFamilies, event.payoffFamily, windows.payoff_family_count);
    for (const concept of event.conceptFamilies ?? []) {
      this.global.conceptFamilies = boundedPush(this.global.conceptFamilies, concept, windows.concept_family_count);
    }
    this.global.deliveryModes = boundedPush(this.global.deliveryModes, event.deliveryMode, 20);
    if (event.emote) this.global.emotes = boundedPush(this.global.emotes, event.emote, windows.emote_count);
    if (event.emoteFamily) this.global.emoteFamilies = boundedPush(this.global.emoteFamilies, event.emoteFamily, windows.emote_family_count ?? 8);
    this.global.emoteBearingFlags = boundedPush(this.global.emoteBearingFlags, Boolean(event.emoteBearing), windows.emote_ratio_window_count ?? 20);
    if (event.stance) this.global.stances = boundedPush(this.global.stances ?? [], event.stance, 8);
    if (event.motive) this.global.motives = boundedPush(this.global.motives ?? [], event.motive, 8);
    if (event.target) this.global.targets = boundedPush(this.global.targets ?? [], event.target, 8);
    if (event.verdict) this.global.verdicts = boundedPush(this.global.verdicts ?? [], event.verdict, 8);
    if (event.oracleMode) this.global.oracleModes = boundedPush(this.global.oracleModes ?? [], event.oracleMode, 10);
    if (event.valueAtStake) this.global.values = boundedPush(this.global.values ?? [], event.valueAtStake, 10);
    if (event.diagnosis) this.global.diagnoses = boundedPush(this.global.diagnoses ?? [], event.diagnosis, 10);
    if (event.relationshipStage) this.global.relationshipStages = boundedPush(this.global.relationshipStages ?? [], event.relationshipStage, 10);
    if (Number.isInteger(event.chaosCountdown)) this.chaosCountdown = event.chaosCountdown;
  }

  async getInquiryFingerprint(userHash, fingerprint) {
    const key = `${userHash}:${fingerprint}`;
    const expires = this.fingerprints.get(key);
    if (!expires) return false;
    if (expires < Date.now()) {
      this.fingerprints.delete(key);
      return false;
    }
    return true;
  }

  async recordInquiryFingerprint(userHash, fingerprint, ttlSeconds) {
    this.fingerprints.set(`${userHash}:${fingerprint}`, Date.now() + ttlSeconds * 1000);
  }

  async health() {
    return { ready: true, degraded: true, persistent: false, distributed: false, adapter: 'memory' };
  }
}
