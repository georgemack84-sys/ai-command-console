# Program 3 - CAF Legion Governance, Authority and Policy Enforcement

Status: governance enforcement baseline

Program: Program 3 - Civitas Agent Framework

Phase: P3.7 - Governance, Authority and Policy Enforcement

Predecessors:

- [Program 3 - CAF Legion Constitutional Foundation](./program-3-caf-legion-constitutional-foundation.md)
- [Program 3 - CAF Legion Collaboration and Federation](./program-3-caf-legion-collaboration-federation.md)
- [Program 2 - CCI Governance and Authority](./program-2-cci-governance-authority.md)
- [Program 2 - CCI Policy Definition and Evaluation](./program-2-cci-policy-definition-evaluation.md)
- [Program 2 - CCI Runtime Policy Enforcement](./program-2-cci-runtime-policy-enforcement.md)

## Purpose

P3.7 implements CAF runtime governance enforcement. It evaluates every execution request against inherited constitutional authority, CCI policy, approval workflows, warning classes, and runtime admission rules before execution may proceed.

P3.7 does not define governance policy, constitutional authority, approval hierarchy, policy language, authority hierarchy, warning classifications, or runtime admission infrastructure. Those remain owned by P3.0 and Program 2 CCI.

## Scope

P3.7 defines:

- Authority Validator.
- Policy Orchestrator.
- Approval Workflow Engine.
- Gate Orchestrator.
- Warning Aggregator.
- Warning Router.
- Execution Admission Coordinator.
- GateResult and replay validation.

## Gate Pipeline

```text
Execution Request
  -> Authority Validator
  -> Policy Orchestrator
  -> Approval Workflow Engine
  -> Warning Aggregator
  -> Gate Orchestrator
  -> GateResult
  -> Execution Admission Request
  -> Runtime Orchestrator
```

Every execution request produces exactly one deterministic GateResult.

## Implementation Surface

The repository exposes the P3.7 baseline through:

- `types/caf-governance-authority-policy.ts`
- `services/caf-governance-authority-policy/index.ts`
- `app/api/caf-governance-authority-policy/contract`
- `app/api/caf-governance-authority-policy/authority`
- `app/api/caf-governance-authority-policy/policy`
- `app/api/caf-governance-authority-policy/gate`
- `app/api/caf-governance-authority-policy/warnings`
- `app/api/caf-governance-authority-policy/certification`
- `app/api/caf-governance-authority-policy/validate`

## Exit Criteria

P3.7 is complete when authority decisions are deterministic, policy evaluation consumes CCI policy services, approval workflows replay deterministically, warning aggregation is sourced solely from P3.0 warning classes, exactly one GateResult is produced, admitted requests generate execution admission requests, evidence is immutable and traceable, replay reproduces identical GateResults, and no policy or authority hierarchy is redefined in P3.7.
