function unique(values) {
  return [...new Set((values ?? []).filter(Boolean))];
}

const POSITIVE_VERDICTS = new Set(['yes', 'likely', 'outlook_good', 'signs_say_yes', 'favored', 'winnable']);
const NEGATIVE_VERDICTS = new Set(['no', 'unlikely', 'very_doubtful', 'signs_say_no', 'doomed']);
const UNCLEAR_VERDICTS = new Set(['maybe', 'unclear', 'outlook_unclear', 'ask_again_later', 'not_yet']);

const REPLY_MOVE_EXPRESSIONS = {
  straight_verdict: ['agreement', 'approval', 'disbelief'],
  conditional_verdict: ['hope', 'cope', 'suspicion', 'desperate_hope'],
  confirm_then_undercut: ['reluctant_agreement', 'smug', 'goofy_irony', 'mock_applause'],
  deny_then_reframe: ['refusal', 'disbelief', 'smug', 'goofy_irony'],
  deadpan_diagnosis: ['recognition', 'disbelief', 'mockery', 'accusatory_disbelief'],
  callback_substitution: ['recognition', 'smug', 'goofy_irony'],
  mock_accusation: ['suspicion', 'bait', 'mockery', 'accusatory_disbelief'],
  mock_sentence: ['judgment', 'mockery', 'recognition'],
  false_choice: ['confusion', 'mockery', 'goofy_irony'],
  comparison_pick: ['approval', 'mockery', 'disbelief'],
  understatement: ['recognition', 'smug', 'dry_disapproval'],
  escalation: ['hype', 'panic', 'disbelief'],
  blame_shift: ['mockery', 'suspicion', 'accusatory_disbelief'],
  literalize_slang: ['laughter', 'light_laughter', 'disbelief'],
  instruction: ['approval', 'hype', 'ironic_endorsement'],
  refusal: ['refusal', 'disbelief', 'dry_disapproval'],
  omen: ['hidden_nonsense', 'suspicion', 'watching'],
  identity_answer: ['recognition', 'smug', 'goofy_irony'],
  location_answer: ['watching', 'suspicion'],
  absurd_declaration: ['hidden_nonsense', 'disbelief', 'goofy_irony'],
};

const PAYOFF_EXPRESSIONS = {
  utility: ['neutral_reaction'],
  reversal: ['disbelief', 'smug', 'goofy_irony'],
  judgment: ['mockery', 'suspicion', 'accusatory_disbelief'],
  recognition: ['recognition', 'smug'],
  escalation: ['hype', 'panic'],
  doom: ['doom', 'failure', 'sadness'],
  cope: ['cope', 'hope', 'desperate_hope'],
  absurdity: ['hidden_nonsense', 'disbelief'],
};

const FUNCTION_BY_INTENT = {
  prediction: ['prediction_unclear'],
  permission: ['approval_reaction'],
  evaluation: ['general_reaction'],
  comparison: ['general_reaction'],
  timing: ['watching_reaction'],
  explanation: ['rebuttal'],
  identity: ['general_reaction'],
  reaction: ['general_reaction'],
  nonsense: ['chaos_oracle'],
};

const CONCEPT_EXPRESSION_RULES = {
  gold_reset_cope: { preferred: ['cope', 'smug', 'recognition'], functions: ['cope_prophecy', 'failure_reaction'] },
  shutdown_given: { preferred: ['cope', 'doom', 'disbelief'], functions: ['failure_reaction'] },
  worth_cope: { preferred: ['cope', 'mockery', 'smug'], functions: ['rebuttal', 'roast'] },
  mock_diff: { preferred: ['mockery', 'recognition', 'light_laughter'], functions: ['roast', 'general_reaction'] },
  wave_clear_jab: { preferred: ['mockery', 'visual_pain', 'disbelief'], functions: ['roast', 'failure_reaction', 'painful_witnessing'] },
  premature_hype: { preferred: ['mild_hype', 'hype', 'approval'], functions: ['hype_reaction'] },
  reckless_commitment: { preferred: ['ironic_endorsement', 'approval', 'hype', 'cursed_build'], functions: ['approval_reaction', 'cursed_build'] },
  viewer_games: { preferred: ['anticipation', 'hype', 'panic'], functions: ['watching_reaction', 'chaos_oracle'] },
  creator_collab_money: { preferred: ['suspicion', 'smug', 'recognition'], functions: ['rebuttal', 'general_reaction'] },
  bot_completion: { preferred: ['waiting', 'anticipation', 'smug'], functions: ['watching_reaction', 'rebuttal'] },
  bot_challenge: { preferred: ['accusatory_disbelief', 'disbelief', 'mockery', 'smug'], functions: ['rebuttal', 'roast'] },
  mock_mod_call: { preferred: ['mock_enforcement', 'moderation', 'mockery'], functions: ['moderation_reaction', 'mock_sentence'] },
  love_question: { preferred: ['love', 'smug', 'disbelief'], functions: ['love_response'] },
  chat_laugh_reaction: { preferred: ['light_laughter', 'laughter', 'goofy_irony', 'recognition'], functions: ['general_reaction', 'roast'] },
  room_doubters_believers: { preferred: ['gamba_belief', 'hope', 'ironic_endorsement'], functions: ['gamba_reaction', 'prediction_yes'] },
  rank_climb: { preferred: ['hope', 'gamba_belief', 'mild_hype'], functions: ['prediction_yes', 'cope_prophecy'] },
};

