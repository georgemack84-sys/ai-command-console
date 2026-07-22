# Phase 10.11.3 - Counterfactual Adaptation Simulator

## Purpose

Establish the deterministic Counterfactual Adaptation Simulator for evaluating how an approved adaptive proposal would have affected historical Mission Control outcomes without altering historical truth, production state, governance, tenant isolation, or operator authority.

Counterfactual simulation is analytical evidence generation only. It is not prediction, autonomous optimization, deployment authorization, or production mutation.

## Tightened Contract

- Simulator version: `counterfactual-adaptation-simulator/v1`
- Simulator identifier: `CounterfactualAdaptationSimulator`
- Required predecessor: Phase 10.11.2 historical replay baseline
- Single-variable rule: only the approved adaptation may differ from the historical replay baseline
- Valid outcomes: `PASS`, `CONDITIONAL_PASS`, `FAIL`, `INCONCLUSIVE`, `REQUIRES_MORE_EVIDENCE`, `REQUIRES_GOVERNANCE_REVIEW`, `REQUIRES_OPERATOR_REVIEW`
- Replay proof: stable replay hash plus nested integrity hashes for API surface, historical replay, simulation record, measurements, metrics, reports, and simulation validation ledger entry

## Simulation Scope

The simulator evaluates alternate recommendation paths, confidence scores, risk assessments, prioritization, governance routing, and escalation behavior.

Each generated alternate behavior is deterministic, replayable, explainable, and attributable to the approved adaptation.

## Measurement Dimensions

Every simulation measures:

- Improvement
- Degradation
- Unintended consequences
- Missed opportunities
- Increased risk
- Governance violations
- Operator impact

The simulator records both positive effects and side effects. Governance or constitutional violations immediately route to governance review or fail closed.

## CounterfactualSimulationRecord

The implementation produces the canonical record from the prompt, including simulation identity, proposal and tenant identity, historical replay reference, adaptation version, alternate recommendations/confidence/risk/prioritization/governance/escalation, improvement and side-effect metrics, governance and operator impact, reproducibility, outcome, explanation, and integrity hash.

## Failure Behavior

The simulator fails closed for nondeterminism, inconsistent replay, unexplained behavioral change, recommendation instability, confidence instability, risk instability, governance violation, constitutional violation, operator authority reduction, approval workflow bypass, unauthorized escalation, tenant isolation breach, missing evidence, integrity failure, simulation state corruption, multiple variable changes, historical truth mutation, production mutation, and implementation authorization attempts.

## Implementation

- Types: `types/counterfactual-adaptation-simulator.ts`
- Service: `services/counterfactual-adaptation-simulator/index.ts`
- API routes: `app/api/counterfactual-adaptation-simulator/*`
- Tests: `tests/unit/counterfactual-adaptation-simulator/counterfactualAdaptationSimulator.test.ts`

The exported service exposes `simulateCounterfactualAdaptation`, `replayCounterfactualSimulation`, and `getCounterfactualAdaptationSimulatorFoundation`.
