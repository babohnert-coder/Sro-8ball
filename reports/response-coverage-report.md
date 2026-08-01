# Response Coverage Report

## Runtime bank

- Approved production responses: 689
- Test-only engineering responses: 15
- Golden routing fixtures: 60/60 passing
- Golden selection cases: 12/12 passing
- Golden routes with at least four normal admitted answers: 59/59
- Controlled chaos audit: run npm run audit:production
- Missing-inquiry behavior: dedicated command-help fallback

## Selection behavior

Relevance determines pool admission. Uniform seeded RNG chooses inside the qualified pool. Exact route-cycle history excludes every already-used answer until the admitted pool is exhausted, then begins a new cycle without immediately repeating the prior line when alternatives exist.

## Deployment conclusion

The approved response bank is production-content-capable. Public multi-instance deployment still requires distributed persistence configuration and final owner review of the full authored bank.
