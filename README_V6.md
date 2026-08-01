# SRO 8-Ball V6 Brain

V6 adds deterministic judgment before response retrieval. The live path remains finite, authored, reproducible, safety-gated, and backward compatible.

`recognition -> perception -> motive/target/safety -> DecisionPlan -> approved-line ranking -> freshness -> emote -> output`

Set `SRO_8BALL_PERSONALITY_VOLUME=1..10`; default is 6. Debug responses expose `perception` and `decisionPlan`. Normal Twitch output remains one approved line.
