# ADR-0003: Do Not Import Evidence Into Live State

Status: Accepted

## Context

The lifecycle makes evidence portable and reviewable. Portability can be mistaken for import authority if exported evidence is allowed to re-enter live advisory state.

## Decision

Exported, archived, reviewed, certified, or completed evidence must not be imported into live advisory state by this lifecycle. Outputs preserve `importedToLiveState = false` where that field exists.

## Alternatives Considered

- Add import routes for verified evidence.
- Treat certified evidence as safe to hydrate into runtime advisory state.
- Let archive review restore evidence into active state.

These alternatives were rejected because they create a new truth source and bypass live-state governance.

## Consequences

- Evidence remains portable and auditable.
- Live advisory state remains separate from exported evidence.
- Future import behavior, if ever needed, must be a separate governed phase.

## Related Seal Commits

- `4b252e1` Advisory evidence archive chain seal
- `04a52f1` Advisory evidence lifecycle bundle chain seal
- `3674ed5` Advisory evidence lifecycle completion bundle chain seal
