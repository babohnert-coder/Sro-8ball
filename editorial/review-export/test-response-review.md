# Engineering Response Review Export

These 15 lines are test-only fixtures. They prove selection behavior and are not approved production content.

## t_general_yes

- Text: YES - the signs are favorable.
- Intent: prediction, permission, evaluation
- Domains: general_oracle
- Concepts: none
- Delivery: classic
- Status: test_only
- Decision: [ ] approve [ ] reject [ ] edit
- Notes:

## t_general_no

- Text: NO - the signs do not support it.
- Intent: prediction, permission, evaluation
- Domains: general_oracle
- Concepts: none
- Delivery: classic
- Status: test_only
- Decision: [ ] approve [ ] reject [ ] edit
- Notes:

## t_general_unclear

- Text: OUTLOOK UNCLEAR - ask again after the next turn.
- Intent: prediction, evaluation
- Domains: general_oracle
- Concepts: none
- Delivery: classic
- Status: test_only
- Decision: [ ] approve [ ] reject [ ] edit
- Notes:

## t_game_outcome

- Text: OUTLOOK UNCLEAR - one fight will answer it.
- Intent: prediction, evaluation
- Domains: current_game
- Concepts: game_outcome_question, game_winnable_question
- Delivery: contextual
- Status: test_only
- Decision: [ ] approve [ ] reject [ ] edit
- Notes:

## t_shutdown_not_over

- Text: NOT YET - the gold changed hands, not the result.
- Intent: prediction, evaluation, reaction
- Domains: current_game, fight_dive_trade_shutdown
- Concepts: shutdown_given
- Delivery: contextual
- Status: test_only
- Decision: [ ] approve [ ] reject [ ] edit
- Notes:

## t_build_maybe

- Text: MAYBE - winning once would extend the experiment.
- Intent: prediction, evaluation, permission
- Domains: builds_items_runes
- Concepts: build_evaluation, experimental_build
- Delivery: dry
- Status: test_only
- Decision: [ ] approve [ ] reject [ ] edit
- Notes:

## t_build_no

- Text: NO - the result does not justify the build.
- Intent: evaluation, prediction
- Domains: builds_items_runes
- Concepts: build_failure, build_evaluation
- Delivery: direct
- Status: test_only
- Decision: [ ] approve [ ] reject [ ] edit
- Notes:

## t_rank_yes

- Text: OUTLOOK GOOD - the climb is still alive.
- Intent: prediction, timing, evaluation
- Domains: rank_climb
- Concepts: rank_goal_masters, rank_streak_goal
- Delivery: contextual
- Status: test_only
- Decision: [ ] approve [ ] reject [ ] edit
- Notes:

## t_wave_no

- Text: NO - the wave is frozen.
- Intent: evaluation, permission, prediction
- Domains: lane_wave_state
- Concepts: wave_freeze
- Delivery: contextual
- Status: test_only
- Decision: [ ] approve [ ] reject [ ] edit
- Notes:

## t_baron_maybe

- Text: MAYBE - the objective is free only if the map agrees.
- Intent: evaluation, prediction, permission
- Domains: objective_macro
- Concepts: objective_free, baron_call
- Delivery: contextual
- Status: test_only
- Decision: [ ] approve [ ] reject [ ] edit
- Notes:

## t_sro_win

- Text: YES - Mike still has a path.
- Intent: prediction, evaluation
- Domains: current_game, sro
- Concepts: game_outcome_question, game_winnable_question
- Delivery: contextual
- Status: test_only
- Decision: [ ] approve [ ] reject [ ] edit
- Notes:

## t_creator

- Text: Bones built the command; the Ball supplies the verdict.
- Intent: identity
- Domains: stream_chat_moderation
- Concepts: creator_origin
- Delivery: direct
- Status: test_only
- Decision: [ ] approve [ ] reject [ ] edit
- Notes:

## t_plumbing

- Text: MAYBE - the pipes are relevant only because you asked.
- Intent: identity, evaluation, prediction
- Domains: room_lore, work_money
- Concepts: plumbing_topic
- Delivery: room_lore
- Status: test_only
- Decision: [ ] approve [ ] reject [ ] edit
- Notes:

## t_candidate_mtf

- Text: YES - the British Nidalee request continues.
- Intent: prediction, evaluation
- Domains: room_lore
- Concepts: none
- Delivery: room_lore
- Status: test_only
- Decision: [ ] approve [ ] reject [ ] edit
- Notes:

## t_chaos_general

- Text: YES - proxy the relationship.
- Intent: prediction, permission, evaluation
- Domains: general_oracle, relationships_social
- Concepts: none
- Delivery: chaos
- Status: test_only
- Decision: [ ] approve [ ] reject [ ] edit
- Notes:
