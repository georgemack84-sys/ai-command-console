# ADR-003 - Web Application

Status: Accepted
Date: 2026-07-18

## Context

The assistant needs a local conversational and planning UI.

## Decision

Use a local web application as the primary interface.

## Alternatives Considered

Mobile-native and voice-first interfaces were deferred.

## Consequences

The first UI runs in a browser against a local API.

## Security Impact

The API remains the authority boundary.

## Portability Impact

Browser-based UI reduces platform-specific UI work.

## Revisit Conditions

Revisit after MVP workflows are stable.
