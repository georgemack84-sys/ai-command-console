# Security Baseline

## Protected Assets

Personal records, notes, calendar data, task data, reminders, follow-ups, memory, approvals, audit history, backups, integration tokens, configuration, prompts, and encryption keys are protected assets.

## Mandatory Controls

- Server-side authority enforcement
- Confirmation enforcement for material actions
- Audit records for proposals and executions
- Local-first data ownership
- Optional and revocable integrations
- Secret exclusion from logs and prompts
- Backup verification before restore is trusted
- Fail-closed handling for uncertain actions

## Baseline Risks

The largest early risks are prompt injection, accidental approval bypass, corrupt backups, overbroad future integrations, and weak local authentication. These risks remain open until Phase 1 implements full controls.
