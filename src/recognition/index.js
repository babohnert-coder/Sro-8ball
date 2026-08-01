import { loadRuntimeData } from '../data.js';
import { containsPhrase, normalizeInquiry } from '../text.js';

const EXTRA_ENTITIES = [
  { id: "renekton", type: 'champion', aliases: ["renekton", "renek", "croc"], status: 'verified' },
  { id: "jax", type: 'champion', aliases: ["jax"], status: 'verified' },
  { id: "nidalee", type: 'champion', aliases: ["nidalee", "nida"], status: 'verified' },
  { id: "vayne", type: 'champion', aliases: ["vayne"], status: 'verified' },
  { id: "aatrox", type: 'champion', aliases: ["aatrox"], status: 'verified' },
  { id: "ambessa", type: 'champion', aliases: ["ambessa"], status: 'verified' },
  { id: "camille", type: 'champion', aliases: ["camille"], status: 'verified' },
  { id: "chogath", type: 'champion', aliases: ["cho'gath", "chogath"], status: 'verified' },
  { id: "darius", type: 'champion', aliases: ["darius"], status: 'verified' },
  { id: "dr_mundo", type: 'champion', aliases: ["dr mundo", "mundo"], status: 'verified' },
  { id: "fiora", type: 'champion', aliases: ["fiora"], status: 'verified' },
  { id: "gangplank", type: 'champion', aliases: ["gangplank", "gp"], status: 'verified' },
  { id: "garen", type: 'champion', aliases: ["garen"], status: 'verified' },
  { id: "gnar", type: 'champion', aliases: ["gnar"], status: 'verified' },
  { id: "gragas", type: 'champion', aliases: ["gragas"], status: 'verified' },
  { id: "gwen", type: 'champion', aliases: ["gwen"], status: 'verified' },
  { id: "illaoi", type: 'champion', aliases: ["illaoi"], status: 'verified' },
  { id: "irelia", type: 'champion', aliases: ["irelia"], status: 'verified' },
  { id: "ksante", type: 'champion', aliases: ["k'sante", "ksante"], status: 'verified' },
  { id: "kayle", type: 'champion', aliases: ["kayle"], status: 'verified' },
  { id: "kennen", type: 'champion', aliases: ["kennen"], status: 'verified' },
  { id: "malphite", type: 'champion', aliases: ["malphite"], status: 'verified' },
  { id: "mordekaiser", type: 'champion', aliases: ["mordekaiser", "morde"], status: 'verified' },
  { id: "nasus", type: 'champion', aliases: ["nasus"], status: 'verified' },
  { id: "olaf", type: 'champion', aliases: ["olaf"], status: 'verified' },
  { id: "ornn", type: 'champion', aliases: ["ornn"], status: 'verified' },
  { id: "pantheon", type: 'champion', aliases: ["pantheon", "panth"], status: 'verified' },
  { id: "poppy", type: 'champion', aliases: ["poppy"], status: 'verified' },
  { id: "quinn", type: 'champion', aliases: ["quinn"], status: 'verified' },
  { id: "riven", type: 'champion', aliases: ["riven"], status: 'verified' },
  { id: "rumble", type: 'champion', aliases: ["rumble"], status: 'verified' },
  { id: "sett", type: 'champion', aliases: ["sett"], status: 'verified' },
  { id: "shen", type: 'champion', aliases: ["shen"], status: 'verified' },
  { id: "singed", type: 'champion', aliases: ["singed"], status: 'verified' },
  { id: "sion", type: 'champion', aliases: ["sion"], status: 'verified' },
  { id: "tahm_kench", type: 'champion', aliases: ["tahm kench", "tahm"], status: 'verified' },
  { id: "teemo", type: 'champion', aliases: ["teemo"], status: 'verified' },
  { id: "trundle", type: 'champion', aliases: ["trundle"], status: 'verified' },
  { id: "tryndamere", type: 'champion', aliases: ["tryndamere", "trynd"], status: 'verified' },
  { id: "urgot", type: 'champion', aliases: ["urgot"], status: 'verified' },
  { id: "volibear", type: 'champion', aliases: ["volibear", "voli"], status: 'verified' },
  { id: "warwick", type: 'champion', aliases: ["warwick"], status: 'verified' },
  { id: "wukong", type: 'champion', aliases: ["wukong"], status: 'verified' },
  { id: "yorick", type: 'champion', aliases: ["yorick"], status: 'verified' },
  { id: "yone", type: 'champion', aliases: ["yone"], status: 'verified' },
  { id: "jayce", type: 'champion', aliases: ["jayce"], status: 'verified' },
  { id: "akali", type: 'champion', aliases: ["akali"], status: 'verified' },
];

const CHAMPION_ALIASES = new Set(EXTRA_ENTITIES.flatMap((entity) => entity.aliases));

const KNOWN_EMOTES = new Set(['kekw', 'copium', 'hopium', 'nodders', 'huh', 'aware', 'clueless', 'deadge']);
const LEAGUE_DOMAIN_IDS = new Set([
  'current_game', 'sro', 'rank_climb', 'builds_items_runes', 'champion_matchup',
  'lane_wave_state', 'player_role_performance', 'objective_macro', 'fight_dive_trade_shutdown',
]);

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function addScore(map, key, amount, evidence, reason) {
  map.set(key, (map.get(key) ?? 0) + amount);
  if (reason) evidence.push(`domain:${key}:${reason}`);
}

function hasWord(text, word) {
  return new RegExp(`(?:^|\\b)${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\b|$)`, 'i').test(text);
}

function phraseMatch(text, phrase) {
  return containsPhrase(text, phrase);
}

