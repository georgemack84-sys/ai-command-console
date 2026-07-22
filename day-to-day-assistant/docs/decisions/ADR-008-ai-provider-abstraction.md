# ADR-008 - AI Provider Abstraction

Status: Accepted
Date: 2026-07-18

## Context

The assistant may use AI but must remain useful without a provider.

## Decision

AI access goes through a provider abstraction.

## Alternatives Considered

Direct provider calls from features were rejected.

## Consequences

Features depend on assistant capabilities, not vendor SDKs.

## Security Impact

Context filtering and output validation can be centralized.

## Portability Impact

Provider changes do not rewrite core features.

## Revisit Conditions

Revisit when multiple providers require additional routing policy.
