# ADR-007 - Containerized Development

Status: Accepted
Date: 2026-07-18

## Context

Development should be reproducible across machines.

## Decision

Provide Docker Compose as an optional development path, while local scripts remain first-class.

## Alternatives Considered

Docker-only development was rejected because local functionality should remain accessible.

## Consequences

Commands must work locally and have container equivalents where useful.

## Security Impact

Containers must not receive unnecessary host secrets.

## Portability Impact

Docker helps reproduce environments but is not a hard runtime dependency.

## Revisit Conditions

Revisit if dependency complexity makes local development unreliable.
