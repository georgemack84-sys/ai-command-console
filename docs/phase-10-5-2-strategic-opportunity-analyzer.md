# Phase 10.5.2 - Strategic Opportunity Analyzer

## Preview

Strategic Opportunity Analyzer identifies repeatable, evidence-backed strategic opportunities from certified Strategy Evolution inputs. It ranks high-value opportunities that may later feed proposal generation, while remaining advisory-only.

## Tightened Contract

This phase:

- consumes Phase 10.5.1 Strategy Evolution Contract validation;
- requires a certified contract before analysis;
- detects repeatable success, risk, decision, evidence, governance, operator, and simulation opportunities;
- rejects single-event success, missing evidence, missing replay, missing governance, cross-tenant evidence, nondeterministic ranking, and integrity mismatch;
- registers immutable append-only opportunity records;
- never generates, approves, adopts, or executes strategy changes.

## Non-Goals

- No strategy mutation.
- No strategy proposal generation.
- No adoption recommendation execution.
- No governance bypass.
- No operator approval.

## Implemented Surface

- `GET /strategic-opportunity-analyzer/contract`
- `POST /strategic-opportunity-analyzer/analyze`
- `POST /strategic-opportunity-analyzer/opportunities`
- `POST /strategic-opportunity-analyzer/ranking`
- `POST /strategic-opportunity-analyzer/evidence`
- `POST /strategic-opportunity-analyzer/governance`
- `POST /strategic-opportunity-analyzer/replay`
- `POST /strategic-opportunity-analyzer/registry`
- `POST /strategic-opportunity-analyzer/inspect`

## Exit Criteria

Phase 10.5.2 is complete when strategic opportunities are identified deterministically, ranked reproducibly, evidence-backed, replay-verified, governance-compliant, tenant-isolated, immutable, and certified as the authoritative opportunity discovery component for Strategy Evolution.
