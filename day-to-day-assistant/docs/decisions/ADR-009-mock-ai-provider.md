# ADR-009 - Mock AI Provider

Status: Accepted
Date: 2026-07-18

## Context

Tests need deterministic assistant behavior.

## Decision

Implement a deterministic mock AI provider before any external provider is required.

## Alternatives Considered

Using a live provider in tests was rejected.

## Consequences

AI behavior can be tested offline.

## Security Impact

Mock tests can verify invalid output and prompt-injection handling.

## Portability Impact

Development works without internet or API keys.

## Revisit Conditions

Do not remove the mock provider; extend it as behavior grows.
