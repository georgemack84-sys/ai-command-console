# Initial Use Case Catalog

## Priority Scale

P0: MVP critical
P1: First release important
P2: Later enhancement
P3: Deferred

## P0 Use Cases

| ID | Name | Authority | State Change | Acceptance Test |
| --- | --- | --- | --- | --- |
| UC-001 | View Today | A0/A1 | No | Today view lists local events, tasks, overdue tasks, reminders, follow-ups, and recommendations. |
| UC-002 | Ask for Daily Briefing | A1 | No | Briefing cites local records and explains missing information. |
| UC-003 | Create Task Through Chat | A3 | Yes | Proposal is confirmed before task creation and audit is recorded. |
| UC-004 | Create Reminder | A3 | Yes | Reminder fires at scheduled local time after confirmation. |
| UC-005 | Review Calendar Conflicts | A1 | No | Overlaps are explained without modifying events. |
| UC-006 | Track Follow-Up | A3 | Yes | Confirmed follow-up appears when due or overdue. |
| UC-007 | Search Notes | A0 | No | Matching notes are returned without changing note state. |
| UC-008 | Draft Message | A2 | No external effect | Draft is prepared but not sent. |
| UC-009 | Approve or Reject Proposal | A3 | Yes | User can inspect, approve, reject, cancel, or let proposal expire. |
| UC-010 | Inspect Activity | A0 | No | User can see proposals, executions, failures, and audit entries. |
| UC-011 | Manage Memory | A3/A5 | Yes | User can inspect, correct, delete, or disable memory; assistant cannot hide memory. |
| UC-012 | Backup and Restore | A3 | Yes | Backup restores on a clean environment and verifies integrity. |

## Failure Scenarios

AI provider unavailable, malformed model output, duplicate action attempt, expired approval, missing required task data, reminder worker unavailable, external token expiry, migration failure, corrupted backup, and uncertain external action result must be tested.

## Template

Each full implementation use case must include ID, name, priority, actor, trigger, preconditions, inputs, main flow, alternative flow, failure flow, authority level, data accessed, state changes, audit requirements, acceptance tests, and out-of-scope notes.
