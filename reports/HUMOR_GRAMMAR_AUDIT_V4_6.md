# SRO 8 Ball Humor Grammar Audit — V4.6

## Corpus findings

- Chat logs inspected: **4**
- Chat messages inspected: **6044**
- Messages at 12 words or fewer and 100 characters or fewer: **5580 (92.3%)**
- correction_or_reversal: **56** observed messages
- imperative_retort: **98** observed messages
- cope_reframe: **30** observed messages
- mock_authority: **94** observed messages
- understatement: **298** observed messages

The corpus favors compressed reactions, corrections, commands, mock enforcement, ironic cope, and calm understatement. The best 8 Ball lines should therefore answer quickly, make one turn, and leave chat room to continue the bit.

## Response grammar inventory

- Approved authored responses: **689**
- reply_move: deadpan_diagnosis 210, straight_verdict 166, confirm_then_undercut 87, instruction 42, mock_sentence 37, callback_substitution 27, escalation 14, conditional_verdict 13, absurd_declaration 13, understatement 12, literalize_slang 10, location_answer 9, refusal 8, deny_then_reframe 8, false_choice 7, identity_answer 7, omen 6, comparison_pick 6, blame_shift 5, mock_accusation 2
- twist_family: none 489, callback_jump 47, mock_authority 43, quiet_doom 17, social_frame_on_league 15, expectation_denial 14, confident_nonsense 13, impossible_condition 12, status_reversal 10, premise_undercut 8, blame_transfer 5, league_frame_on_social 5, role_reversal 3, motive_gap 3, scale_shift 3, literal_slang 1, self_incrimination 1
- target_family: game_state 260, subject 165, fate 94, streamer 77, object_or_build 48, asker 13, chat 13, enemy 12, moderators 5, team 2
- payoff_family: judgment 205, utility 182, recognition 131, reversal 115, escalation 17, doom 15, absurdity 13, cope 11

## Route-level behavioral result

- Golden routes exercised: **59**
- Routes with six or more admitted answers and fewer than two reply moves: **0**
- Routes with six or more admitted answers and no twist/payoff variation: **0**
- Failures: **0**

## Live sequence samples

### will Mike win

- **confirm_then_undercut / none / utility** — The Ball watched the last three minutes. No.
- **callback_substitution / callback_jump / recognition** — Depends which Mike comes back from base.
- **deadpan_diagnosis / status_reversal / reversal** — Content has overtaken the result.
- **escalation / none / escalation** — The comeback now needs a speech and two volunteers.
- **straight_verdict / callback_jump / recognition** — Not yet. Mike has one more theory.
- **confirm_then_undercut / quiet_doom / recognition** — The haters have gone quiet. Suspicious.

### is this build troll

- **deadpan_diagnosis / none / judgment** — Ugly can still be correct.
- **confirm_then_undercut / premise_undercut / reversal** — The pieces agree. That is not the same as innocence.
- **deadpan_diagnosis / none / judgment** — This path requires enemy permission.
- **confirm_then_undercut / none / utility** — Playable. Unfortunately, that is enough.
- **deadpan_diagnosis / impossible_condition / judgment** — It works if the game cooperates.
- **confirm_then_undercut / none / reversal** — The build has a defense. It should not testify.

### why did he flash

- **deadpan_diagnosis / none / judgment** — Walking away lacked drama.
- **blame_shift / none / reversal** — The cursor knows.
- **literalize_slang / none / judgment** — The cooldown looked lonely.
- **blame_shift / none / reversal** — Panic found the key first.
- **literalize_slang / none / judgment** — The wall looked negotiable.
- **deadpan_diagnosis / none / judgment** — The plan needed one more button.

### does bonesex put pineapples on pizza

- **instruction / mock_authority / judgment** — Ask again after the evidence stops being delicious.
- **confirm_then_undercut / motive_gap / recognition** — Yes, Bones did it. Motive remains unclear
- **straight_verdict / none / utility** — No. This accusation is somehow worse than the topping.
- **mock_accusation / mock_authority / recognition** — Yes. The pizza court has entered a guilty verdict.
- **straight_verdict / callback_jump / recognition** — Maybe. Bones has declined to cooperate with the pizza inquiry.
- **confirm_then_undercut / callback_jump / recognition** — Yes. Pineapple was present. Bones requested counsel.

### why is michaelthefan such a hater

- **mock_sentence / mock_authority / judgment** — MTF found the opinion first and the evidence second.
- **confirm_then_undercut / premise_undercut / reversal** — He is not hating. He is pre-denying the outcome.
- **callback_substitution / callback_jump / recognition** — MTF opened chat. Somewhere, Nidalee dodged.
- **deadpan_diagnosis / none / judgment** — Hating is cheaper than admitting he watched the whole game.
- **confirm_then_undercut / callback_jump / recognition** — The room needed resistance. MTF volunteered.
- **confirm_then_undercut / callback_jump / recognition** — Michael typed. Agreement left the building.

### doubt or believe

- **false_choice / expectation_denial / reversal** — Choose the funnier mistake.
- **confirm_then_undercut / none / recognition** — The doubters stopped typing. Suspicious.
- **mock_sentence / mock_authority / judgment** — Belief has entered the evidence-free phase.
- **deadpan_diagnosis / none / recognition** — The doubters are early, as tradition requires.
- **false_choice / expectation_denial / recognition** — Believe for now. That is the funnier mistake.
- **deadpan_diagnosis / none / judgment** — Someone will delete the prediction history.

## Structural rule now enforced

1. Recognition and relevance admit a finished response into the correct route pool.
2. The exact route still exhausts unused answers before any repeat.
3. Within the unused pool, the selector prefers the freshest reply move, twist family, target, and payoff combination.
4. RNG chooses uniformly inside that freshest tier.
5. No sentence fragments are assembled at runtime. Every result remains a fully authored line.

## Status

**PASSED** — exact-response variety and rhetorical-structure variety both hold across the tested routes.
