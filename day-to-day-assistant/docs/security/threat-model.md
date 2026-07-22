# Threat Model

## Trust Boundaries

User interface, API boundary, domain service boundary, database boundary, AI provider boundary, external integration boundary, backup archive boundary, and local operating system boundary.

## Threats

- Prompt injection attempts to cause unauthorized action
- Model hallucination creates unsupported recommendations
- Replay of stale confirmations
- Accidental deletion or overwrite of personal records
- Token leakage through logs, prompts, or backups
- Corrupted backup accepted as valid
- External adapter outage blocks local use
- Dependency compromise

## Required Responses

Authority checks must run outside model prompts. Confirmations must be proposal-specific and expire. External adapters must be optional. Audit records must be append-oriented. Backup and restore must verify integrity.
