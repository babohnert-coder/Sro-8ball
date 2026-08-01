# SRO 8 Ball V4.7 Emote Routing

## Product rule

The response is selected first. The emote is then routed from the full active SRO 7TV set by the expression performed by the completed line.

The canonical set is:

- Set ID: `01GBAYMGX0000B23ECE97RP321`
- API route: `https://api.7tv.app/v3/emote-sets/01GBAYMGX0000B23ECE97RP321`

The runtime preserves every active set alias and underlying emote ID. It does not reduce the channel to a fixed shortlist.

## Semantic model

Each active alias receives:

- expression families, such as cope, hope, disbelief, laughter, failure, hype, watching, or hidden nonsense
- visual families, such as Pepe, SRO custom, League, meme, or obscure
- discourse functions, such as prediction confirmation, roast, location status, cursed build, or chaos oracle
- intensity
- confidence
- standalone eligibility
- animation and zero-width status

Manual SRO classifications are authoritative. Name/tag heuristics classify the remaining active aliases. Low-confidence obscure aliases are restricted to controlled hidden-nonsense answers until reviewed; they are never used as normal semantic reactions.

## Selection order

1. Select the correct authored response through recognition, hard eligibility, route cycling, humor-grammar freshness, and RNG.
2. Read the response's `emote_policy`.
3. Restrict the active set to compatible expression families.
4. Prefer the response's primary expression family as a hard tier.
5. Prefer matching discourse function and visual-family variation.
6. Exclude zero-width emotes and recently used exact aliases when alternatives exist.
7. Choose uniformly from the strongest remaining semantic tier.
8. Append the selected active alias.

## Usage target

- Minimum target: 60%
- Enforcement window: every rolling 20 replies
- Minimum required: 12 emote-bearing replies in each full window
- Local mixed audit: 53/80 replies, or 66.3%
- Every tested rolling 20: at least 12
- Unique emotes selected in the mixed audit: 17
- Unique emotes selected across the full 177-output route review: 22

The target cannot force an unavailable, zero-width, or semantically incompatible emote.

## Verified example pairings

- `Only if survival was never in the plan. NODDERS`
- `The cursor knows. Susge`
- `Believe for now. That is the funnier mistake. HOPIUM`
- `Nearby. Misanthrope rarely misses the next line. lookUp`
- `MTF found the opinion first and the evidence second. CAUGHT`
- `No. This accusation is somehow worse than the topping. NOPERS`
- `Renekton has an opening. YEP`
- `The wave is free. The lane is not. monkaHmm`

## Live-set maintenance

`npm run sync:emotes` fetches the configured set and writes:

- `data/emotes/active-set-snapshot.json`
- `data/emotes/semantic-inventory.json`
- `reports/7tv-semantic-inventory.md`

The report lists every active alias, assigned families, confidence, and the low-confidence visual-review queue.
