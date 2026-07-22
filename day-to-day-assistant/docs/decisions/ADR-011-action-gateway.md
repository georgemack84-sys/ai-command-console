# ADR-011 - Action Gateway

Status: Accepted
Date: 2026-07-18

## Context

Material actions require confirmation and audit.

## Decision

All state-changing assistant actions route through an Action Gateway.

## Alternatives Considered

Letting feature modules execute assistant actions directly was rejected.

## Consequences

Proposal, confirmation, execution, verification, and audit become consistent.

## Security Impact

Centralizes authority enforcement and replay resistance.

## Portability Impact

No negative impact.

## Revisit Conditions

Revisit only to split implementation while preserving the same contract.