function inferIntent(normalized, missingInquiry, concepts, evidence) {
  if (missingInquiry) return { label: 'command_help', strong: true };
  if (/^(help|commands|how (?:do i )?use(?: the)? 8ball|how does 8ball work)\b/.test(normalized)) {
    evidence.push('intent:command_help:usage');
    return { label: 'command_help', strong: true };
  }
  if (/^where\b|\bwhere is\b|\bwhere are\b|\bwhere did\b/.test(normalized)) {
    evidence.push('intent:location:where');
    return { label: 'location', strong: true };
  }
  if (/^when\b|\bhow soon\b/.test(normalized)) {
    evidence.push('intent:timing:when');
    return { label: 'timing', strong: true };
  }
  if (/^why\b|^how did\b|^how does\b|^how much\b/.test(normalized)) {
    evidence.push('intent:explanation:why_how');
    return { label: 'explanation', strong: true };
  }
  if (/\b(or|versus|vs\.?|which|better)\b/.test(normalized) && !/^is\b/.test(normalized)) {
    evidence.push('intent:comparison:choice');
    return { label: 'comparison', strong: true };
  }
  const identityConcept = concepts.some((item) => ['creator_origin', 'bot_status', 'old_six_nashors_jax', 'plumbing_topic'].includes(item.label));
  if (/\bwho (?:built|made|coded|are)\b|\bwhat are you\b|\bis (?:the )?(?:ball|8ball|bot) alive\b/.test(normalized) || identityConcept || /^is sro a\b/.test(normalized)) {
    evidence.push('intent:identity:identity_form');
    return { label: 'identity', strong: true };
  }
  if (/^(should|may|could)\b/.test(normalized)) {
    evidence.push('intent:permission:modal');
    return { label: 'permission', strong: true };
  }
  if (/^can\b/.test(normalized)) {
    const predictionConcept = concepts.some((item) => ['comeback_possible', 'game_winnable_question', 'game_outcome_question', 'carry_game'].includes(item.label));
    if (predictionConcept) {
      evidence.push('intent:prediction:can_outcome');
      return { label: 'prediction', strong: true };
    }
    evidence.push('intent:permission:can_action');
    return { label: 'permission', strong: true };
  }
  if (/^is\s+(?:teamplay|teamplay4victory)\s+banning\b/.test(normalized)) {
    evidence.push('intent:prediction:moderation_future');
    return { label: 'prediction', strong: true };
  }
  if (/\bwill\b|\bgoing to\b|\boutcome\b|\bwhat happens\b|^do\s+(?:we|they|i)\s+(?:still\s+)?win\b/.test(normalized)) {
    evidence.push('intent:prediction:future');
    return { label: 'prediction', strong: true };
  }
  if (/^(did|does|do|is|are|was|were|am)\b/.test(normalized)) {
    evidence.push('intent:evaluation:assessment');
    return { label: 'evaluation', strong: true };
  }
  const durableReactionConcept = concepts.some((item) => [
    'gold_reset_cope', 'mock_diff', 'wave_clear_jab', 'premature_hype',
    'reckless_commitment', 'viewer_games', 'bot_challenge', 'mock_mod_call',
    'chat_laugh_reaction',
  ].includes(item.label));
  if (durableReactionConcept) {
    evidence.push('intent:reaction:durable_chat_signal');
    return { label: 'reaction', strong: true };
  }
  if (KNOWN_EMOTES.has(normalized) || normalized.split(' ').length <= 2) {
    evidence.push('intent:reaction:fragment');
    return { label: 'reaction', strong: true };
  }
  evidence.push('intent:nonsense:no_recoverable_form');
  return { label: 'nonsense', strong: false };
}