const COMPOUND_ROLES_BY_MOVE = {
  confirm_then_undercut: ['mock_applause', 'mock_pride'],
  callback_substitution: ['mock_applause', 'mock_pride'],
  identity_answer: ['mock_applause', 'mock_pride'],
  deadpan_diagnosis: ['roast', 'self_aware_reply'],
  mock_accusation: ['roast', 'self_aware_reply'],
  deny_then_reframe: ['roast', 'self_aware_reply'],
  blame_shift: ['roast', 'self_aware_reply'],
};

function textCues(text) {
  const value = String(text ?? '').toLowerCase();
  const preferred = [];
  const functions = [];
  const contextTags = [];
  if (/accus|allegation|motive|evidence|guilty|suspect|case\b/.test(value)) preferred.push('suspicion', 'bait', 'mockery');
  if (/funny|joke|laug|comedy|hilar/.test(value)) preferred.push('laughter', 'light_laughter', 'mockery');
  if (/comeback|hope|possible|believ|path back|still alive/.test(value)) preferred.push('hope', 'cope', 'desperate_hope');
  if (/refund|points|gamba|doubter|believer/.test(value)) {
    preferred.push('gamba_belief', 'desperate_hope');
    functions.push('gamba_reaction', 'pleading');
  }
  if (/watch|nearby|somewhere|next line|still here|lurking/.test(value)) preferred.push('watching', 'suspicion');
  if (/cook|build|theory|experiment|thumbnail|inventory/.test(value)) {
    preferred.push('cursed_build', 'disbelief');
    functions.push('cursed_build');
  }
  if (/ban|mods?|jail|prison|alcatraz|sentencing|punishment/.test(value)) {
    preferred.push('mock_enforcement', 'moderation', 'mockery');
    functions.push('moderation_reaction', 'mock_sentence');
  }
  if (/flash|missed|ran it|running it|inting|fed|threw|died/.test(value)) contextTags.push('visual_failure');
  const explicitGoneFailure = /(?:game|lead|win condition|chance|hope|nexus).{0,24}\bgone\b/.test(value);
  if (/changed owners|lost|losing|\bbad\b|\bwrong\b|failed|behind|doomed|threw|inting|ran it/.test(value) || explicitGoneFailure) {
    contextTags.push('negative_outcome');
  }
  if (/clean win|easy win|victory|won\b|nexus/.test(value)) contextTags.push('clean_victory');
  if (/sorry|grief|condolence|lost someone|passed away/.test(value)) contextTags.push('sincere_sympathy');
  if (/job|money|health|doctor|legal|seriously/.test(value)) contextTags.push('serious_advice');
  if (/no\. |no —|doomed|dead|terminal|funeral/.test(value) || explicitGoneFailure) preferred.push('doom', 'failure', 'refusal');
  if (/my fault|i deserve|i was wrong|bad bet|wrong side/.test(value)) {
    preferred.push('self_own', 'rueful_laughter');
    functions.push('self_aware_reply');
  }
  return { preferred: unique(preferred), functions: unique(functions), contextTags: unique(contextTags) };
}

