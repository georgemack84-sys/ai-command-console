# Phase 8D.1 - Delegation Contract

## Purpose

The Delegation Contract defines the immutable, deterministic, and governance-controlled schema for task delegation inside Controlled Autonomy. It standardizes delegation identity, target assignment, authority requirements, metadata, lifecycle transitions, replay references, lineage, integrity, and schema versioning.

## Contract Sections

- Delegation identity: `delegation_id`, `task_id`, `execution_plan_id`, `tenant_id`, `mission_id`
- Delegation target: `delegate_type`, `delegate_id`, `delegate_role`, registration, certification, authorization, and routing eligibility
- Authority model: authority level, governing policy, constitutional reference, approval requirements, operator reference, governance approval, policy approval, and constitutional approval
- Metadata: confidence, governance score, priority, deadline, replay reference, lineage reference, and explanation
- Lifecycle: deterministic state, transition history, authority evidence, replay evidence, and terminal-state marker
- Versioning: contract, schema, compatibility, and migration versions
- Governance: governance, Truth Ledger, certification, and tenant isolation references
- Integrity: deterministic contract hash over the canonical contract surface

## Lifecycle

Primary states:

- `CREATED`
- `VALIDATED`
- `AUTHORIZED`
- `READY`
- `DELEGATED`
- `EXECUTING`
- `COMPLETED`

Exception and terminal states:

- `BLOCKED`
- `REJECTED`
- `CANCELLED`
- `FAILED`
- `SUPERSEDED`
- `ARCHIVED`

Illegal lifecycle transitions are rejected during validation.

## Delegate Types

- `OPERATOR`
- `INTERNAL_AGENT`
- `AUTONOMY_ENGINE`
- `EXTERNAL_SYSTEM`
- `DEFERRED`
- `BLOCKED`

Delegates must be registered, certified where applicable, authorized, and routing-eligible before delegation can proceed.

## API Surface

- `GET /api/delegation-contract/contract`
- `POST /api/delegation-contract/create`
- `POST /api/delegation-contract/validate`
- `POST /api/delegation-contract/replay`
- `POST /api/delegation-contract/hash`
- `POST /api/delegation-contract/registry`
- `GET /api/delegation-contract/version`
- `GET /api/delegation-contract/inspect`
- `POST /api/delegation-contract/inspect`

## Success Criteria

Phase 8D.1 is complete when delegation objects conform to one immutable schema, identities are deterministic and replayable, target and authority validation fail closed, lifecycle transitions are auditable, metadata supports replay and lineage reconstruction, schema versioning is stable, and the contract can support Phase 8D.2 Task Classification Engine.
