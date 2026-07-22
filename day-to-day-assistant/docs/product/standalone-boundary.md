# Standalone Boundary Specification

## Owned Capabilities

The application owns user account, local authentication, conversations, tasks, reminders, local calendar, follow-ups, notes, routines, approvals, action execution, memory, settings, activity history, audit records, local backup metadata, and integration configuration.

## Optional External Capabilities

Hosted AI, local AI, email, external calendars, contacts, cloud file storage, browser notifications, and mobile notifications may be added later as optional adapters.

Each adapter must be optional, replaceable, isolated, separately authorized, revocable, health monitored, and removable without damaging local functionality.

## Prohibited Dependencies

The application must not require Civitas services, Proprium services, CCI services, CAF Legion services, CATA services, Mission Control services, shared private identity systems, shared private event buses, shared private evidence stores, or shared private policy engines.

## Data Ownership

The application owns its database, files, schemas, migrations, audit records, prompts, settings, encryption keys, backups, and integration tokens.

## Failure Isolation

Local tasks, notes, calendar records, reminders, approvals, and activity history remain available whenever technically possible if AI, email, calendar sync, scheduler, external tokens, or model output fails.

## Boundary Diagram

```text
User
  |
Day-to-Day Assistant
  |
  +-- Local Application Modules
  |     Tasks, Calendar, Reminders, Notes, Follow-Ups, Memory, Approvals
  |
  +-- Local Persistence
  |     Database, Files, Audit, Backups
  |
  +-- Optional Adapters
        AI Provider, Email Provider, External Calendar, Contacts, Notifications
```

## Dependency Policy

Foundational code reviews must reject any required dependency on private ecosystems or undocumented external services.
