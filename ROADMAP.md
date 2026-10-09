# AI Command Console Roadmap

This roadmap turns the current console from a strong single-operator tool into a reliable multi-agent operations platform.

## Principles

- Reliability before expansion
- Operator speed without hiding system state
- Recovery and trust for every high-impact action
- Extend by clear modules, not one-off features

## Phase 1: Reliability and Trust

Status: Completed

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
- Undo-safe policy rollout recovery with stale-state protection
- Route-level authorization and error-shape coverage for console API handlers
- Scheduler overlap and terminal-state regression coverage

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

Status: Completed

Goals:
- Make each agent observable and manageable as an operational unit

Delivered:
- Per-agent run history
- Goal and workload inspection panels
- Editable agent runtime configuration
- Cross-agent dependency map
- Pause/resume/restart controls with explicit recovery explanations

## Phase 4: Automation and Policy

Goals:
- Reduce manual oversight while keeping the system safe

Status: Completed

Delivered:
- Watcher rule editor
- Read-only watcher simulation with per-rule outcomes before execution
- Escalation policies for stalled work
- Auto-remediation for common operational failures
- Scheduled operational summaries
- Visual multi-step automation builder with reusable policy-governed templates, allowlisted actions, preflight checks, and confirmation-gated runs

## Phase 5: Collaboration and Governance

Goals:
- Support multiple operators safely

Status: In progress

Delivered:
- Shared operator sessions and reusable macros with owner/admin controls, assignment, visibility filtering, governed archival, and audit history
- Handoff notes and review delegation with participant authorization, creator/assignee visibility, governed reassignment and closure, and audit history
- Unified brief and report ownership controls with workspace-member validation, safe self-claim/release, governed admin reassignment, assignment inventory, and audit history
- Two-person approval gates for sensitive terminal actions with workspace-scoped requests, duplicate suppression, independent approver enforcement, governed execution, and audit history

Planned features:
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
