# Architecture Overview

## Direction

The Day-to-Day Assistant starts as a modular monolith with a local web frontend, local API backend, local persistence, and optional replaceable adapters.

## Initial Stack

- Backend: Python API skeleton, planned FastAPI/Pydantic service layer in Phase 1
- Frontend: Local web app skeleton, planned TypeScript React app in Phase 1
- Persistence: SQLite for foundation portability, with migration support
- Development: PowerShell scripts, Makefile wrappers, Docker Compose option
- AI: Provider abstraction with deterministic mock provider first

## Module Boundaries

Core modules include identity, tasks, reminders, calendar, follow-ups, notes, conversations, memory, approvals, action gateway, audit/activity, AI gateway, integrations, backup/restore, and settings.

State-changing assistant actions must route through the Action Gateway. Prompts may describe rules but cannot enforce security.

## Runtime View

```text
Browser UI -> API -> Domain Services -> Database
                       |
                       +-> Action Gateway -> Audit
                       +-> AI Gateway -> Mock or External Provider
                       +-> Backup Service -> Portable Archive
```

## ADR Index

Initial decisions are recorded in `docs/decisions/ADR-001` through `ADR-018`.
