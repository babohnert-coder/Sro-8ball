# Research notes folded into the build

## Engineering

Nightbot's UrlFetch model is the hard boundary: the command should call a URL and receive one short plain-text response. That means the server must be low-latency, deterministic, and capped below the chat response length. The build uses Vercel-compatible Node API routes and a rewrite from `/8ball` to `/api/8ball`.

The right v3 architecture is not an LLM. It is a finite authored response bank with routing, memory, and selection rules. That keeps costs near zero, avoids unpredictable generated slop, and makes every joke editable.

## Comedy

The joke should land like a room-aware verdict, not a paragraph. The pattern is: answer first, punchline second, no explaining the joke. The response bank is separated into plain and 7TV-authored lines so emotes are part of the line, not randomly appended after the fact.

## Magic 8 Ball

The classic 8 Ball works because it gives compressed uncertainty. This build preserves that shape: yes/no/maybe/unclear energy, short mystique, and a small chance of chaos. The modernization is lane recognition and anti-repeat memory.

## Product function

This should function as a stream toy that rewards chat for asking good questions. It should be useful enough to answer the lane, funny enough to clip, limited enough to avoid pretending it is a person, and varied enough to stop becoming an echo chamber.
