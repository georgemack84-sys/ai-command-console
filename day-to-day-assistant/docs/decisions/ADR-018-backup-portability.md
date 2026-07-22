# ADR-018 - Backup Portability

Status: Accepted
Date: 2026-07-18

## Context

The user must be able to preserve and restore local data.

## Decision

Backups are portable archives containing local data and verification metadata. Restore must be tested on a clean environment before release.

## Alternatives Considered

Cloud-only backup was rejected.

## Consequences

Backup and restore are MVP capabilities, not operational afterthoughts.

## Security Impact

Backups must protect sensitive data and integration tokens.

## Portability Impact

Portable restore is a phase and release requirement.

## Revisit Conditions

Revisit encryption and retention details before MVP release.
