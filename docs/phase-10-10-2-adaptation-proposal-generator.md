# Phase 10.10.2 — Adaptation Proposal Generator

## Purpose

Transforms adaptive intelligence findings into deterministic, evidence-backed adaptation proposals without executing, deploying, or applying changes.

## Implemented Surface

- `POST /adaptation-proposal-generator/generate`
- `POST /adaptation-proposal-generator/proposals`
- `POST /adaptation-proposal-generator/classifications`
- `POST /adaptation-proposal-generator/metrics`
- `POST /adaptation-proposal-generator/replay`
- `POST /adaptation-proposal-generator/inspect`
- `GET /adaptation-proposal-generator/contract`

## Synthesis Inputs

The generator consolidates deterministic findings from outcome observation, recommendation analysis, pattern intelligence, confidence adaptation, risk adaptation, strategy evolution, and operator feedback.

## Proposal Categories

Supported categories include confidence calibration, risk calibration, recommendation heuristic, priority weighting, evidence requirement, simulation selection, governance routing, operator visibility, decision package format, strategic pattern response, and rollback guidance.

## Contract Validation

Every generated proposal is validated through the Phase 10.10.1 Adaptation Proposal Contract before it can be returned as generated.

## Advisory Boundary

The generator is recommendation-only. It cannot execute changes, deploy changes, mutate production, mutate models, mutate policy, bypass constitutional review, remove operator authority, or suppress governance visibility.

## Fail-Closed Behavior

Generation fails closed for missing inputs, missing evidence, missing outcomes, incomplete replay, governance failure, constitutional failure, authority failure, contract validation failure, integrity failure, tenant isolation violation, replay nondeterminism, production/model/policy mutation attempts, constitutional bypass, operator authority removal, and governance visibility suppression.
