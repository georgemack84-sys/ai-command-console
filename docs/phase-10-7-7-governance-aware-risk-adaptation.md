# Phase 10.7.7 - Governance-Aware Risk Adaptation

## Preview

Governance-Aware Risk Adaptation is the mandatory governance gate for risk adaptation proposals. It evaluates constitutional compliance, governance impact, authority boundaries, compliance obligations, trust impact, escalation requirements, and certification impact before a proposal can proceed to simulation or operator review.

## Tightened Contract

The engine is advisory only. It does not approve production deployment, mutate risk models, execute recommendations, change governance or compliance policy, alter certification status, override operators, or rewrite historical evidence.

Every evaluation must be:

- deterministic and replayable
- evidence-backed
- constitutionally enforced
- governance-controlled
- authority-aware
- trust-aware
- tenant-isolated
- lineage-preserving

## Implemented Surface

- `POST /governance-aware-risk-adaptation/evaluate`
- `POST /governance-aware-risk-adaptation/records`
- `POST /governance-aware-risk-adaptation/impact`
- `POST /governance-aware-risk-adaptation/decision`
- `POST /governance-aware-risk-adaptation/ledger`
- `POST /governance-aware-risk-adaptation/validation`
- `POST /governance-aware-risk-adaptation/replay`
- `GET /governance-aware-risk-adaptation/contract`

## Certification Rules

Validation fails closed for missing constitutional, governance, authority, compliance, trust, escalation, certification, evidence, decision, replay, lineage, tenant isolation, or integrity inputs. It also rejects constitutional weakening, governance reduction, operator override, approval bypass, constitutional suppression, policy mutation, certification mutation, evidence rewrite, production approval, production mutation, nondeterminism, and fail-open behavior.
