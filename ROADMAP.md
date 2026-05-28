# AI Command Console Roadmap

This roadmap turns the current console from a strong single-operator tool into a reliable multi-agent operations platform.

## Principles

- Reliability before expansion
- Operator speed without hiding system state
- Recovery and trust for every high-impact action
- Extend by clear modules, not one-off features

## Phase 1: Reliability and Trust

Status: In progress

Goals:
- Formal audit trail for commands and workflow actions
- Safer review and alert recovery loops
- Automated coverage for workflow state transitions
- Clearer project documentation and operating expectations

Delivered:
- Dedicated audit trail service
- Structured activity feed sourced from audit events
- Built-in workflow tests using `node:test`
- Browser recovery flows for reviews and alerts

Next:
- Add undo-safe actions where feasible
- Add route-level tests for console API handlers
- Add scheduler regression tests

## Phase 2: Operator Speed

Status: Completed on April 16, 2026

Goals:
- Faster navigation and lower cognitive load
- Better filtering for queue, reviews, schedules, and alerts
- Command palette improvements and keyboard shortcuts

Delivered:
- Fuzzy command palette with grouped actions
- Saved views for queue, review, alert, and schedule filters
- Agent detail drawer with richer status and history
- Keyboard shortcuts for review triage and refresh
- Dense/expanded layout modes

## Phase 3: Agent Operations

Goals:
- Make each agent observable and manageable as an operational unit

Planned features:
- Per-agent run history
- Goal and workload inspection panels
- Editable agent runtime configuration
- Pause/resume/restart with recovery explanations
- Cross-agent dependency map

## Phase 4: Automation and Policy

Goals:
- Reduce manual oversight while keeping the system safe

Planned features:
- Visual automation builder
- Watcher rule editor
- Escalation policies for stalled work
- Auto-remediation for common operational failures
- Scheduled operational summaries

## Phase 5: Collaboration and Governance

Goals:
- Support multiple operators safely

Planned features:
- Shared sessions and macros
- Ownership and assignment controls
- Approval gates for sensitive actions
- Handoff notes and review delegation
- Environment separation for dev, staging, and production

## Phase 6: Platform Backbone

Goals:
- Prepare the console for long-term scale

Planned features:
- Database-backed state
- Structured telemetry and observability
- Background job processing
- Authentication and permissions
- Plugin framework with clear extension boundaries

Delivered in current slice:
- Introduced a SQLite-backed document store for operational state
- Migrated queue and review persistence onto the shared store
- Preserved legacy JSON write-through compatibility during the transition
- Updated workflow tests to cover the new persistence layer safely

Next:
- Migrate alerts, scheduler, watcher, and collaboration state to SQLite
- Add structured telemetry around command, watcher, and approval latency
- Start enforcing role-based permissions on sensitive actions

## Suggested Execution Order

1. Finish reliability test coverage around scheduler and API actions.
2. Add operator productivity features like filters, shortcuts, and detail drawers.
3. Expand agent controls and runtime observability.
4. Build policy and automation tooling.
5. Introduce collaboration and platform hardening.
