# Program 3 - CAF Legion Platform Certification

Status: certification baseline

Program: Program 3 - Civitas Agent Framework

Phase: P3.15 - Platform Certification

## Purpose

P3.15 formally certifies the CAF platform after successful P3.14 Platform Assurance. It owns certification execution, governance, lifecycle, evidence, certificate issuance, ledger records, audit lineage, and consumer verification access.

P3.15 consumes P3.14 assurance reports, qualification evidence, assurance decisions, and assurance-packaged replay evidence. It does not execute replay, duplicate assurance aggregation, independently verify replay, redefine governance decisions, or independently verify dependencies and evidence integrity.

## Certification Outcomes

The provisional certification outcomes are:

- `CERTIFIED`
- `CONDITIONALLY_CERTIFIED`
- `NOT_CERTIFIED`

These remain subject to reconciliation with the Program 2 Amendment 29 canonical outcome-family architecture before final specification lock.

## Implementation Surface

The repository exposes the P3.15 baseline through:

- `types/caf-platform-certification.ts`
- `services/caf-platform-certification/index.ts`
- `app/api/caf-platform-certification/contract`
- `app/api/caf-platform-certification/eligibility`
- `app/api/caf-platform-certification/evidence`
- `app/api/caf-platform-certification/decision`
- `app/api/caf-platform-certification/certificate`
- `app/api/caf-platform-certification/ledger`
- `app/api/caf-platform-certification/lifecycle`
- `app/api/caf-platform-certification/governance`
- `app/api/caf-platform-certification/audit`
- `app/api/caf-platform-certification/certification`
- `app/api/caf-platform-certification/validate`

## Exit Criteria

P3.15 is complete when certification eligibility is verified, certification evidence is complete and immutable, the certification decision is governed and traceable, the platform certificate is issued, the certification ledger is operational, lifecycle management is deterministic, governance approvals are recorded, audit lineage is preserved, certification APIs are operational, the platform certification gate passes, and outcome vocabulary is reconciled with Program 2 Amendment 29 before final lock.
