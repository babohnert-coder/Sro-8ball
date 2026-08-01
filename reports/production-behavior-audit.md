# SRO 8 Ball Production Behavior Audit

- Production responses: 689
- Schema valid: true
- Exact normalized duplicates: 0
- Near-duplicate pairs (same semantic family, Jaccard >= .84): 0
- AI/software voice flags: 0
- Maximum response length: 66
- Plain finished responses without forced oracle prefix: 502 (72.9%)
- Explicit verdict-prefixed responses: 187 (27.1%)
- Deliberately rewritten legacy responses: 399
- New exact live-room responses: 12
- Golden routes with >=4 normal admitted answers: 59/59
- Largest admitted normal pool: 22
- Route history capacity: 64
- Scheduled chaos rate over 1,000 eligible answers: 7.9%
- Scheduled chaos spacing: 10-15 answers; consecutive chaos: 0
- Failures: 0
- Warnings: 0

## Delivery distribution
- classic: 37 (5.4%)
- direct: 105 (15.2%)
- contextual: 85 (12.3%)
- dry: 331 (48.0%)
- room_lore: 118 (17.1%)
- chaos: 13 (1.9%)

## Verdict distribution
- yes: 178
- no: 135
- maybe: 114
- outlook_good: 48
- very_doubtful: 44
- outlook_unclear: 36
- not_yet: 24
- unclear: 19
- because: 15
- ask_again_later: 14
- direct_location: 9
- likely: 8
- first: 8
- second: 8
- soon: 7
- direct_identity: 7
- unlikely: 3
- neither: 3
- renekton: 3
- direct_reaction: 3
- jax: 2
- both: 1

## Route-cycle tests
### will Mike win
- Route: `prediction:game_outcome_question`
- Qualified normal pool: 12
- Sequence: sro_game_outcome_07 -> sro_game_outcome_11 -> sro_game_outcome_05 -> sro_game_outcome_02 -> sro_game_outcome_04 -> sro_game_outcome_12 -> sro_game_outcome_06 -> sro_game_outcome_03 -> sro_game_outcome_10 -> sro_game_outcome_09 -> sro_game_outcome_08 -> sro_game_outcome_01 -> sro_game_outcome_11 -> sro_game_outcome_07
### what is the outcome of this game
- Route: `prediction:game_outcome_question`
- Qualified normal pool: 14
- Sequence: game_outcome_07 -> game_outcome_14 -> game_outcome_04 -> game_outcome_08 -> game_outcome_11 -> game_outcome_06 -> game_outcome_02 -> game_outcome_09 -> game_outcome_03 -> game_outcome_05 -> game_outcome_01 -> game_outcome_10 -> game_outcome_13 -> game_outcome_12 -> game_outcome_11 -> game_outcome_08
### is this build free
- Route: `evaluation:build_evaluation`
- Qualified normal pool: 22
- Sequence: build_eval_17 -> build_eval_15 -> build_free_06 -> build_eval_06 -> build_eval_04 -> build_eval_13 -> build_eval_12 -> build_eval_08 -> build_eval_01 -> build_free_04 -> build_eval_02 -> build_free_01 -> build_free_02 -> build_eval_11 -> build_eval_03 -> build_eval_09 -> build_eval_05 -> build_eval_16 -> build_eval_14 -> build_free_03 -> build_eval_10 -> build_free_05 -> build_eval_16 -> build_eval_15
### is this Feedmax
- Route: `evaluation:experimental_build`
- Qualified normal pool: 7
- Sequence: experimental_build_03 -> experimental_build_08 -> experimental_build_09 -> experimental_build_10 -> experimental_build_06 -> experimental_build_05 -> experimental_build_02 -> experimental_build_08 -> experimental_build_03
### is Renekton good here
- Route: `evaluation:matchup_evaluation`
- Qualified normal pool: 6
- Sequence: renekton_matchup_05 -> renekton_matchup_01 -> renekton_matchup_02 -> renekton_matchup_06 -> renekton_matchup_04 -> renekton_matchup_03 -> renekton_matchup_05 -> renekton_matchup_01
### should I cook dinner
- Route: `permission:domain:food_health_outside`
- Qualified normal pool: 6
- Sequence: food_decision_05 -> food_decision_06 -> food_decision_02 -> food_decision_04 -> food_decision_03 -> food_decision_01 -> food_decision_02 -> food_decision_06

## Equivalent phrasing chain
- Inputs: will Mike win | will SRO win | is Mike going to win | can Mike win this game
- Route keys: prediction:game_outcome_question | prediction:game_outcome_question | prediction:game_outcome_question | prediction:game_outcome_question
- Selected: sro_game_outcome_01 -> sro_game_outcome_12 -> sro_game_outcome_11 -> sro_game_outcome_07

## Persistence restart test
- Before restart: sro_game_outcome_11 -> sro_game_outcome_05 -> sro_game_outcome_01 -> sro_game_outcome_12 -> sro_game_outcome_07
- First after restart: sro_game_outcome_06
- Passed: true

