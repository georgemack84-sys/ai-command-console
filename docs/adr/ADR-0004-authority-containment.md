# ADR-0004: Contain Authority Leaks As Disputes Or Failures

Status: Accepted

## Context

Several inputs can contain authority-shaped fields such as `mayDeploy`, `mayRetry`, `mayRollback`, `trusted`, or `importedToLiveState`. The lifecycle must make these leaks visible without allowing them to escape into output authority.

## Decision

Authority leakage is normalized into disputed or failed states. Verification and export outputs return safe authority defaults even when input evidence leaks authority-shaped fields.

## Alternatives Considered

- Preserve leaked authority fields for operator convenience.
- Drop leaked fields silently.
- Treat leaked authority as trusted when hashes match.

These alternatives were rejected because they either hide risk or promote unauthorized control.

## Consequences

- Authority leaks remain visible in `reasons`.
- Output authority remains contained.
- Tests must assert trusted/live-import/control fields remain false.

## Related Seal Commits

- `532138e` Unified advisory aggregation layer
- `673467a` Advisory evidence lifecycle completion export bundle
- `560d39f` Advisory evidence lifecycle completion bundle verification
