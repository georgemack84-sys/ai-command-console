# ADR-010 - Local Functionality Without AI

Status: Accepted
Date: 2026-07-18

## Context

The product must remain useful when AI is unavailable.

## Decision

Tasks, reminders, calendar, notes, approvals, memory controls, activity records, and backup/restore are native application capabilities.

## Alternatives Considered

AI-first storage and planning were rejected.

## Consequences

The assistant can degrade to deterministic local workflows.

## Security Impact

Critical state changes do not depend on model output.

## Portability Impact

Offline operation remains possible.

## Revisit Conditions

Never revisit as a removal; only improve local capability.