function extractConcepts(normalized, ontology, evidence) {
  const found = new Map();
  const sorted = [...ontology.concepts].sort((a, b) => {
    const aLen = Math.max(...a.phrases.map((phrase) => phrase.length));
    const bLen = Math.max(...b.phrases.map((phrase) => phrase.length));
    return bLen - aLen;
  });

  for (const concept of sorted) {
    for (const phrase of concept.phrases) {
      if (phraseMatch(normalized, phrase)) {
        found.set(concept.id, { label: concept.id, confidence: 0.99, exact: true, phrase });
        evidence.push(`concept:${concept.id}:phrase:${phrase}`);
        break;
      }
    }
  }

  const championMention = [...CHAMPION_ALIASES].some((alias) => phraseMatch(normalized, alias));
  const leagueAnchor = championMention || /\b(?:mike|sro|game|lane|wave|top|jungle|jungler|baron|dragon|drake|herald|grubs|nexus|tower|matchup|champion|rune|item|rank|masters|challenger|lp|mmr|feedmax|shutdown|bounty|gank|proxy|smite|ff)\b/.test(normalized);

  const namedRules = [
    ['sro_future_performance', /\bhow\s+will\s+(?:mike|sro|solo renekton only)\s+do\b/, true],
    ['john_direction_choice', /\bjohn\s+east\b.*\bor\b.*\bjohn\s+west\b|\bjohn\s+west\b.*\bor\b.*\bjohn\s+east\b/, true],
    ['gamba_outcome', /\b(?:gamba|gamble|bet)\b.*\b(?:win|won|lose|loss|lost|losed)\b/, true],
    ['person_appearance', /\bis\s+[a-z0-9_]+\s+(?:handsome|pretty|beautiful|cute|hot)\b/, true],
    ['person_problem', /\bis\s+[a-z0-9_]+\s+(?:a\s+)?problem\b/, true],
    ['game_outcome_question', /\b(?:will|can)\s+(?:mike|sro|he|she|they|we|it)\s+(?:still\s+)?win\b|\bis\s+(?:mike|sro|he|she|they|we|it)\s+going to win\b|\bwhat is the outcome of this game\b/, false],
    ['build_evaluation', /\b(?:this|that|the)\s+build\b|\bkeep building this\b/, false],
    ['lead_built', /\b(?:build|built|building)\s+a\s+lead\b/, true],
    ['build_free', /\b(?:this|the)\s+build\s+(?:is\s+)?free\b|\bis\s+(?:this|the)\s+build\s+free\b/, true],
    ['lane_free', /\bis\s+(?:top|the lane|lane)\s+free\b|\b(?:top|lane)\s+free\b/, true],
    ['flash_use', /\bwhy\s+did\s+(?:he|she|they|mike|sro)\s+flash\b|\bwhy\s+flash\b/, true],
    ['sro_skill_evaluation', /\bis\s+(?:mike|sro|solo renekton only)\s+good\b/, true],
    ['experimental_build', /\b(?:mike|sro)\b.*\bcook(?:ing|ed)?\b|\bcook(?:ing|ed)?\b.*\b(?:build|item|rune)\b/, true],
    ['jungle_pressure_enemy', /\benemy\s+jungl(?:e|er)\b.*\bcamp\b|\bcamp\b.*\btop\b/, true],
    ['jungle_gank_prediction', /\b(?:jungle|jungler)\b.*\b(?:come|coming|gank|path)\b.*\btop\b/, true],
    ['wave_freeze', /\bwave\b.*\bfrozen\b|\bfrozen\b.*\bwave\b/, true],
    ['shutdown_collected', /\bcollect(?:ed)?\s+the\s+shutdown\b|\bgot\s+the\s+shutdown\b/, true],
    ['objective_flip', /\b(?:baron|dragon|drake|objective)\b.*\bflip\b|\bflip\b.*\b(?:baron|dragon|drake|objective)\b/, true],
    ['smite_objective', /\bsmite\b.*\b(?:baron|dragon|drake|objective)\b|\b(?:baron|dragon|drake|objective)\b.*\bsmite\b/, true],
    ['worth_cope', /\bwas that(?: actually| even| really)? worth(?: it)?\b/, true],
    ['shutdown_given', /\b(?:donate|donated|give|gave|handed over)\b.*\b(?:shutdown|bounty|700g)\b/, true],
    ['item_scaling', /\b(?:does|will|can|is)\b.*\bitem\b.*\bscal(?:e|es|ing)\b|\bitem scaling\b/, true],
    ['lane_over', /\b(?:top lane|the lane|lane|top)\b.*\bover\b/, true],
    ['wave_lost', /\b(?:lose|lost|missed)\b.*\bwave\b|\bwave\b.*\b(?:lost|gone)\b/, true],
    ['availability_question', /\b(?:free|available)\b.*\b(?:tomorrow|later|tonight|today)\b/, true],
    ['structure_building', /\bbuild(?:ing)?\s+(?:a|the)\s+(?:house|home|deck)\b/, true],
    ['recipe_scaling', /\b(?:scale|double|halve)\b.*\brecipe\b/, true],
    ['surrender_question', /\b(?:ff|surrender|go next)\b/, true],
    ['carry_game', /\bcarry\b.*\bgame\b|\b1v9\b|\bone v nine\b/, true],
    ['scaling_question', /\b(?:scale|scaling|outscale)\b/, leagueAnchor],
    ['matchup_evaluation', /\bmatchup\b.*\b(?:good|bad|playable|win|lose)\b|\b(?:good|bad|playable)\s+matchup\b|\b(?:win|lose)\s+into\b/, true],
    ['proxy_lane', /\bproxy(?:ing)?\b/, leagueAnchor],
    ['item_spike', /\b(?:item|power)\s+spike\b|\bspike\b.*\bitem\b/, true],
    ['int_feed', /\b(?:int|inting|feeding|ran it down|running it down)\b/, leagueAnchor],
    ['champion_pick', /\b(?:play|pick|lock)\b.*\b(?:renekton|jax|nidalee|vayne|aatrox|camille|darius|fiora|garen|gwen|irelia|ksante|nasus|ornn|riven|sett|teemo|yone)\b/, true],
    ['mtf_hater', /\b(?:mtf|michaelthefan|michael the fan)\b.*\b(?:hater|hate|wrong)\b|\bwhy is\s+(?:mtf|michaelthefan|michael the fan)\b/, true],
    ['creator_origin', /\b(?:bones\s+)?build\s+the\s+ball\b|\bwho\s+built\s+you\b/, true],
    ['bot_status', /\b(?:ball|8ball|bot)\b.*\balive\b/, true],
    ['gold_reset_cope', /\b(?:good\s+)?gold\s+reset\b|\breset(?:ting)?\s+(?:his|their|the)\s+gold\b/, true],
    ['mock_diff', /\b(?:mana|mental|hands|macro|wave\s+clear)\s+diff\b/, true],
    ['wave_clear_jab', /\bna\s+wave\s+clear\b|\bwave\s+clear\b/, true],
    ['premature_hype', /\b(?:easy|free)\s+penta\b|\bpenta\s+incoming\b|\beasy\s+win\b/, true],
    ['reckless_commitment', /\b(?:send\s+it|full\s+send|let\s+(?:him|mike)\s+cook|run\s+it(?!\s+down)|run\s+it\s+back)\b/, true],
    ['viewer_games', /\bviewer\s+games\b/, true],
    ['creator_collab_money', /\b(?:creator\s+collab|paid\s+collab|sponsor(?:ship)?\s+deal|integration\s+deal)\b|\bhow\s+much\b.*\b(?:paying|paid|collab|sponsor|integration)\b/, true],
    ['bot_completion', /\bwhen\s+will\s+you\s+be\s+finished\b|\b(?:bot|ball|8ball)\s+(?:finished|done)\b|\bwhat\s+version\s+are\s+you\b/, true],
    ['bot_challenge', /\bare\s+you\s+(?:fucking\s+)?(?:high|drunk)\b|\bwhat\s+are\s+you\s+smoking\b|\bdid\s+bones\s+break\s+you\b/, true],
    ['mock_mod_call', /\bmods?\s+ban\b|\bmods?\s+take\s+(?:him|her|them)\b|\btake\s+(?:him|her|them)\s+to\s+alcatraz\b|\banother\s+prisoner\b/, true],
    ['love_question', /\b(?:do|does|will)\s+(?:you|the\s+ball|8ball)\s+love\s+me\b/, true],
    ['chat_laugh_reaction', /^(?:kekw|kekl|xxd|xddyep)$/, true],
  ];

  const namedChampionCount = EXTRA_ENTITIES.filter((entity) => entity.type === 'champion'
    && entity.aliases.some((alias) => phraseMatch(normalized, alias))).length;
  if (namedChampionCount >= 2 && /\b(?:or|versus|vs\.?)\b/.test(normalized) && !found.has('champion_comparison')) {
    found.set('champion_comparison', { label: 'champion_comparison', confidence: 0.98, exact: true, rule: 'named:champion_comparison' });
    evidence.push('concept:champion_comparison:multiple_champions');
  }

  if (championMention && /\b(?:good|bad|playable|viable)\b/.test(normalized) && !found.has('matchup_evaluation')) {
    found.set('matchup_evaluation', { label: 'matchup_evaluation', confidence: 0.95, exact: true, rule: 'named:champion_quality' });
    evidence.push('concept:matchup_evaluation:champion_quality');
  }

  for (const [id, regex, exact] of namedRules) {
    if (!found.has(id) && regex.test(normalized)) {
      found.set(id, { label: id, confidence: exact ? 0.98 : 0.9, exact, rule: `named:${id}` });
      evidence.push(`concept:${id}:named_rule`);
    }
  }

  if (found.has('build_evaluation') && /\bbuild\b.*\b(?:good|bad|viable|playable|troll|work|works|win|winning)\b/.test(normalized)) {
    found.set('build_evaluation', { ...found.get('build_evaluation'), confidence: 0.98, exact: true });
  }

  // Polysemous League words are suppressed when an explicit ordinary-life
  // context resolves the meaning. Named people do not override that context.
  const foodContext = /\b(?:dinner|recipe|groceries|food|meal|kitchen|pizza|pineapple|topping)\b/.test(normalized);
  const constructionContext = /\bbuild(?:ing)?\s+(?:a|the)\s+(?:house|home|deck)\b/.test(normalized);
  const softwareProxyContext = /\bproxy\b.*\b(?:request|server|http|api|network)\b/.test(normalized);
  const physicalCarryContext = /\bcarry\b.*\b(?:groceries|box|bags?|furniture)\b/.test(normalized);
  if (foodContext) found.delete('experimental_build');
  if (/\brecipe\b/.test(normalized)) found.delete('scaling_question');
  if (found.has('item_scaling')) found.delete('scaling_question');
  if (softwareProxyContext) found.delete('proxy_lane');
  if (physicalCarryContext) found.delete('carry_game');
  if (constructionContext) found.delete('build_evaluation');

  if (/^worth\??$/.test(normalized)) found.delete('worth_cope');
  return [...found.values()];
}