export function deriveEmotePolicy(response, bundle = null) {
  const preferred = [];
  const allowed = [];
  const forbidden = [];
  const functions = [...(FUNCTION_BY_INTENT[response.intents?.[0]] ?? ['general_reaction'])];
  const visualPreferred = [];
  const contextTags = [];
  const compoundRoles = [...(COMPOUND_ROLES_BY_MOVE[response.reply_move] ?? [])];
  const targetContexts = [response.intents?.[0], response.reply_move, response.target_family, response.payoff_family, ...(response.concepts_any ?? [])];
  const positive = POSITIVE_VERDICTS.has(response.verdict);
  const negative = NEGATIVE_VERDICTS.has(response.verdict);
  const unclear = UNCLEAR_VERDICTS.has(response.verdict);

  if (positive) {
    preferred.push('agreement', 'approval', 'hope');
    allowed.push('hype', 'reluctant_agreement', 'smug', 'ironic_endorsement', 'mild_hype');
    functions.push('prediction_yes');
    if (response.payoff_family === 'doom') preferred.unshift('reluctant_agreement');
  } else if (negative) {
    preferred.push('refusal', 'doom', 'failure');
    allowed.push('disbelief', 'sadness', 'mockery', 'dry_disapproval');
    functions.push('prediction_no');
  } else if (unclear) {
    preferred.push('confusion', 'suspicion', 'contemplation');
    allowed.push('cope', 'hope', 'watching', 'disbelief', 'uncertainty');
    functions.push('prediction_unclear');
    if (response.payoff_family === 'cope') preferred.splice(0, preferred.length, 'cope', 'hope', 'desperate_hope');
    if (response.payoff_family === 'absurdity') preferred.splice(0, preferred.length, 'hidden_nonsense', 'disbelief');
  } else {
    preferred.push(...(PAYOFF_EXPRESSIONS[response.payoff_family] ?? []));
  }

  allowed.push(...(REPLY_MOVE_EXPRESSIONS[response.reply_move] ?? []));
  allowed.push(...(PAYOFF_EXPRESSIONS[response.payoff_family] ?? []));

  const cues = textCues(response.text);
  if (cues.preferred.length) preferred.splice(0, preferred.length, ...cues.preferred);
  functions.push(...cues.functions);
  contextTags.push(...cues.contextTags);

  const bundleConcepts = new Set((bundle?.concepts ?? []).map((item) => item.label));
  targetContexts.push(bundle?.route_family, ...(bundle?.domains ?? []).map((item) => item.label), ...bundleConcepts);
  for (const concept of bundleConcepts) {
    const rule = CONCEPT_EXPRESSION_RULES[concept];
    if (!rule) continue;
    preferred.splice(0, preferred.length, ...(rule.preferred ?? []));
    allowed.push(...(rule.preferred ?? []), ...(rule.allowed ?? []));
    functions.push(...(rule.functions ?? []));
  }

  if (response.delivery === 'chaos' || response.chaos > 0) {
    preferred.splice(0, preferred.length, 'hidden_nonsense', 'disbelief');
    functions.push('chaos_oracle');
    visualPreferred.push('obscure', 'pepe', 'meme');
  }
  if (response.delivery === 'room_lore' || response.sro_intensity >= 2) {
    allowed.push('recognition', 'smug', 'goofy_irony');
    visualPreferred.push('sro_custom', 'pepe', 'meme');
  }
  if (response.league_intensity >= 2) visualPreferred.push('league', 'pepe', 'meme');
  if ((response.concepts_any ?? []).some((value) => /build|feedmax|cook/.test(value))) {
    allowed.push('cursed_build', 'approval', 'disbelief');
    functions.push('cursed_build');
  }
  if (response.reply_move === 'mock_sentence') functions.push('mock_sentence');
  if (response.reply_move === 'location_answer') functions.push('location_status', 'watching_reaction');
  if (['mock_accusation', 'blame_shift'].includes(response.reply_move)) functions.push('roast');
  if (response.payoff_family === 'cope') functions.push('cope_prophecy');
  if (bundleConcepts.has('room_doubters_believers') || cues.functions.includes('gamba_reaction')) targetContexts.push('gamba');
  if (functions.includes('moderation_reaction')) targetContexts.push('moderation');
  if (functions.includes('roast')) targetContexts.push('roast');
  if (functions.includes('failure_reaction')) targetContexts.push('failure_reaction');
  targetContexts.push(...functions);

  const bundleSerious = (bundle?.states ?? []).some((item) => item.label === 'serious');
  const seriousReply = response.seriousness >= 3 || bundleSerious || bundleConcepts.has('job_decision') || (response.concepts_any ?? []).includes('job_decision');
  if (seriousReply) {
    forbidden.push('laughter', 'hard_laughter', 'light_laughter', 'rueful_laughter', 'mockery', 'rage', 'tilt', 'cringe', 'childish_mockery', 'hidden_nonsense');
    preferred.splice(0, preferred.length, 'neutral_reaction', 'approval', 'recognition');
    contextTags.push('serious_advice');
  }

  if (!preferred.length) preferred.push('neutral_reaction', 'disbelief');
  allowed.push(...preferred);

  const maxIntensity = seriousReply ? 0.45
    : response.delivery === 'chaos' ? 1
      : response.seriousness >= 2 ? 0.78 : 0.9;

  return {
    expressions_any: unique(allowed),
    expressions_preferred: unique(preferred),
    expressions_forbidden: unique(forbidden),
    discourse_functions_any: unique(functions),
    visual_families_preferred: unique(visualPreferred),
    context_tags: unique(contextTags),
    target_contexts: unique(targetContexts),
    compound_roles_any: unique(compoundRoles),
    compound_preferred: false,
    min_intensity: 0,
    max_intensity: maxIntensity,
    allow_hidden_nonsense: response.delivery === 'chaos' || response.chaos > 0 || response.reply_move === 'omen',
    pinned_emote: response.emote ?? null,
    quota_exempt: seriousReply,
    base_probability_override: seriousReply ? 0 : null,
    route_family: bundle?.route_family ?? null,
  };
}

