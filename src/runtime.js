import fs from 'node:fs';
import { loadJson, rootPath } from './data.js';
import { recognizeInquiry } from './recognition/index.js';
import { selectResponse } from './selection/index.js';
import { createMemoryStore } from './memory/index.js';
import { getActiveEmotes } from './emotes.js';
import { validateResponsePool } from './validation/index.js';

const HELP_TEXT = 'ASK A QUESTION - use !8ball followed by an inquiry.';

function loadResponses(mode, env = process.env) {
  const configured = env.SRO_8BALL_RESPONSE_FILE;
  if (configured && fs.existsSync(configured)) return JSON.parse(fs.readFileSync(configured, 'utf8')).responses ?? JSON.parse(fs.readFileSync(configured, 'utf8'));
  if (mode === 'production') {
    const productionPath = rootPath('data/runtime/responses.json');
    if (fs.existsSync(productionPath)) return JSON.parse(fs.readFileSync(productionPath, 'utf8')).responses ?? [];
    return [];
  }
  return loadJson('test/fixtures/test-response-pool.json').responses;
}

function clampOutput(text) {
  const hardCap = loadJson('data/config/product_contract.json').surface_rules.hard_cap_chars;
  if (text.length <= hardCap) return text;
  return `${text.slice(0, Math.max(0, hardCap - 1)).trimEnd()}…`;
}

export class OracleRuntime {
  constructor({ mode = process.env.NODE_ENV === 'production' ? 'production' : 'development', env = process.env, memory } = {}) {
    this.mode = mode;
    this.env = env;
    this.responses = loadResponses(mode, env);
    this.memory = memory ?? createMemoryStore(env);
    this.validation = validateResponsePool(this.responses);
  }

  async answer({ inquiry, userId = 'anonymous', debug = false, seed, personalityVolume } = {}) {
    const bundle = recognizeInquiry(inquiry ?? '');
    if (bundle.intent.label === 'command_help') {
      return debug ? { text: HELP_TEXT, bundle, responseId: null, fallbackLevel: 'missing_inquiry_help' } : HELP_TEXT;
    }
    const emotes = await getActiveEmotes(this.env);
    const configuredVolume = personalityVolume ?? Number(this.env.SRO_8BALL_PERSONALITY_VOLUME ?? 6);
    const selection = await selectResponse({ bundle, responses: this.responses, memory: this.memory, userId, seed, personalityVolume: configuredVolume, mode: this.mode === 'production' ? 'production' : 'test', activeEmotes: emotes.set, emoteInventory: emotes.inventory });
    const text = clampOutput(selection.response?.text ?? 'ASK AGAIN LATER - no approved answer is available.');
    if (!debug) return text;
    return {
      text,
      responseId: selection.responseId,
      bundle,
      fallbackLevel: selection.fallbackLevel,
      repeatedInquiry: selection.repeatedInquiry,
      routeKey: selection.routeKey,
      chaosSelected: selection.chaosSelected,
      chaosCountdown: selection.chaosCountdown,
      admittedCount: selection.admittedCount,
      highestMatchTier: selection.highestMatchTier,
      includedMatchTiers: selection.includedMatchTiers,
      freshnessTierCount: selection.freshnessTierCount,
      rotationPoolCount: selection.rotationPoolCount,
      cycleReset: selection.cycleReset,
      usedInCycle: selection.usedInCycle,
      selectedVarietyBurden: selection.selectedVarietyBurden,
      stance: selection.stance ?? null,
      decisionPlan: selection.stance ?? null,
      perception: selection.stance?.perception ?? null,
      personalityVolume: configuredVolume,
      stanceBestScore: selection.stanceBestScore ?? null,
      stanceRelaxed: selection.stanceRelaxed ?? null,
      stancePoolCount: selection.stancePoolCount ?? null,
      selectedGrammar: selection.response ? {
        replyMove: selection.response.reply_move,
        twistFamily: selection.response.twist_family,
        targetFamily: selection.response.target_family,
        payoffFamily: selection.response.payoff_family,
      } : null,
      bestGrammarFreshness: selection.bestGrammarFreshness,
      hardFreshnessApplied: selection.hardFreshnessApplied,
      hardFreshnessRelaxed: selection.hardFreshnessRelaxed,
      candidates: selection.candidates,
      eligibility: selection.eligibility.map((item) => ({ responseId: item.response.id, eligible: item.eligible, rejectionReasons: item.rejectionReasons })),
      memory: await this.memory.health(),
      emotePolicy: selection.emotePolicy ?? null,
      emotes: {
        source: emotes.source,
        degraded: emotes.degraded,
        error: emotes.error,
        selected: selection.emoteDecision ?? null,
        inventory: {
          setId: emotes.inventory?.setId ?? null,
          total: emotes.inventory?.totalCount ?? 0,
          categorized: emotes.inventory?.categorizedCount ?? 0,
          compounds: emotes.inventory?.compoundCount ?? 0,
          coverageRatio: emotes.inventory?.coverageRatio ?? 0,
          uncategorized: emotes.inventory?.uncategorized?.map((entry) => entry.alias) ?? [],
          hash: emotes.inventory?.hash ?? null,
        },
      },
      mode: this.mode,
    };
  }

  async health() {
    const memory = await this.memory.health();
    const emotes = await getActiveEmotes(this.env);
    const approvedCount = this.responses.filter((r) => r.status === 'approved').length;
    const testOnlyCount = this.responses.filter((r) => r.status === 'test_only').length;
    return {
      ok: this.validation.valid && (this.mode !== 'production' || approvedCount > 0),
      mode: this.mode,
      dataLoaded: this.validation.valid,
      responseCounts: { total: this.responses.length, approved: approvedCount, testOnly: testOnlyCount },
      productionReady: this.validation.valid && approvedCount > 0 && memory.ready && memory.persistent === true && memory.distributed === true && !memory.degraded,
      persistence: memory,
      sevenTv: {
        source: emotes.source,
        degraded: emotes.degraded,
        error: emotes.error,
        setId: emotes.inventory?.setId ?? null,
        total: emotes.inventory?.totalCount ?? 0,
        categorized: emotes.inventory?.categorizedCount ?? 0,
        compounds: emotes.inventory?.compoundCount ?? 0,
        coverageRatio: emotes.inventory?.coverageRatio ?? 0,
        uncategorizedCount: emotes.inventory?.uncategorized?.length ?? 0,
        hash: emotes.inventory?.hash ?? null,
      },
      editorialStatus: approvedCount > 0 ? 'approved_content_present' : 'engineering_only_no_approved_bank',
    };
  }
}