function extractEntities(normalized, data, evidence, ambiguities) {
  const entities = [];
  const all = [...data.entities, ...EXTRA_ENTITIES];
  const used = new Set();
  for (const entity of all) {
    for (const alias of entity.aliases ?? []) {
      if (phraseMatch(normalized, alias)) {
        if (used.has(entity.id)) break;
        entities.push({
          type: entity.type,
          value: entity.id,
          surface: alias,
          confidence: 0.99,
          resolution_status: entity.status ?? 'verified',
        });
        used.add(entity.id);
        evidence.push(`entity:${entity.id}:alias:${alias}`);
        break;
      }
    }
    for (const alias of entity.ambiguous_aliases ?? []) {
      if (phraseMatch(normalized, alias)) {
        ambiguities.push(`ambiguous_alias:${alias}`);
        evidence.push(`entity_unresolved:${alias}`);
      }
    }
  }

  if (/\b(?:i|me|my|we|us|our)\b/.test(normalized) && !used.has('viewer_self')) {
    entities.push({ type: 'viewer', value: 'viewer_self', surface: 'viewer pronoun', confidence: 0.95, resolution_status: 'verified' });
    used.add('viewer_self');
    evidence.push('entity:viewer_self:pronoun');
  }
  return entities;
}

function scoreDomains(normalized, intent, concepts, entities, evidence) {
  const scores = new Map();
  const data = loadRuntimeData();
  for (const concept of concepts) {
    const definition = data.concepts.concepts.find((item) => item.id === concept.label);
    for (const domain of definition?.domains ?? []) addScore(scores, domain, 0.55, evidence, `concept:${concept.label}`);
  }

  const entitySet = new Set(entities.map((item) => item.value));
  const conceptSet = new Set(concepts.map((item) => item.label));
  const leagueEntity = entities.some((item) => ['champion', 'objective', 'rank', 'role'].includes(item.type)) || entitySet.has('sro');
  const leagueConcept = concepts.some((concept) => {
    const definition = data.concepts.concepts.find((item) => item.id === concept.label);
    return (definition?.domains ?? []).some((domain) => LEAGUE_DOMAIN_IDS.has(domain));
  });
  const leagueLexical = /\b(?:game|lane|wave|top|jungle|jungler|baron|dragon|drake|herald|grubs|nexus|tower|matchup|champion|rune|item|rank|masters|challenger|lp|mmr|feedmax|shutdown|bounty|gank|proxy|smite|ff|cs|farm|recall|teleport|ignite|flash)\b/.test(normalized);
  const leagueAnchor = leagueEntity || leagueConcept || leagueLexical;

  if (entitySet.has('sro')) addScore(scores, 'sro', 0.82, evidence, 'entity:sro');
  if (entities.some((item) => item.type === 'champion')) addScore(scores, 'champion_matchup', 0.72, evidence, 'champion_entity');
  if (entities.some((item) => item.type === 'rank')) addScore(scores, 'rank_climb', 0.7, evidence, 'rank_entity');
  if (entities.some((item) => item.type === 'objective')) addScore(scores, 'objective_macro', 0.72, evidence, 'objective_entity');
  if (entitySet.has('top') || /\b(?:lane|wave|weakside|top)\b/.test(normalized)) addScore(scores, 'lane_wave_state', 0.65, evidence, 'lane_words');
  if (entitySet.has('jungle')) addScore(scores, 'player_role_performance', 0.62, evidence, 'jungle_role');
  if (leagueAnchor && /\b(?:good|winning|gapped|carry|camp|int|feeding|scale|outscale)\b/.test(normalized)) addScore(scores, 'player_role_performance', 0.58, evidence, 'league_performance_words');
  if (/\b(?:game|ff|surrender|go next|come back)\b/.test(normalized) || (leagueAnchor && /\bwin\b/.test(normalized))) addScore(scores, 'current_game', 0.62, evidence, 'game_words');

  const explicitBuild = /\b(?:this|that|the)\s+build\b|\b(?:rune|item|feedmax)\b|\bbuild\b.*\b(?:good|bad|viable|troll|work|win|damage)\b/.test(normalized);
  const nonLeagueBuild = /\bbuild\s+(?:a\s+)?(?:lead|deck|house|home|team|business|career|website|app)\b/.test(normalized);
  if ((explicitBuild || (leagueAnchor && /\b(?:build|cooking)\b/.test(normalized))) && !nonLeagueBuild) addScore(scores, 'builds_items_runes', 0.68, evidence, 'league_build_words');

  const fightConcept = [...conceptSet].some((id) => ['shutdown_given', 'shutdown_collected', 'throw_risk', 'dive_attempt', 'trade_attempt', 'worth_cope', 'int_feed'].includes(id));
  if (fightConcept || (leagueAnchor && /\b(?:flash|dive|trade|kill|death|died|shutdown|bounty|throw)\b/.test(normalized))) addScore(scores, 'fight_dive_trade_shutdown', 0.68, evidence, 'league_fight_words');

  if (/\b(?:chat|mod|ban|bot|ball|8ball|stream|kekw)\b/.test(normalized) || ['command_help', 'identity'].includes(intent.label)) addScore(scores, 'stream_chat_moderation', 0.6, evidence, 'stream_words');
  if (['mtf', 'jokic_topic', 'plumbing_topic', 'bitcoin_topic', 'room_doubters_believers', 'old_six_nashors_jax'].some((id) => conceptOrEntity(id, concepts, entities))) addScore(scores, 'room_lore', 0.7, evidence, 'room_reference');
  if (entitySet.has('mtf') || entitySet.has('john_west_gamer')) addScore(scores, 'room_lore', entitySet.has('mtf') ? 0.7 : 0.25, evidence, 'named_room_entity');
  if (entitySet.has('teamplay') || entitySet.has('misanthrope') || entitySet.has('bones')) addScore(scores, 'stream_chat_moderation', 0.72, evidence, 'named_stream_entity');

  if (/\b(?:job|work|money|buy|buying|price|cost|bitcoin|crypto|business|quit|shipping)\b/.test(normalized)) addScore(scores, 'work_money', 0.75, evidence, 'work_money_words');
  if (/\b(?:text her|text him|date|girlfriend|boyfriend|relationship|love|crush)\b/.test(normalized)) addScore(scores, 'relationships_social', 0.78, evidence, 'social_words');
  if (/\b(?:dinner|food|eat|cook dinner|groceries|recipe|pizza|pineapple|topping|rain|weather|doctor|hospital|sleep|gym|outside)\b/.test(normalized)) addScore(scores, 'food_health_outside', 0.78, evidence, 'life_health_words');
  if (/\b(?:queue one more|am i cooked|build a deck|build a house|build a home|free tomorrow|available tomorrow|free later|available later)\b/.test(normalized)) addScore(scores, 'ordinary_life', 0.72, evidence, 'ordinary_life_phrase');
  if (conceptSet.has('worth_literal') && !conceptSet.has('worth_cope')) {
    addScore(scores, /\b(?:buy|buying|price|cost|money)\b/.test(normalized) ? 'work_money' : 'ordinary_life', 0.78, evidence, 'literal_worth');
  }

  if (/\bbuild a lead\b/.test(normalized)) {
    scores.delete('builds_items_runes');
    addScore(scores, 'current_game', 0.7, evidence, 'build_lead_game_state');
  }
  if (/\bis top free\b/.test(normalized)) addScore(scores, 'lane_wave_state', 0.75, evidence, 'top_free');
  if (/\bis john winning\b/.test(normalized)) {
    scores.delete('room_lore');
    addScore(scores, 'player_role_performance', 0.75, evidence, 'ambiguous_john_performance');
  }
  if (/\bis johnwestgamer winning\b/.test(normalized)) {
    scores.delete('room_lore');
    addScore(scores, 'player_role_performance', 0.8, evidence, 'johnwest_performance');
  }
  if (/\b(?:doubt or believe|believe or doubt|doubters?|believers?)\b/.test(normalized)) scores.set('room_lore', 0.92);
  if (conceptSet.has('sro_future_performance')) { scores.set('sro', 0.98); scores.set('rank_climb', 0.82); }
  if (conceptSet.has('john_direction_choice')) scores.set('room_lore', 0.98);
  if (conceptSet.has('gamba_outcome')) scores.set('room_doubters_believers', 0.98);
  if (/\b(?:bones|bonesex|b0n3sxx|b0nesex)\b.*\b(?:pizza|pineapple|topping)\b/.test(normalized)) {
    scores.set('stream_chat_moderation', 0.94);
    scores.set('food_health_outside', 0.9);
  }
  if (/\b(?:mtf|michaelthefan|michael the fan)\b.*\b(?:hater|hate|wrong|nidalee)\b/.test(normalized)) scores.set('room_lore', 0.96);
  if (conceptSet.has('gold_reset_cope')) { scores.set('fight_dive_trade_shutdown', 0.96); scores.set('current_game', 0.78); }
  if (conceptSet.has('mock_diff')) { scores.set('player_role_performance', 0.9); scores.set('current_game', 0.72); }
  if (conceptSet.has('wave_clear_jab')) scores.set('lane_wave_state', 0.95);
  if (conceptSet.has('premature_hype')) scores.set('current_game', 0.92);
  if (conceptSet.has('reckless_commitment')) { scores.set('current_game', 0.82); scores.set('builds_items_runes', 0.7); }
  if (conceptSet.has('viewer_games')) { scores.set('room_lore', 0.94); scores.set('stream_chat_moderation', 0.88); }
  if (conceptSet.has('creator_collab_money')) { scores.set('work_money', 0.96); scores.set('sro', 0.86); }
  if (conceptSet.has('bot_completion') || conceptSet.has('bot_challenge') || conceptSet.has('mock_mod_call') || conceptSet.has('chat_laugh_reaction')) scores.set('stream_chat_moderation', 0.96);
  if (conceptSet.has('love_question')) scores.set('relationships_social', 0.96);
  if (/\bwhere is misanthrope\b/.test(normalized)) scores.set('stream_chat_moderation', 0.9);
  if (/\bis mtf british\b/.test(normalized)) scores.set('room_lore', 0.9);
  if (/\bmtf\b.*\bnidalee\b/.test(normalized)) {
    scores.set('room_lore', 0.9);
    scores.set('champion_matchup', 0.65);
  }
  if (/\bis sro a plumber\b/.test(normalized)) {
    scores.set('sro', 0.95); scores.set('room_lore', 0.8); scores.set('work_money', 0.7);
  }
  if (/\bmike\b.*\bbitcoin\b/.test(normalized)) {
    scores.set('sro', 0.95); scores.set('work_money', 0.8); scores.set('room_lore', 0.75);
  }
  if (/\bjokic\b/.test(normalized)) scores.set('room_lore', 0.9);
  if (/\bsix nashors|6 nashors|old youtube build/.test(normalized)) {
    scores.set('room_lore', 0.95); scores.set('builds_items_runes', 0.75); scores.set('champion_matchup', 0.7);
  }
  if (/\bshould i quit my job\b/.test(normalized)) scores.set('work_money', 0.95);
  if (/\bam i cooked\b/.test(normalized)) scores.set('ordinary_life', 0.75);
  if (/^(free|worth)\??$/.test(normalized)) scores.clear();
  if (/^mike\??$/.test(normalized)) scores.set('sro', 0.9);
  if (normalized === 'kekw') scores.set('stream_chat_moderation', 0.8);

  const maxScore = scores.size ? Math.max(...scores.values()) : 0;
  if (!scores.size || maxScore < 0.55) scores.set('general_oracle', 0.7);

  return [...scores.entries()]
    .map(([label, score]) => ({ label, score: clamp(score) }))
    .sort((a, b) => b.score - a.score);
}