function matchedSpecificResponse(response, bundle) {
  const concepts = new Set((bundle?.concepts ?? []).map((item) => item.label));
  const entities = new Set((bundle?.entities ?? []).filter((item) => item.resolution_status === 'verified').map((item) => item.value));
  return (response.concepts_any ?? []).some((value) => concepts.has(value))
    || (response.concepts_all ?? []).some((value) => concepts.has(value))
    || (response.entities_required ?? []).some((value) => entities.has(value));
}

export function resolveEmotePolicy(response, bundle = null) {
  const contextual = deriveEmotePolicy(response, bundle);
  const authored = response.emote_policy;
  if (!authored) return contextual;

  const contextualAllowed = new Set(contextual.expressions_any ?? []);
  const authoredPreferred = (authored.expressions_preferred ?? []).filter((value) => contextualAllowed.has(value));
  const preferred = matchedSpecificResponse(response, bundle) && authoredPreferred.length
    ? authoredPreferred
    : contextual.expressions_preferred;

  return {
    expressions_any: unique([...(contextual.expressions_any ?? []), ...(authored.expressions_any ?? []), ...preferred]),
    expressions_preferred: unique(preferred),
    expressions_forbidden: unique([...(contextual.expressions_forbidden ?? []), ...(authored.expressions_forbidden ?? [])]),
    discourse_functions_any: unique([...(contextual.discourse_functions_any ?? []), ...(authored.discourse_functions_any ?? [])]),
    visual_families_preferred: unique([...(authored.visual_families_preferred ?? []), ...(contextual.visual_families_preferred ?? [])]),
    context_tags: unique([...(contextual.context_tags ?? []), ...(authored.context_tags ?? [])]),
    target_contexts: unique([...(contextual.target_contexts ?? []), ...(authored.target_contexts ?? [])]),
    compound_roles_any: unique([...(contextual.compound_roles_any ?? []), ...(authored.compound_roles_any ?? [])]),
    compound_preferred: Boolean(contextual.compound_preferred || authored.compound_preferred),
    min_intensity: Math.max(contextual.min_intensity ?? 0, authored.min_intensity ?? 0),
    max_intensity: Math.min(contextual.max_intensity ?? 1, authored.max_intensity ?? 1),
    allow_hidden_nonsense: Boolean(contextual.allow_hidden_nonsense && authored.allow_hidden_nonsense),
    pinned_emote: authored.pinned_emote ?? contextual.pinned_emote ?? null,
    quota_exempt: Boolean(contextual.quota_exempt || authored.quota_exempt),
    base_probability_override: contextual.base_probability_override ?? authored.base_probability_override ?? null,
    route_family: bundle?.route_family ?? authored.route_family ?? null,
    policy_source: matchedSpecificResponse(response, bundle)
      ? 'authored_line_plus_exact_route'
      : 'route_context_plus_authored_constraints',
  };
}
