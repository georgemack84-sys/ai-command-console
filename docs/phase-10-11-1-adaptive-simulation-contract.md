# Phase 10.11.1 - Adaptive Simulation Contract

## Purpose

Establish the authoritative contract for adaptive simulations. A simulation is a deterministic, replayable, explainable validation capability for certified adaptation proposals. It is advisory evidence only: it cannot approve, reject, deploy, mutate production behavior, alter historical evidence, expand authority, or bypass governance.

## Tightened Contract

- Contract version: `adaptive-simulation-contract/v1`
- Contract identifier: `AdaptiveSimulationContract`
- Contract semver: `1.0`
- Status model: `AUTHORITATIVE` when all requirements hold, `FAIL_CLOSED` for any violation
- Prior dependency: certified adaptation proposal output from Phase 10.10.12
- Replay model: stable replay hash plus integrity hash over lifecycle, boundaries, IO contracts, metrics, status, and certification result

## Lifecycle

1. `PROPOSAL_RECEIVED`
2. `VALIDATION_READY`
3. `SIMULATION_PREPARATION`
4. `SIMULATION_RUNNING`
5. `RESULT_ANALYSIS`
6. `REPLAY_VALIDATION`
7. `DIVERGENCE_ANALYSIS`
8. `CERTIFICATION_RECOMMENDATION`
9. `COMPLETE`

The lifecycle is linear and immutable. Replay validation requires identical outputs, event ordering, evidence, recommendations, explanations, and metrics. Divergence analysis rejects unexplained and nondeterministic divergence.

## Simulation Scope

The contract authorizes only governed simulations across historical replay, counterfactual replay, adaptation validation, proposal comparison, governance validation, risk simulation, confidence simulation, mission simulation, rollback simulation, and adversarial simulation.

## Boundaries

The module explicitly prohibits proposal approval/rejection/deployment, production recommendation mutation, production model updates, historical record changes, governance or constitutional policy changes, confidence/risk updates, tenant state changes, autonomous decisions, and authority expansion.

## Inputs And Outputs

Inputs require proposal identity and hash, certified proposal evidence, historical outcomes, recommendation/operator history, replay timeline, decision/recommendation/governance graphs, active policy and authority rules, approval requirements, tenant isolation metadata, deterministic seed, execution parameters, simulation scope, baseline behavior, and rollback plan.

Outputs require simulation record, replay package, evidence bundle, divergence report, impact analysis, governance assessment, operator assessment, rollback assessment, certification recommendation, and audit package. Evidence, replay, explainability, rollback assessment, and audit outputs are mandatory.

## Failure Behavior

The contract fails closed for unavailable or failed certification, nondeterminism, replay inconsistency, unexplained divergence, governance or constitutional violations, authority expansion, tenant isolation breach, rollback failure, incomplete or mutable evidence, incomplete audit trail, integrity failure, simulation state corruption, production mutation, historical evidence mutation, risk/confidence mutation, and autonomous decision attempts.

## Implementation

- Types: `types/adaptive-simulation-contract.ts`
- Service: `services/adaptive-simulation-contract/index.ts`
- API routes: `app/api/adaptive-simulation-contract/*`
- Tests: `tests/unit/adaptive-simulation-contract/adaptiveSimulationContract.test.ts`

The exported service is deterministic and exposes `establishAdaptiveSimulationContract`, `replayAdaptiveSimulationContract`, and `getAdaptiveSimulationContractFoundation`.
