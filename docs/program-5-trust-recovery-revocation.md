# Program 5 - Phase P5.15 Trust Recovery & Revocation

P5.15 governs suspension, revocation, expiration, recovery, restoration, and requalification initiation for Trust Standing. It ensures trust never silently restores after degradation and that every restoration is backed by new evidence, governance approval, safety validation, deterministic replay, and immutable audit lineage.

## Scope

- Owns trust suspension, revocation, restoration, recovery, and requalification initiation.
- Does not permit automatic self-restoration.
- Treats `UNKNOWN` exclusively as a runtime fail-closed sentinel and never as a persisted lifecycle standing.

## Interfaces

- `GET /api/trust-recovery-revocation/contract`
- `POST /api/trust-recovery-revocation/validate`
- `GET|POST /api/trust-recovery-revocation/suspension`
- `GET|POST /api/trust-recovery-revocation/revocation`
- `GET|POST /api/trust-recovery-revocation/plan`
- `GET|POST /api/trust-recovery-revocation/evidence`
- `GET|POST /api/trust-recovery-revocation/requalification`
- `GET|POST /api/trust-recovery-revocation/decision`
- `GET|POST /api/trust-recovery-revocation/approval`
- `GET|POST /api/trust-recovery-revocation/observability`
- `GET|POST /api/trust-recovery-revocation/audit`
- `GET|POST /api/trust-recovery-revocation/readiness`

## Constitutional Invariants

Recovery requires new evidence, governance approval, safety validation, complete remediation, deterministic replay, requalification packaging, and immutable audit lineage. Missing, stale, conflicting, or unverifiable recovery evidence produces `FAIL_CLOSED` and prevents restoration.