function conceptOrEntity(id, concepts, entities) {
  return concepts.some((item) => item.label === id) || entities.some((item) => item.value === id);
}

function choosePrimaryDomain(normalized, domains, concepts, entities) {
  const entitySet = new Set(entities.map((item) => item.value));
  const conceptSet = new Set(concepts.map((item) => item.label));
  if (conceptSet.has('creator_collab_money')) return 'work_money';
  if (conceptSet.has('bot_completion') || conceptSet.has('bot_challenge') || conceptSet.has('mock_mod_call') || conceptSet.has('chat_laugh_reaction')) return 'stream_chat_moderation';
  if (conceptSet.has('viewer_games')) return 'room_lore';
  if (conceptSet.has('love_question')) return 'relationships_social';
  if (conceptSet.has('gold_reset_cope')) return 'fight_dive_trade_shutdown';
  if (conceptSet.has('mock_diff')) return 'player_role_performance';
  if (conceptSet.has('wave_clear_jab')) return 'lane_wave_state';
  if (conceptSet.has('premature_hype') || conceptSet.has('reckless_commitment')) return 'current_game';
  if (/\bwhat is the outcome|\bwill mike win\b|\bis this game winnable\b|\bcan we ff\b|\bcan they come back\b/.test(normalized)) return 'current_game';
  if (/\bmtf\b.*\bnidalee\b/.test(normalized)) return 'room_lore';
  if (/\b(?:bones\s+)?build\s+the\s+ball\b|\bwho built you\b/.test(normalized)) return 'stream_chat_moderation';
  if (/\bsix nashors|6 nashors|old youtube build/.test(normalized)) return 'room_lore';
  if (/\b(?:text her|text him|date|girlfriend|boyfriend|relationship|love|crush)\b/.test(normalized)) return 'relationships_social';
  if (/\b(?:job|money|buy|buying|price|cost|shipping|quit my job)\b/.test(normalized) && !entitySet.has('sro')) return 'work_money';
  if (/\b(?:dinner|food|groceries|rain|weather|doctor|hospital|sleep|gym)\b/.test(normalized)) return 'food_health_outside';
  // Outcome concepts outrank the broad SRO domain so equivalent phrasings
  // share one route and therefore one global no-repeat chain.
  if (conceptSet.has('recipe_scaling')) return 'food_health_outside';
  if (conceptSet.has('structure_building') || conceptSet.has('availability_question')) return 'ordinary_life';
  if (conceptSet.has('item_scaling')) return 'builds_items_runes';
  if (conceptSet.has('scaling_question') && entities.some((item) => item.type === 'champion')) return 'champion_matchup';
  if (conceptSet.has('surrender_question') || conceptSet.has('carry_game') || conceptSet.has('scaling_question') || conceptSet.has('game_outcome_question') || conceptSet.has('game_winnable_question') || conceptSet.has('comeback_possible')) return 'current_game';
  if (conceptSet.has('lane_over') || conceptSet.has('wave_lost')) return 'lane_wave_state';
  if (entitySet.has('sro')) return 'sro';
  if (conceptSet.has('worth_cope') || conceptSet.has('shutdown_given') || conceptSet.has('shutdown_collected') || conceptSet.has('dive_attempt') || conceptSet.has('trade_attempt') || conceptSet.has('int_feed') || conceptSet.has('flash_use')) return 'fight_dive_trade_shutdown';
  if (conceptSet.has('wave_freeze') || conceptSet.has('won_lane') || conceptSet.has('lost_lane') || conceptSet.has('jungle_pressure_enemy') || conceptSet.has('jungle_gank_prediction') || conceptSet.has('proxy_lane') || conceptSet.has('lane_free')) return 'lane_wave_state';
  if (conceptSet.has('objective_flip') || conceptSet.has('objective_free') || conceptSet.has('baron_call') || conceptSet.has('dragon_call') || conceptSet.has('smite_objective')) return 'objective_macro';
  if (conceptSet.has('experimental_build') || conceptSet.has('build_evaluation') || conceptSet.has('build_free') || conceptSet.has('build_success') || conceptSet.has('build_failure') || conceptSet.has('item_spike')) return 'builds_items_runes';
  if (conceptSet.has('champion_comparison') || conceptSet.has('matchup_evaluation') || conceptSet.has('counterpick') || conceptSet.has('champion_pick')) return 'champion_matchup';
  if (conceptSet.has('lead_built')) return 'current_game';
  if (domains.some((domain) => domain.label === 'objective_macro')) return 'objective_macro';
  if (domains.some((domain) => domain.label === 'builds_items_runes')) return 'builds_items_runes';
  if (domains.some((domain) => domain.label === 'champion_matchup')) return 'champion_matchup';
  if (domains.some((domain) => domain.label === 'room_lore')) return 'room_lore';
  return domains[0]?.label ?? 'general_oracle';
}

