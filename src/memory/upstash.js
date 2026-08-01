import { loadRuntimeData } from '../data.js';
import { randomUUID } from 'node:crypto';
import { stableHash } from '../text.js';

export class UpstashRestMemoryStore {
  constructor({ url, token }) {
    this.url = url?.replace(/\/$/, '');
    this.token = token;
  }

  async command(...args) {
    const response = await fetch(`${this.url}/${args.map(encodeURIComponent).join('/')}`, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
    if (!response.ok) throw new Error(`Upstash command failed: ${response.status}`);
    return (await response.json()).result;
  }

  userKey(userHash) { return `sro8:user:${userHash}`; }
  routeKey(routeKey) { return `sro8:path:${stableHash(routeKey)}`; }


  lockKey(routeKey) { return `sro8:lock:${stableHash(routeKey || 'general')}`; }

  async withRouteLock(routeKey, operation) {
    const key = this.lockKey(routeKey);
    const token = randomUUID();
    const leaseMs = 10000;
    const waitMs = 25;
    const deadline = Date.now() + 4000;
    let acquired = false;

    while (Date.now() < deadline) {
      const result = await this.command('SET', key, token, 'PX', leaseMs, 'NX');
      if (result === 'OK') {
        acquired = true;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }

    if (!acquired) throw new Error(`Timed out acquiring route lock: ${routeKey}`);
    try {
      return await operation();
    } finally {
      const script = "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end";
      try {
        await this.command('EVAL', script, 1, key, token);
      } catch {
        // The lease expires automatically. Never mask a valid oracle response
        // solely because best-effort lock cleanup failed.
      }
    }
  }

  async getSnapshot(userHash, routeKey) {
    const [userRaw, globalRaw, routeRaw] = await Promise.all([
      this.command('GET', this.userKey(userHash)),
      this.command('GET', 'sro8:global'),
      routeKey ? this.command('GET', this.routeKey(routeKey)) : null,
    ]);
    const global = globalRaw ? JSON.parse(globalRaw) : {};
    return {
      ...global,
      ...(userRaw ? JSON.parse(userRaw) : {}),
      pathResponseIds: routeRaw ? JSON.parse(routeRaw) : [],
      chaosCountdown: Number.isInteger(global.chaosCountdown) ? global.chaosCountdown : null,
    };
  }

  async recordSelection(event) {
    const windows = loadRuntimeData().memoryConfig.windows;
    const current = await this.getSnapshot(event.userHash, event.routeKey);
    const user = {
      userResponseIds: [...(current.userResponseIds ?? []), event.responseId].slice(-windows.same_user_exact_response_count),
      oracleProfile: {
        interactionCount: (current.oracleProfile?.interactionCount ?? 0) + (event.oracleProfileDelta?.interactionCount ?? 0),
        repeatedCount: (current.oracleProfile?.repeatedCount ?? 0) + (event.oracleProfileDelta?.repeatedCount ?? 0),
        leagueCount: (current.oracleProfile?.leagueCount ?? 0) + (event.oracleProfileDelta?.leagueCount ?? 0),
        respectCount: (current.oracleProfile?.respectCount ?? 0) + (event.oracleProfileDelta?.respectCount ?? 0),
        challengedCount: (current.oracleProfile?.challengedCount ?? 0) + (event.oracleProfileDelta?.challengedCount ?? 0),
        seriousCount: (current.oracleProfile?.seriousCount ?? 0) + (event.oracleProfileDelta?.seriousCount ?? 0),
        lastValue: event.oracleProfileDelta?.lastValue ?? current.oracleProfile?.lastValue ?? null,
        lastDiagnosis: event.oracleProfileDelta?.lastDiagnosis ?? current.oracleProfile?.lastDiagnosis ?? null,
        lastMode: event.oracleProfileDelta?.lastMode ?? current.oracleProfile?.lastMode ?? null,
      },
    };
    const global = {
      globalResponseIds: [...(current.globalResponseIds ?? []), event.responseId].slice(-windows.global_exact_response_count),
      semanticFamilies: [...(current.semanticFamilies ?? []), event.semanticFamily].slice(-windows.semantic_family_count),
      openingFamilies: [...(current.openingFamilies ?? []), event.openingFamily].slice(-windows.opening_family_count),
      syntaxFamilies: [...(current.syntaxFamilies ?? []), event.syntaxFamily].slice(-windows.syntax_family_count),
      replyMoves: [...(current.replyMoves ?? []), event.replyMove].slice(-windows.reply_move_count),
      twistFamilies: [...(current.twistFamilies ?? []), event.twistFamily].slice(-windows.twist_family_count),
      targetFamilies: [...(current.targetFamilies ?? []), event.targetFamily].slice(-windows.target_family_count),
      payoffFamilies: [...(current.payoffFamilies ?? []), event.payoffFamily].slice(-windows.payoff_family_count),
      conceptFamilies: [...(current.conceptFamilies ?? []), ...(event.conceptFamilies ?? [])].slice(-windows.concept_family_count),
      deliveryModes: [...(current.deliveryModes ?? []), event.deliveryMode].slice(-20),
      emotes: event.emote ? [...(current.emotes ?? []), event.emote].slice(-windows.emote_count) : (current.emotes ?? []),
      emoteFamilies: event.emoteFamily ? [...(current.emoteFamilies ?? []), event.emoteFamily].slice(-(windows.emote_family_count ?? 8)) : (current.emoteFamilies ?? []),
      emoteBearingFlags: [...(current.emoteBearingFlags ?? []), Boolean(event.emoteBearing)].slice(-(windows.emote_ratio_window_count ?? 20)),
      stances: event.stance ? [...(current.stances ?? []), event.stance].slice(-8) : (current.stances ?? []),
      oracleModes: event.oracleMode ? [...(current.oracleModes ?? []), event.oracleMode].slice(-10) : (current.oracleModes ?? []),
      values: event.valueAtStake ? [...(current.values ?? []), event.valueAtStake].slice(-10) : (current.values ?? []),
      diagnoses: event.diagnosis ? [...(current.diagnoses ?? []), event.diagnosis].slice(-10) : (current.diagnoses ?? []),
      relationshipStages: event.relationshipStage ? [...(current.relationshipStages ?? []), event.relationshipStage].slice(-10) : (current.relationshipStages ?? []),
      chaosCountdown: Number.isInteger(event.chaosCountdown) ? event.chaosCountdown : (current.chaosCountdown ?? null),
    };
    const commands = [
      this.command('SETEX', this.userKey(event.userHash), windows.history_ttl_seconds, JSON.stringify(user)),
      this.command('SETEX', 'sro8:global', windows.history_ttl_seconds, JSON.stringify(global)),
    ];
    if (event.routeKey) {
      const route = [...(current.pathResponseIds ?? []), event.responseId].slice(-windows.path_exact_response_count);
      commands.push(this.command('SETEX', this.routeKey(event.routeKey), windows.history_ttl_seconds, JSON.stringify(route)));
    }
    await Promise.all(commands);
  }

  async getInquiryFingerprint(userHash, fingerprint) {
    return Boolean(await this.command('EXISTS', `sro8:q:${userHash}:${fingerprint}`));
  }

  async recordInquiryFingerprint(userHash, fingerprint, ttlSeconds) {
    await this.command('SETEX', `sro8:q:${userHash}:${fingerprint}`, ttlSeconds, '1');
  }

  async health() {
    try {
      await this.command('PING');
      return { ready: true, degraded: false, persistent: true, distributed: true, adapter: 'upstash_rest' };
    } catch {
      return { ready: false, degraded: true, persistent: false, distributed: false, adapter: 'upstash_rest' };
    }
  }
}
