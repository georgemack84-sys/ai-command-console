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

Status: Complete

Delivered:
- Shared operator sessions and reusable macros with owner/admin controls, assignment, visibility filtering, governed archival, and audit history
- Handoff notes and review delegation with participant authorization, creator/assignee visibility, governed reassignment and closure, and audit history
- Unified brief and report ownership controls with workspace-member validation, safe self-claim/release, governed admin reassignment, assignment inventory, and audit history
- Two-person approval gates for sensitive terminal actions with workspace-scoped requests, duplicate suppression, independent approver enforcement, governed execution, and audit history
- Explicit development, staging, and production isolation with workspace-bound execution, environment-scoped approvals, stale-approval rejection, and cross-environment mutation guards

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
- Migrated alerts, scheduler, watcher, and collaboration persistence onto the shared store
- Preserved legacy JSON write-through compatibility during the transition
- Qualified legacy import, SQLite restart durability, database precedence, and production mirror behavior across operational stores
- Enforced role-based permissions and two-person approval gates for sensitive actions
- Added structured command, watcher, scheduler, and approval telemetry with stable dimensions and latency summaries
- Kept terminal arguments and approval payloads out of operational telemetry
- Qualified queued-job continuity, stale-lease recovery, bounded retry, and partial-failure evidence across worker restarts
- Defined a trusted plugin registry with explicit capability manifests and fail-closed validation
- Isolated plugin execution behind frozen, least-privilege host contexts with workspace path containment, time limits, and output limits
- Added versioned plugin host and capability contracts with explicit security evidence, compatibility evidence, and fail-closed admission

Next:
- Phase 6 platform-backbone goals are complete

## Phase 7: Unified Governed Runtime

Goals:
- Make control, review, execution-engine, and router admission the only mutation path across interactive APIs
- Preserve explicit confirmation and authorization at public route boundaries
- Eliminate direct mutation bypasses incrementally with route-level regression evidence
- Keep read-only and operational probe exceptions explicit and documented

Delivered in current slice:
- Routed operations API actions through control review, the execution engine, and the tool router
- Normalized workspace action aliases before governed routing
- Preserved authenticated workspace membership checks at the route boundary
- Added an explicit client confirmation round trip for confirmation-required operations

Next:
- Govern research and dashboard action APIs
- Govern job queue mutation APIs and autonomous scheduler initiators
- Refresh the runtime-path audit as each bypass is retired

## Suggested Execution Order

1. Finish reliability test coverage around scheduler and API actions.
2. Add operator productivity features like filters, shortcuts, and detail drawers.
3. Expand agent controls and runtime observability.
4. Build policy and automation tooling.
5. Introduce collaboration and platform hardening.