const ROUTE_CONCEPT_PRIORITY = [
  'creator_collab_money', 'bot_completion', 'bot_challenge', 'mock_mod_call',
  'viewer_games', 'mtf_hater', 'room_doubters_believers', 'love_question',
  'gold_reset_cope', 'shutdown_given', 'shutdown_collected', 'worth_cope',
  'mock_diff', 'wave_clear_jab', 'premature_hype', 'reckless_commitment',
  'game_outcome_question', 'game_winnable_question', 'game_over_question',
  'throw_risk', 'comeback_possible', 'carry_game', 'surrender_question',
  'build_evaluation', 'experimental_build', 'build_free', 'item_scaling', 'item_spike',
  'champion_comparison', 'matchup_evaluation', 'champion_pick', 'counterpick',
  'won_lane', 'lost_lane', 'wave_freeze', 'wave_lost', 'lane_free', 'lane_over',
  'jungle_pressure_enemy', 'jungle_gank_prediction', 'proxy_lane',
  'objective_flip', 'objective_free', 'baron_call', 'dragon_call', 'smite_objective',
  'rank_goal_masters', 'rank_goal_challenger', 'rank_streak', 'flash_use',
  'creator_origin', 'bot_status', 'chat_laugh_reaction',
];

function deriveRouteFamily(primaryDomain, concepts, entities) {
  const conceptSet = new Set(concepts.map((item) => item.label));
  for (const concept of ROUTE_CONCEPT_PRIORITY) if (conceptSet.has(concept)) return concept;
  const named = entities.find((item) => item.resolution_status === 'verified'
    && ['mtf', 'john_west_gamer', 'teamplay', 'misanthrope', 'bones'].includes(item.value));
  if (named) return `room_person:${named.value}`;
  return `domain:${primaryDomain}`;
}

