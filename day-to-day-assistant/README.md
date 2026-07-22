# Day-to-Day Assistant

Day-to-Day Assistant is a standalone personal assistant application for one user. It helps the user understand, organize, prepare, and manage everyday responsibilities through a private, approval-based conversational application.

This repository is the Phase D2D.12 production foundation. It defines product scope, authority boundaries, architecture, security baseline, development standards, reproducible development bootstrap, local identity, sessions, settings, audit, application shell, local tasks, reminders, follow-ups, local calendars, events, notebooks, Markdown notes, deterministic search, persistent conversations, AI gateway, intent recognition, context assembly, planning, action proposals, explicit confirmations, controlled tool execution, rollback records, transparent memory, personalization, preferences, routine learning, outcome learning, approved automations, deterministic scheduling, bounded workflow execution, optional external connectors, synchronization, connector health, production diagnostics, backup, recovery rehearsal, release qualification, Today, notifications, and activity.

## Current Phase

Phase identifier: D2D.12
Phase name: Production Readiness, Security Hardening, Backup, Recovery, and Release Qualification
Status: QUALIFIED

Qualification details are listed in [docs/operations/phase-12-qualification.md](docs/operations/phase-12-qualification.md).

## Prerequisites

- Python 3.12
- Node.js 22
- Git
- Docker with Compose v2 for PostgreSQL
- GNU Make or PowerShell wrappers

## Local Quick Start

```powershell
Copy-Item .env.example .env
./scripts/bootstrap/bootstrap.ps1
./scripts/test/test.ps1
./scripts/development/dev.ps1
```

API health: http://localhost:8010/api/v1/health
Web app: http://localhost:5174 by default. If that port is occupied, `scripts/development/dev.ps1` records the selected fallback port in `.dev/web-port.txt`.

## Make Targets

```bash
make help
make doctor
make bootstrap
make dev
make stop
make restart
make test
make test-smoke
make lint
make format
make format-check
make typecheck
make quality
make migrate
make reset-dev
make health
make pre-commit
```

On Windows, the Makefile targets call PowerShell scripts.

## Architecture Summary

The project starts as a modular monolith. The browser UI talks to a local API. The API owns validation, authentication, session checks, authority checks, health endpoints, audit records, migrations, and future domain services. PostgreSQL is provided through Docker Compose for development infrastructure; the current SQLite migration path keeps local bootstrap runnable in restricted environments.

## Repository Layout

```text
apps/
  api/      Python API with auth, tasks, reminders, follow-ups, calendars, events, notes, search, conversations, AI gateway, planning, action gateway, memory, personalization, automation, scheduler, connectors, synchronization, production operations, Today, activity, and audit
  web/      Static web shell with setup, login, productivity, calendar, notes, search, memory dashboard, automation dashboard, connector dashboard, operations dashboard, assistant planning, action review, settings, sessions, and health routes
docs/       Product, architecture, security, development, and operations records
  design/   Canonical cross-platform product design prompt, token contract, component mapping, and QA handbook
packages/   Contracts, prompts, and shared type definitions
scripts/    Bootstrap, development, test, database, backup, and restore helpers
tests/      Integration, end-to-end, and security test placeholders
```

## Troubleshooting

See [docs/development/troubleshooting.md](docs/development/troubleshooting.md).

## Foundational Boundary

The project is standalone by construction. It must not depend on Civitas, Proprium, CCI, CAF Legion, CATA, Mission Control, private shared identity systems, private event buses, private evidence stores, or private policy engines.

External integrations are future optional adapters. Local tasks, reminders, calendar, notebooks, notes, attachments, search, conversations, AI gateway records, planning records, approvals, activity records, memory controls, and backups remain native capabilities.

Phase 7 assistant planning is read-only. It can understand, retrieve, plan, and explain, but it cannot modify application state. Production restore is rehearsed in-app and performed as an offline administrative operation.

The Desktop Web interface is the canonical design source of truth for future platform clients. See [docs/design/master-product-design-prompt.md](docs/design/master-product-design-prompt.md).
