# Current-State and Legacy Audit

## Reasoning package

- Golden router fixtures: 60
- Golden selector cases: 12
- Test-only engineering responses: 15
- Production-approved responses supplied: 689
- Runtime content readiness: approved bank present and behavior-audited
- Multi-instance deployment readiness: requires distributed persistence credentials

## Legacy build

- README/meta claimed lane count: 72
- Actual lane keys: 72
- Legacy route definitions: 69
- Claimed responses: 368
- Counted responses in lane data: 368
- Empty lanes: 26
- Exact normalized duplicate groups: 0
- Lines flagged for known AI/software voice terms: 27

## Empty or underfilled lanes

- fallback_prediction: 0
- fallback_permission: 0
- fallback_why: 0
- fallback_when: 0
- fallback_comparison: 0
- fallback_identity: 0
- fallback_social: 0
- fallback_life: 0
- fallback_reaction: 0
- fallback_nonsense: 0
- champion_renekton: 0
- champion_nasus: 0
- champion_nidalee: 0
- champion_jax: 0
- champion_darius: 0
- champion_garen: 0
- champion_illaoi: 0
- champion_singed: 0
- champion_teemo: 0
- champion_irelia: 0
- champion_ksante: 0
- champion_gangplank: 0
- champion_malphite: 0
- champion_sett: 0
- champion_gwen: 0
- champion_riven: 0

## Editorial flags

- [original_8ball] Nostalgia wins every comparison; production still has to answer the question.
- [original_8ball] The relic is honored. The command is operational. BOOMWADDUP
- [bot_status] Operational. Chat remains the unstable dependency.
- [bot_status] Operational and already disappointed. Aware
- [bot_status] The Ball works. The input quality is outside warranty. HUH
- [bot_status] Systems green. Chat judgment remains red. NODDERS
- [bot_origin] The repository says engineering. The room says collective mistake.
- [bot_insult] Production survived the feedback. Your premise did not.
- [bot_blink] One blink means yes. Two means the deployment is haunted.
- [sro_bitcoin] Green candle detected. Financial literacy still missing. NODDERS
- [sro_jokic] Basketball IQ detected. Summoner’s Rift translation pending.
- [sro_history] Different era, same top-lane ecosystem.
- [sro_history] Top-lane history detected. Personal verdict withheld. NODDERS
- [mtf_positive] Kindness detected. Authenticity review pending.
- [mtf_positive] Kind message detected. Chat suspects account sharing. HUH
- [teamplay_mod] Moderator detected. Everyone suddenly remembers the rules.
- [bones_creator] The repository shows ownership. Favoritism remains uncommitted.
- [bones_creator] Production access detected. Behave briefly. CAUGHT
- [misanthrope] Crowd work detected. The audience did not consent.
- [misanthrope] One normal question remains statistically unlikely. HUH
- [truth_lie] No lie detected. Competence remains inconclusive.
- [top_lane] Weakside detected. Jungler location classified. lookUp
- [objective] Free Baron detected. Nobody breathe. NODDERS
- [social_like] Like is strong. The ecosystem requires them.
- [social_like] Affection detected beneath several layers of flaming. HUH
- [social_appearance] Aura detected. Measurements declined. Aware
- [social_romance] Chemistry detected; supervision recommended.

## Source gaps

- The standalone original `smart-responses.json` was not materialized into the V4 package. Its reviewed content is partially represented by the response-review and legacy-build sources, but it remains a missing primary source.
- No current active 7TV export was bundled; runtime fetch/fallback behavior is implemented instead.
- No live Vercel project configuration, production URL, or Redis credentials were supplied. Deployment was therefore not attempted.