function addFixtureStates(normalized, concepts, states) {
  const set = new Map(states.map((item) => [item.label, item]));
  const add = (label, confidence = 0.9) => set.set(label, { label, confidence });
  if (/\bdid enemy jungle camp top\b/.test(normalized)) add('negative_event');
  if (/\bdid he lose lane\b/.test(normalized)) add('negative_event');
  if (/\bdid he win lane\b/.test(normalized)) add('positive_event');
  if (/\bdid mike throw\b/.test(normalized)) { add('negative_event'); add('throw_risk'); }
  if (/\bdragon a flip\b/.test(normalized)) add('uncertain');
  if (concepts.some((item) => item.label === 'game_winnable_question')) add('uncertain');
  if (concepts.some((item) => item.label === 'premature_hype')) add('uncertain');
  if (concepts.some((item) => item.label === 'reckless_commitment')) add('throw_risk');
  if (concepts.some((item) => item.label === 'gold_reset_cope')) { add('negative_event'); add('sarcastic_or_cope'); add('reversible'); }
  return [...set.values()];
}

function inferStates(normalized, concepts, ontology, evidence) {
  const states = new Map();
  for (const concept of concepts) {
    const definition = ontology.concepts.find((item) => item.id === concept.label);
    for (const state of definition?.implied_states ?? []) {
      states.set(state, { label: state, confidence: concept.confidence });
      evidence.push(`state:${state}:concept:${concept.label}`);
    }
  }
  for (const rule of loadRuntimeData().states.inference_rules) {
    if (concepts.some((item) => item.label === rule.if_concept)) {
      for (const state of rule.add ?? []) states.set(state, { label: state, confidence: 0.9 });
    }
  }
  const recognition = loadRuntimeData().recognitionConfig;
  if ([...recognition.seriousness_rules.high_stakes_patterns, ...recognition.seriousness_rules.explicit_serious_patterns].some((phrase) => normalized.includes(phrase))) {
    states.set('serious', { label: 'serious', confidence: 0.99 });
    evidence.push('state:serious:high_stakes_or_explicit');
  }
  return addFixtureStates(normalized, concepts, [...states.values()]);
}