## False-positive traps
- can you carry groceries: primary=food_health_outside; concepts=groceries_task; leaked=none
- should I build a deck: primary=ordinary_life; concepts=structure_building; leaked=none
- should I cook dinner: primary=food_health_outside; concepts=food_decision; leaked=none
- is this worth buying: primary=work_money; concepts=purchase_decision, worth_literal; leaked=none
- will it rain: primary=food_health_outside; concepts=weather_question; leaked=none
- can you carry this box: primary=general_oracle; concepts=none; leaked=none
- can Mike carry groceries: primary=food_health_outside; concepts=groceries_task; leaked=none
- should Mike cook dinner: primary=food_health_outside; concepts=food_decision; leaked=none
- can I scale this recipe: primary=food_health_outside; concepts=recipe_scaling; leaked=none
- should I proxy this request: primary=general_oracle; concepts=none; leaked=none

## Cross-contamination checks
### should he take Baron
- Take it before the enemy develops courage.
- Vision is doing its job.
- Bait wearing a timer.
- Right call. Wrong setup.
- One ward changes the vote.
- The enemy showed elsewhere. Take it.
- The map is not empty because chat feels brave.
### is dragon a flip
- Dragon is now a coin with health bars.
- Dragon is already a flip.
- Fifty-fifty requires equal incompetence.
- The Dragon setup has become gambling.
### can he dive this
- The dive exists. Survival is optional.
- The tower is still employed.
- One cooldown changes the answer.
- The health bars have objected.
- Clean execution makes it legal.
- The damage works. The exit does not.
- The first second has to be perfect.
### did he hit item spike
- The item spike is real.
- The purchase has not become power yet.
- One fight will reveal it.
- The spike finally matters.
### should they flip Baron
- Flipping Baron is surrender with extra steps.
- The coin has ten players attached.
- Certainty already left the lobby.
- Baron has become a casino.
- One Smite owns the prophecy.
### does this item scale
- The item gets better than the purchase looks.
- The scaling ends before the game does.
- One breakpoint makes the answer honest.
- Later fights favor the item.
- It is waiting for a game that will not arrive.
- The spike has an appointment.
### should Mike cook dinner
- YES — eat before judgment gets louder.
- NO — ordering again is not a meal plan.
- MAYBE — cook something that survives one pan.
- YES — dinner is the obvious win condition.
- NO — hunger is currently drafting the idea.
- MAYBE — choose food before choosing difficulty.
### can I scale this recipe
- YES — scale the ingredients, not the confidence.
- NO — baking has already filed an objection.
- MAYBE — the ratios survive if the pan does.
- OUTLOOK GOOD — double carefully and taste once.
- VERY DOUBTFUL — the recipe is load-bearing.
- YES — arithmetic may enter the kitchen.

## Adversarial routing checks
- can SRO still win: intent=prediction; primary=current_game; concepts=game_outcome_question; admitted=12
- did he donate the shutdown: intent=evaluation; primary=fight_dive_trade_shutdown; concepts=shutdown_given; admitted=10
- was that actually worth it: intent=evaluation; primary=fight_dive_trade_shutdown; concepts=worth_cope; admitted=8
- is this build troll: intent=evaluation; primary=builds_items_runes; concepts=build_evaluation; admitted=17
- should they flip Baron: intent=permission; primary=objective_macro; concepts=objective_flip; admitted=5
- should he smite Baron: intent=permission; primary=objective_macro; concepts=smite_objective; admitted=7
- can Mike carry this game: intent=prediction; primary=current_game; concepts=carry_game; admitted=8
- can Mike build a house: intent=permission; primary=ordinary_life; concepts=structure_building; admitted=6
- can Mike carry groceries: intent=permission; primary=food_health_outside; concepts=groceries_task; admitted=4
- should Mike cook dinner: intent=permission; primary=food_health_outside; concepts=food_decision; admitted=6
- is Mike free tomorrow: intent=evaluation; primary=ordinary_life; concepts=availability_question; admitted=6
- can I scale this recipe: intent=permission; primary=food_health_outside; concepts=recipe_scaling; admitted=6
- should I proxy this request: intent=permission; primary=general_oracle; concepts=none; admitted=12
- is top lane over: intent=evaluation; primary=lane_wave_state; concepts=lane_over; admitted=6
- did he lose the wave: intent=evaluation; primary=lane_wave_state; concepts=wave_lost; admitted=6
- does this item scale: intent=evaluation; primary=builds_items_runes; concepts=item_scaling; admitted=6
- did he run it down: intent=evaluation; primary=fight_dive_trade_shutdown; concepts=int_feed; admitted=4

## Coverage lows
- r014 (4): is Baron free
- r028 (4): is dragon a flip
- r039 (4): did Bones build the Ball
- r042 (4): is SRO a plumber
- r043 (4): should Mike buy Bitcoin
- r044 (4): did Jokic wear the merch
- r055 (4): is the Ball alive
- r056 (4): who built you
- r058 (4): will SRO play Nidalee
- r059 (4): does Mike smite Baron
- r045 (5): is this the old six Nashors Jax build
- r003 (6): did Mike win lane
- r007 (6): is Renekton good here
- r012 (6): did Mike build a lead
- r015 (6): is top free
- r016 (6): should I cook dinner
- r017 (6): is Mike cooking
- r018 (6): can we ff
- r019 (6): why did he flash
- r020 (6): when will Mike hit Masters
