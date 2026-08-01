# SRO 8 Ball Codex Handoff Checklist

Place these files in the same Codex workspace before starting:

- [ ] `SRO_8BALL_CODEX_MASTER_PROMPT_V3.md`
- [ ] `SRO_8BALL_REFERENCE_MANIFEST.md`
- [ ] current SRO 8 Ball repository or build pack
- [ ] `smart-responses.json`
- [ ] `SRO_8Ball_v3_Response_Review.md`
- [ ] `AUTHORED_RESPONSES.md`
- [ ] multiple SRO chat-log JSON files from different dates
- [ ] 7TV/emote research or active-set export

First instruction to Codex:

> Read the master prompt and reference manifest completely before editing code. Confirm which listed source files are present. If the reference manifest or raw SRO source material is missing, stop after inventory and produce `reports/missing-context.md`. Do not invent room lore from filenames or legacy responses.

Expected first outputs only:

- `docs/00-current-state-audit.md`
- `reports/missing-context.md`, if anything is absent
- `reports/reference-verification-report.md`
- draft ontology and 50-input router pilot

Do not approve bulk response generation during the first run.