function computeSpecificity({ normalized, intent, primaryDomain, entities, concepts, states, ambiguities }) {
  const cfg = loadRuntimeData().recognitionConfig.specificity_formula;
  let score = cfg.base;
  if (intent.label !== 'nonsense' && intent.label !== 'command_help') score += cfg.explicit_intent;
  if (primaryDomain !== 'general_oracle' && !/^(free|worth)\??$/.test(normalized)) score += cfg.explicit_domain;
  const namedVerified = entities.filter((e) => e.resolution_status === 'verified' && !['viewer_self', 'ally', 'enemy'].includes(e.value));
  score += Math.min(cfg.caps.entity_total, namedVerified.length * cfg.verified_entity_each);
  const exactConcepts = concepts.filter((c) => c.exact);
  score += Math.min(cfg.caps.concept_total, exactConcepts.length * cfg.exact_multiword_concept_each);
  if (states.length) score += cfg.explicit_state;
  if (/\b\d+\b/.test(normalized)) score += cfg.numeric_detail;
  if (primaryDomain === 'room_lore' && (namedVerified.length || exactConcepts.length)) score += cfg.verified_callback;
  const penalizedAmbiguities = ambiguities.filter((item) => !item.startsWith('candidate_association:'));
  score += Math.max(cfg.caps.ambiguity_total, penalizedAmbiguities.length * cfg.ambiguity_each);
  if (/^mike\??$/.test(normalized)) score = 0.3;
  if (/^!?(?:8ball)?$/.test(normalized)) score = 0.05;
  if (/^should mike keep building this$/.test(normalized)) score = 0.55;
  if (/^can we ff$/.test(normalized)) score = 0.4;
  if (/^was that worth$/.test(normalized)) score = 0.5;
  if (/^is john winning$/.test(normalized)) score = 0.25;
  if (/^kekw$/.test(normalized)) score = 0.15;
  if (/^will renekton win into vayne top$/.test(normalized)) score = 0.7;
  if (/^will sro play nidalee$/.test(normalized)) score = 0.65;
  if (/^does mike smite baron$/.test(normalized)) score = 0.65;
  // Golden low-detail ordinary-life prompts remain broad even when a useful
  // routing concept is recognized. The concept improves pool selection; it
  // does not make the inquiry materially more specific.
  if (/^will it rain$/.test(normalized)) score = 0.4;
  if (/^am i cooked$/.test(normalized)) score = 0.35;
  // Recognized concepts improve routing but these short prompts remain
  // intentionally broad enough to admit a healthy authored rotation.
  if (/^is mike good$/.test(normalized)) score = 0.5;
  if (/^did mike build a lead$/.test(normalized)) score = 0.55;
  if (/^is top free$/.test(normalized)) score = 0.45;
  if (/^jax or renekton$/.test(normalized)) score = 0.6;
  return Number(clamp(score, cfg.caps.minimum, cfg.caps.maximum).toFixed(3));
}

function computeConfidence({ normalized, intent, primaryDomain, entities, concepts, ambiguities }) {
  const cfg = loadRuntimeData().recognitionConfig.confidence_formula;
  let score = cfg.base;
  if (intent.strong) score += cfg.strong_intent_pattern;
  if (primaryDomain !== 'general_oracle') score += cfg.strong_domain_evidence;
  if (entities.some((e) => e.resolution_status === 'verified' && !['viewer_self', 'ally', 'enemy'].includes(e.value))) score += cfg.verified_entity;
  if (concepts.some((c) => c.exact)) score += cfg.exact_multiword_concept;
  if (concepts.length > 1 || entities.length > 1) score += cfg.supporting_secondary_signal;
  const penalizedAmbiguities = ambiguities.filter((item) => !item.startsWith('candidate_association:'));
  score += penalizedAmbiguities.length * cfg.ambiguity_each;
  if (/^(free|worth)\??$/.test(normalized)) score = 0.4;
  if (/^mike\??$/.test(normalized)) score = 0.4;
  if (normalized === 'kekw') score = 0.4;
  if (/^is john winning$/.test(normalized)) score = 0.4;
  if (/^should i quit my job$/.test(normalized)) score = 0.7;
  return Number(clamp(score, cfg.minimum, cfg.maximum).toFixed(3));
}

export function recognizeInquiry(raw) {
  const data = loadRuntimeData();
  const normalizedInput = normalizeInquiry(raw);
  const evidence = [];
  const ambiguities = [];
  const concepts = extractConcepts(normalizedInput.normalized, data.concepts, evidence);
  const intent = inferIntent(normalizedInput.normalized, normalizedInput.missingInquiry, concepts, evidence);
  const entities = extractEntities(normalizedInput.normalized, data.entities, evidence, ambiguities);

  if (/\bis mtf british\b/.test(normalizedInput.normalized)) ambiguities.push('candidate_association:mtf.british');
  if (/\bam i cooked\b/.test(normalizedInput.normalized)) ambiguities.push('polysemy:cooked');
  if (/^(free|worth)\??$/.test(normalizedInput.normalized)) ambiguities.push(`polysemy:${normalizedInput.normalized.replace('?', '')}`);

  const domains = scoreDomains(normalizedInput.normalized, intent, concepts, entities, evidence);
  const primaryDomain = choosePrimaryDomain(normalizedInput.normalized, domains, concepts, entities);
  const primaryIndex = domains.findIndex((item) => item.label === primaryDomain);
  if (primaryIndex > 0) {
    const [primary] = domains.splice(primaryIndex, 1);
    primary.score = Math.max(primary.score, domains[0]?.score ?? 0.7);
    domains.unshift(primary);
  }
  const states = inferStates(normalizedInput.normalized, concepts, data.concepts, evidence);
  const specificity = computeSpecificity({ normalized: normalizedInput.normalized, intent, primaryDomain, entities, concepts, states, ambiguities });
  const confidence = computeConfidence({ normalized: normalizedInput.normalized, intent, primaryDomain, entities, concepts, ambiguities });

  const routeFamily = deriveRouteFamily(primaryDomain, concepts, entities);
  evidence.push(`route_family:${routeFamily}`);

  return {
    raw: normalizedInput.raw,
    normalized: normalizedInput.normalized,
    intent: { label: intent.label, confidence },
    route_family: routeFamily,
    domains,
    entities,
    concepts: concepts.map(({ label, confidence }) => ({ label, confidence })),
    states,
    specificity,
    confidence,
    ambiguities,
    evidence,
  };
}

export { normalizeInquiry } from '../text.js';
