# Phase 3.3A Runtime Path Audit

Date: 2026-10-09
Repository: `MissionControl / AI Command Console`
Scope: Audit artifact refreshed after Phase 3.3 migration cleanup. This document still describes runtime-path findings, but key console-path notes now reflect the governed routing work completed on 2026-04-18.

## Post-Migration Refresh

Since the initial audit, the console runtime has materially improved:

- structured console actions now route through `control -> reviewed plan -> execution engine -> toolRouter` for terminal actions, operations actions, collaboration actions, digest actions, and governance-compat actions
- the operations actions API now uses the same reviewed execution path, preserves route-level authentication and workspace membership checks, normalizes workspace aliases, and returns confirmation evidence before dispatching higher-risk work
- the research actions API now assigns collision-free `research:*` action IDs and uses the shared governed route adapter before typed research-service dispatch
- the dashboard actions API now enforces workspace membership, assigns collision-free `dashboard:*` action IDs, and uses the governed runtime before typed dashboard-service dispatch
- the admin access API now preserves route-level admin admission while routing all privileged mutations through collision-free `admin:*` action IDs, control review, the execution engine, and typed admin-service dispatch
- the jobs API now routes queue creation, cancellation, and retry through collision-free `jobs:*` action IDs and revalidates the target workspace before typed queue mutation; worker processor execution remains a separately assessed path
- all typed and legacy processors now require durable admission evidence and a distinct `jobs:execute-processor` control/review/engine/router pass before invocation; legacy enqueue adapters add explicit actor, workspace, source, and contract provenance
- governance updates are now confirmation-gated through the governed path instead of auto-executing as plain process control
- the old post-review direct-dispatch branches in `src/server/services/console-runtime.ts` for operations, collaboration, digest, and governance-compat handling have been removed

What remains true:

- the console surface is still `PARTIAL_GOVERNED` overall because read-formatting helpers, legacy `help`, and compatibility paths still exist beside the governed route
- the broader API and worker surfaces outside the console path still include major bypass and partial-unorchestrated paths

## Audit Method

This audit started from package and bootstrap seeds, then traced confirmed downstream execution by file inspection:

- `package.json`
- `scripts/run-next.cjs`
- `app/api/**/route.ts`
- `src/server/services/**`
- `src/server/jobs/background-jobs.ts`
- `services/runtimeControl.js`
- `services/toolRouter.js`
- `services/executionEngine.js`
- `services/legacyConsoleHandler.js`
- `services/scheduler.js`
- `services/watcher.js`
- `services/digestScheduler.js`
- `services/pluginLoader.js`

Where a link could not be confirmed by reading files, it is marked `partial`, `unverified`, or `unknown`.

## STEP 1 — ENTRYPOINT INVENTORY

| Entrypoint | File | Type (CLI/API/UI/Job/etc.) | Evidence | Notes |
| --- | --- | --- | --- | --- |
| Next app bootstrap (`npm run dev`, `npm run start`) | `package.json`, `scripts/run-next.cjs` | Bootstrap | `package.json` scripts; `scripts/run-next.cjs:6-33` | Starts Next.js server; not itself a governed runtime path. |
| External job worker (`npm run worker:jobs`) | `package.json`, `scripts/job-worker.ts` | Job worker | `package.json` script `worker:jobs`; `scripts/job-worker.ts:10-39` | Confirmed autonomous worker loop. |
| Terminal UI request surface | `src/components/Terminal.tsx` | UI | `src/components/Terminal.tsx:926-939`, `1196-1203` | UI issues `GET /api/console`, `POST /api/console`, and `GET /api/console/stream`. |
| Console API overview | `app/api/console/route.ts` | API | `app/api/console/route.ts:12-24` | Read-only overview path; scheduler startup is isolated in Node instrumentation. |
| Console API command/action execution | `app/api/console/route.ts` | API | `app/api/console/route.ts:29-38` | Main interactive runtime entrypoint. |
| Console stream / SSE overview loop | `app/api/console/stream/route.ts` | API / SSE | `app/api/console/stream/route.ts:13-45`, `49-76` | Poll-like stream with digest sweep side effect. |
| Operations actions API | `app/api/operations/actions/route.ts` | API | `app/api/operations/actions/route.ts`; `src/server/services/governed-operations-action-service.ts` | Governed action admission with an explicit confirmation retry. |
| Research actions API | `app/api/research/actions/route.ts` | API | `app/api/research/actions/route.ts`; `src/server/services/governed-research-action-service.ts` | Governed action admission with an explicit confirmation retry. |
| Dashboard actions API | `app/api/dashboard/actions/route.ts` | API | `app/api/dashboard/actions/route.ts`; `src/server/services/governed-dashboard-action-service.ts` | Governed action admission with workspace membership and an explicit confirmation retry. |
| Jobs API | `app/api/jobs/route.ts` | API | `app/api/jobs/route.ts`; `src/server/services/governed-job-action-service.ts` | Governed queue creation, cancellation, and retry with explicit confirmation and target-workspace authorization. |
| Insights API | `app/api/insights/route.ts` | API | `app/api/insights/route.ts:15-64` | Has both direct execution and queued execution paths. |
| Agent tasks API | `app/api/agents/tasks/route.ts` | API | `app/api/agents/tasks/route.ts:16-67` | Creates tasks and can queue `agent:execute`. |
| Source refresh API | `app/api/sources/refresh/route.ts` | API | `app/api/sources/refresh/route.ts:13-31` | Queues background source refresh. |
| Research briefs CRUD API | `app/api/research/briefs/route.ts` | API | `app/api/research/briefs/route.ts`; `src/server/services/governed-research-brief-mutation-service.ts` | Read-only listing plus governed create, update, routing, reassignment, and delete mutations. |
| Research reports CRUD API | `app/api/research/reports/route.ts` | API | `app/api/research/reports/route.ts`; `src/server/services/governed-research-report-mutation-service.ts` | Read-only listing plus governed create, update, reassignment, and delete mutations. |
| Scheduled summary run API | `app/api/research/summaries/run-due/route.ts` | API | `app/api/research/summaries/run-due/route.ts`; `src/server/services/governed-scheduled-summary-action-service.ts` | Governed due-schedule selection and summary/report generation. |
| Admin access mutation API | `app/api/admin/access/route.ts` | API | `app/api/admin/access/route.ts`; `src/server/services/governed-admin-access-action-service.ts` | Governed privileged mutations with explicit confirmation and typed-service authorization. |
| Control center overview API | `app/api/control-center/overview/route.ts` | API | `app/api/control-center/overview/route.ts` | Read-only overview path; scheduler startup is isolated in Node instrumentation. |
| Digest scheduler loop | `services/digestScheduler.js` | Autonomous service initiator | `services/digestScheduler.js:20-45`, `70-84` | Confirmed timer-based background initiator. |
| Watcher loop | `services/watcher.js` | Autonomous service initiator | `services/watcher.js:147-235`, `238-321` | Confirmed timer-based rule evaluator. |
| Scheduler loop | `services/scheduler.js` | Autonomous service initiator | `services/scheduler.js:204-347`, `351-409` | Confirmed timer-based schedule runner. |
| Legacy console compatibility module | `services/consoleApi.js`, `services/legacyConsoleHandler.js` | Internal/module entrypoint | `services/consoleApi.js:1-5`; `services/legacyConsoleHandler.js:635-713`, `908-911` | Still exported; external callers are not enumerated in repo. |
| Operational auth/session/health probes | `app/api/auth/*`, `app/api/health/route.ts`, `app/api/ready/route.ts` | API | `app/api/auth/session/route.ts:1-10`; `app/api/auth/login/route.ts:1-31`; `app/api/health/route.ts:1-48`; `app/api/ready/route.ts:1-46` | Operational and auth bootstrap surfaces. |

## STEP 2 — RUNTIME PATH INVENTORY

| Path Name | Entrypoint | Flow (step-by-step) | Reaches Control | Reaches Planner | Reaches Review | Reaches Router | Reaches Engine | Evidence | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Console interactive path | `POST /api/console` | `Terminal.tsx` -> `app/api/console/route.ts` -> `executeTerminalRequest()` -> governed candidates use `executeControlledPlan()` / `executeControlledStructuredPlan()` -> reviewed plan -> execution engine -> `toolRouter.route()`; residual fallback branches still handle read-formatting helpers and legacy help | yes | partial | yes | yes | yes | `src/components/Terminal.tsx:931-938`; `app/api/console/route.ts:29-38`; `src/server/services/console-runtime.ts`; `services/runtimeControl.js`; `services/executionEngine.js`; `services/toolRouter.js` | The console path now has a real governed execution lane for most action traffic, but it is not yet the only lane. |
| Console overview read path | `GET /api/console` | `Terminal.tsx` -> `GET /api/console` -> `getTerminalOverview()` -> typed overview builders | no | no | no | no | no | `src/components/Terminal.tsx:926-929`; `app/api/console/route.ts`; `src/server/services/console-runtime.ts` | Read-only path; scheduler startup no longer depends on a request. |
| Console stream path | `GET /api/console/stream` | `Terminal.tsx` EventSource -> periodic `getTerminalOverview()` -> SSE payload | no | no | no | no | no | `src/components/Terminal.tsx:1196-1203`; `app/api/console/stream/route.ts` | Read-only stream; it no longer queues digest work every four seconds. |
| Operations action path | `POST /api/operations/actions` | route auth/workspace check -> `executeGovernedOperationsAction()` -> control/review -> execution engine -> `toolRouter.route()` -> `executeOperationsAction()` | yes | structured plan | yes | yes | yes | `app/api/operations/actions/route.ts`; `src/server/services/governed-operations-action-service.ts`; `services/runtimeControl.js`; `services/executionEngine.js`; `services/toolRouter.js` | Higher-risk actions stop at `confirm_required`; the client resubmits only after explicit operator confirmation. |
| Research action path | `POST /api/research/actions` | route auth/workspace check -> internal `research:*` action -> control/review -> execution engine -> `toolRouter.route()` -> `executeResearchAction()` | yes | structured plan | yes | yes | yes | `app/api/research/actions/route.ts`; `src/server/services/governed-research-action-service.ts`; `services/runtimeControl.js`; `services/executionEngine.js`; `services/toolRouter.js` | Internal IDs prevent collisions with legacy console handlers; typed service authorization remains downstream. |
| Dashboard action path | `POST /api/dashboard/actions` | route auth/workspace check -> internal `dashboard:*` action -> control/review -> execution engine -> `toolRouter.route()` -> `executeDashboardAction()` | yes | structured plan | yes | yes | yes | `app/api/dashboard/actions/route.ts`; `src/server/services/governed-dashboard-action-service.ts`; `services/runtimeControl.js`; `services/executionEngine.js`; `services/toolRouter.js` | Internal IDs avoid legacy alert/workspace handler collisions; typed service workspace checks remain downstream. |
| Admin privileged mutation path | `PATCH /api/admin/access` | route admin check -> internal `admin:*` action -> control/review -> execution engine -> `toolRouter.route()` -> `executeAdminAccessAction()` -> typed admin/control-center service | yes | structured plan | yes | yes | yes | `app/api/admin/access/route.ts`; `src/server/services/governed-admin-access-action-service.ts`; `src/server/services/admin-access-action-service.ts`; `services/toolRouter.js` | All nine mutation types use collision-free IDs; confirmation, admin authorization, actor propagation, and response status semantics are preserved. |
| Jobs queue management path | `POST /api/jobs` | route auth/workspace/rate checks -> internal `jobs:*` action -> control/review -> execution engine -> `toolRouter.route()` -> `executeJobAction()` -> target-workspace authorization -> queue mutation | yes | structured plan | yes | yes | yes | `app/api/jobs/route.ts`; `src/server/services/governed-job-action-service.ts`; `src/server/services/job-action-service.ts`; `services/toolRouter.js` | Governs API admission and queue mutation; asynchronous worker processor execution is tracked separately. |
| Insights direct path | `POST /api/insights` with `async=false` | route -> `generateWorkspaceInsights()` -> Prisma reads/writes -> optional alert creation | no | no | no | no | no | `app/api/insights/route.ts:54-63`; `src/server/services/insight-service.ts:5-70` | Direct execution path. |
| Insights queued path | `POST /api/insights` with `async=true` | route -> typed queue admission -> worker contract validation -> `jobs:execute-processor` control/review -> engine -> router -> registered processor -> `generateWorkspaceInsights()` | worker only | structured worker plan | worker only | worker only | worker only | `app/api/insights/route.ts:39-51`; `src/server/jobs/background-jobs.ts`; `services/jobQueue.js`; `services/toolRouter.js` | Processor execution is governed; the initiating route still bypasses control/review. |
| Agent task creation and queued execution path | `POST /api/agents/tasks` | route auth/workspace/feature check -> internal `agent-tasks:create` action -> control/review -> engine -> router -> typed task creation and optional admitted `agent:execute` enqueue -> reviewed worker invocation | yes | structured API and worker plans | yes | yes | yes | `app/api/agents/tasks/route.ts`; `src/server/services/governed-agent-task-action-service.ts`; `src/server/services/agent-task-action-service.ts`; `src/server/jobs/background-jobs.ts`; `services/toolRouter.js` | Both initial task mutation and optional processor execution now have explicit governed boundaries and workspace authorization. |
| Source refresh path | `POST /api/sources/refresh` | route auth/manager/rate checks -> confirmed `sources:refresh` network plan -> control/review -> engine -> router -> typed source authorization and admitted enqueue -> reviewed worker invocation -> `refreshSourceByConnector()` | yes | structured API and worker plans | yes | yes | yes | `app/api/sources/refresh/route.ts`; `src/server/services/governed-source-refresh-action-service.ts`; `src/server/services/source-refresh-action-service.ts`; `src/server/jobs/background-jobs.ts`; `services/toolRouter.js` | Explicit user confirmation acknowledges network side effects before queue admission; connector execution retains durable worker admission. |
| Research briefs CRUD path | `/api/research/briefs` | read-only GET -> typed list service; POST/PATCH/DELETE -> collision-free `research:briefs-*` plan -> control/review -> engine -> router -> typed workspace-authorized mutation service; route action delegates to the existing typed research action workflow | mutations yes | structured mutation plans | mutations yes | mutations yes | mutations yes | `app/api/research/briefs/route.ts`; `src/server/services/governed-research-brief-mutation-service.ts`; `src/server/services/research-brief-mutation-service.ts`; `services/toolRouter.js` | Reads remain a direct exception; create, update, reassignment, routing, and delete require explicit confirmation while preserving ownership, analytics, queueing, and response semantics. |
| Research reports CRUD path | `/api/research/reports` | read-only GET -> typed list service; POST/PATCH/DELETE -> collision-free `research:reports-*` plan -> control/review -> engine -> router -> typed workspace-authorized mutation service | mutations yes | structured mutation plans | mutations yes | mutations yes | mutations yes | `app/api/research/reports/route.ts`; `src/server/services/governed-research-report-mutation-service.ts`; `src/server/services/research-report-mutation-service.ts`; `services/toolRouter.js` | Reads remain a direct exception; all mutations require explicit confirmation and preserve ownership, analytics, transaction, and response semantics. |
| Scheduled summary generation path | `POST /api/research/summaries/run-due` | route auth/workspace check -> confirmed `research:summaries-run-due` network plan -> control/review -> engine -> router -> typed schedule selection and summary/report generation | yes | structured plan | yes | yes | yes | `app/api/research/summaries/run-due/route.ts`; `src/server/services/governed-scheduled-summary-action-service.ts`; `src/server/services/scheduled-summary-action-service.ts`; `services/toolRouter.js` | Explicit browser confirmation acknowledges AI/network side effects before typed workspace-authorized generation. |
| Legacy console compatibility path | `services/consoleApi.js` / `legacyConsoleHandler.handleConsoleRequest()` | compatibility export -> risk-preserving `legacy-console:*` structured plan -> control/review -> execution engine -> tool router -> source-authorized compatibility handler | yes | structured plan | yes | yes | yes | `services/consoleApi.js`; `services/legacyConsoleHandler.js`; `services/legacyConsoleRequestHandlers.js`; `services/toolRouter.js` | Legacy formatting and approval behavior are preserved, but direct handler invocation is now contained behind reviewed router authority. |
| External worker processor path | `npm run worker:jobs` | worker loop -> persisted job -> durable admission validation -> `jobs:execute-processor` structured review -> execution engine -> tool router -> registered typed or legacy processor | worker only | structured worker plan | worker only | worker only | worker only | `scripts/job-worker.ts`; `src/server/jobs/background-jobs.ts`; `services/legacyConsoleHandler.js`; `services/jobQueue.js`; `services/toolRouter.js` | Every registered processor requires matching durable evidence and router-issued runtime authority. |
| Digest scheduler autonomous path | `ensureDigestScheduler()` timer | Node instrumentation startup -> timer -> system-authored structured plan -> control/review -> engine -> router -> admitted `digest:run-due` enqueue -> reviewed worker invocation | yes | structured plan and structured worker plan | yes | yes | yes | `src/instrumentation.ts`; `src/instrumentation-node.ts`; `services/digestScheduler.js`; `services/toolRouter.js`; `services/jobQueue.js` | Both autonomous initiation and processor execution use governed runtime boundaries; production remains gated by the legacy-autonomy policy. |
| Watcher autonomous path | `startWatcher()` timer | `startWatcher()` -> single-flight `evaluateRules()` -> system-authored `watcher:schedule-start` -> control/review -> execution engine -> tool router -> `startSchedule()` | yes | structured plan | yes | yes | yes | `services/watcher.js`; `services/runtimeControl.js`; `services/executionEngine.js`; `services/toolRouter.js`; `services/scheduler.js` | Rule previews remain read-only; matched rules require watcher system authority before schedule creation. |
| Scheduler autonomous path | `startSchedule()` timer | `startSchedule()` -> timer -> single-flight `runScheduledTick()` -> system-authored `scheduler:agent-tick` -> control/review -> execution engine -> tool router -> agent activation/tick | yes | structured plan | yes | yes | yes | `services/scheduler.js`; `services/runtimeControl.js`; `services/executionEngine.js`; `services/toolRouter.js`; `services/agentRuntime.js` | Recurring ticks preserve cycle limits and recovery behavior while requiring scheduler system authority. |
| Health / readiness path | `GET /api/health`, `GET /api/ready` | route -> configure queue health -> db check / runtime warnings -> structured status response | no | no | no | no | no | `app/api/health/route.ts:1-48`; `app/api/ready/route.ts:1-46` | Operational probes; low-risk. |
| Auth/session path | `/api/auth/*`, `/api/auth/session` | route -> auth helper functions -> session cookie set/clear or session read | no | no | no | no | no | `app/api/auth/login/route.ts:1-31`; `app/api/auth/logout/route.ts:1-10`; `app/api/auth/signup/route.ts:1-51`; `app/api/auth/session/route.ts:1-10` | Authentication bootstrap path; outside target runtime by design. |

### Internal Target-Architecture Helper With No Confirmed Entrypoint

`executeControlledPlan()` and `executeControlledStructuredPlan()` are the shared `control -> review/intervention -> engine -> router` gateways. Interactive services, autonomous initiators, worker processors, and the legacy compatibility adapter now call the structured helper directly where they already own a typed plan.

## STEP 3 — CLASSIFICATION TABLE

| Path Name | Classification | Justification | Evidence |
| --- | --- | --- | --- |
| Console interactive path | `PARTIAL_GOVERNED` | Most action traffic now proceeds through control/review plus execution engine and router, but the endpoint still contains residual non-governed fallback behavior for some read/helper flows. | `src/server/services/console-runtime.ts`; `services/runtimeControl.js`; `services/executionEngine.js`; `services/toolRouter.js` |
| Console overview read path | `EXCEPTION` | Read-only overview path; scheduler initialization is isolated in Node instrumentation. | `app/api/console/route.ts`; `src/instrumentation.ts`; `src/instrumentation-node.ts` |
| Console stream path | `EXCEPTION` | Authenticated read-only SSE delivery; digest startup and queue mutation were removed from the request loop. | `app/api/console/stream/route.ts` |
| Operations action path | `GOVERNED` | Authenticated operations actions use structured control review, confirmation where required, and engine/router dispatch before the operations service mutates state. | `app/api/operations/actions/route.ts`; `src/server/services/governed-operations-action-service.ts`; `services/toolRouter.js` |
| Research action path | `GOVERNED` | Authenticated research actions use collision-free structured plans, explicit confirmation, and engine/router dispatch before typed service mutations. | `app/api/research/actions/route.ts`; `src/server/services/governed-research-action-service.ts`; `services/toolRouter.js` |
| Dashboard action path | `GOVERNED` | Authenticated workspace members use collision-free structured plans, explicit confirmation, and engine/router dispatch before typed service mutation or queueing. | `app/api/dashboard/actions/route.ts`; `src/server/services/governed-dashboard-action-service.ts`; `services/toolRouter.js` |
| Admin privileged mutation path | `GOVERNED` | Route-level admin checks, collision-free structured plans, explicit confirmation, engine/router admission, and downstream typed-service authorization are enforced for all privileged mutations. | `app/api/admin/access/route.ts`; `src/server/services/governed-admin-access-action-service.ts`; `src/server/services/admin-access-action-service.ts`; `services/toolRouter.js` |
| Jobs queue management path | `GOVERNED` | Queue creation, cancellation, and retry use structured review, explicit confirmation, engine/router admission, and target-workspace authorization before mutation. | `app/api/jobs/route.ts`; `src/server/services/governed-job-action-service.ts`; `src/server/services/job-action-service.ts`; `services/toolRouter.js` |
| Insights direct path | `BYPASS` | Direct generation and optional alert creation with no governed runtime. | `app/api/insights/route.ts:54-63`; `src/server/services/insight-service.ts:5-70` |
| Insights queued path | `PARTIAL_GOVERNED` | Typed processor execution traverses control/review/engine/router, but the initiating route remains a bypass. | `app/api/insights/route.ts:39-51`; `src/server/jobs/background-jobs.ts`; `services/jobQueue.js`; `services/toolRouter.js` |
| Agent task creation and queued execution path | `GOVERNED` | Task creation and optional queue admission traverse structured control/review and engine/router dispatch before the already-governed typed worker executes. | `app/api/agents/tasks/route.ts`; `src/server/services/governed-agent-task-action-service.ts`; `src/server/services/agent-task-action-service.ts`; `services/toolRouter.js`; `src/server/jobs/background-jobs.ts` |
| Source refresh path | `GOVERNED` | Manager-authorized refresh requests require explicit network-side-effect confirmation and traverse control/review plus engine/router admission before the already-governed worker executes. | `app/api/sources/refresh/route.ts`; `src/server/services/governed-source-refresh-action-service.ts`; `src/server/services/source-refresh-action-service.ts`; `src/server/jobs/background-jobs.ts`; `services/toolRouter.js` |
| Research briefs CRUD path | `GOVERNED` | POST/PATCH/DELETE use collision-free structured plans, explicit confirmation, engine/router admission, and downstream typed workspace/ownership authorization; GET remains read-only. | `app/api/research/briefs/route.ts`; `src/server/services/governed-research-brief-mutation-service.ts`; `src/server/services/research-brief-mutation-service.ts`; `services/toolRouter.js` |
| Research reports CRUD path | `GOVERNED` | POST/PATCH/DELETE use collision-free structured plans, explicit confirmation, engine/router admission, and downstream typed workspace/ownership authorization; GET remains read-only. | `app/api/research/reports/route.ts`; `src/server/services/governed-research-report-mutation-service.ts`; `src/server/services/research-report-mutation-service.ts`; `services/toolRouter.js` |
| Scheduled summary generation path | `GOVERNED` | Due-schedule selection and summary/report generation require explicit network-side-effect confirmation, structured review, engine/router admission, and typed workspace authorization. | `app/api/research/summaries/run-due/route.ts`; `src/server/services/governed-scheduled-summary-action-service.ts`; `src/server/services/scheduled-summary-action-service.ts`; `services/toolRouter.js` |
| Legacy console compatibility path | `GOVERNED` | Requests retain their original risk category, traverse structured control/review and engine/router execution, and can enter the legacy handler only from the source-authorized router adapter. | `services/legacyConsoleHandler.js`; `services/legacyConsoleRequestHandlers.js`; `services/toolRouter.js`; `tests/unit/legacy-console-governed-routing.test.ts` |
| External worker processor path | `GOVERNED` | Typed and legacy processors require matching durable admission and router-issued runtime authority before invocation. | `scripts/job-worker.ts`; `src/server/jobs/background-jobs.ts`; `services/legacyConsoleHandler.js`; `services/jobQueue.js`; `services/toolRouter.js` |
| Digest scheduler autonomous path | `GOVERNED` | Node startup is isolated from read requests, and each workspace enqueue passes through system-identity control/review before governed worker execution. | `src/instrumentation.ts`; `src/instrumentation-node.ts`; `services/digestScheduler.js`; `services/toolRouter.js`; `services/jobQueue.js` |
| Watcher autonomous path | `GOVERNED` | Matched rules submit a system-authored structured plan through control/review/engine/router; the router accepts schedule creation only from the watcher system identity. | `services/watcher.js`; `services/runtimeControl.js`; `services/executionEngine.js`; `services/toolRouter.js` |
| Scheduler autonomous path | `GOVERNED` | Recurring ticks submit system-authored structured plans through control/review/engine/router; direct router execution requires the scheduler system identity. | `services/scheduler.js`; `services/runtimeControl.js`; `services/executionEngine.js`; `services/toolRouter.js` |
| Health / readiness path | `EXCEPTION` | Operational health/readiness probes are intentionally outside the governed runtime and are low-risk. | `app/api/health/route.ts:1-48`; `app/api/ready/route.ts:1-46` |
| Auth/session path | `EXCEPTION` | Auth bootstrap/session endpoints are intentionally outside the action runtime. | `app/api/auth/login/route.ts:1-31`; `app/api/auth/logout/route.ts:1-10`; `app/api/auth/signup/route.ts:1-51`; `app/api/auth/session/route.ts:1-10` |

## STEP 4 — BYPASS REGISTER

| Path Name | Location | What It Bypasses | Risk Level | Frequency | Why It Exists | Recommendation | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |

## STEP 5 — EXCEPTION REGISTER

| Path Name | Location | Justification | Should Remain? (yes/no) | Guardrails Present | Evidence | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Health probe path | `app/api/health/route.ts` | Operational health/readiness probe; returns status only. | yes | Runtime/db/job health checks; no domain mutation. | `app/api/health/route.ts:1-48` | Queue configuration call is operational setup, not domain execution. |
| Readiness probe path | `app/api/ready/route.ts` | Operational readiness probe; explicit startup validation endpoint. | yes | Read-only status plus feature-flag bootstrap. | `app/api/ready/route.ts:1-46` | `ensureDefaultFeatureFlags()` mutates defaults, but this is startup/bootstrap behavior rather than user-directed domain execution. |
| Auth/session bootstrap path | `app/api/auth/*`, `app/api/auth/session` | Authentication/session lifecycle is outside the target runtime request-to-execution architecture. | yes | Rate limiting, schema validation, auth helpers. | `app/api/auth/login/route.ts:1-31`; `app/api/auth/signup/route.ts:1-51`; `app/api/auth/logout/route.ts:1-10`; `app/api/auth/session/route.ts:1-10` | Keep separate from action runtime. |
| Console overview read path | `GET /api/console` | Read-only overview delivery. | yes | Auth + workspace membership checks; scheduler startup is isolated elsewhere. | `app/api/console/route.ts` | Clean read exception after moving scheduler startup to Node instrumentation. |

## STEP 6 — RISK SUMMARY

### Top 5 High-Risk Paths

1. Insights direct path
   Synchronous insight generation and optional alert mutation still bypass the governed runtime.
2. Insights queued path
   Worker execution is governed, but asynchronous queue initiation still bypasses interactive runtime review.
3. Console interactive fallback path
   Residual helper and fallback branches still have weaker admission guarantees than structured action paths.
4. Legacy processor bootstrap ownership
   Protected execution is governed, but processor registration still originates in the compatibility handler.
5. Legacy enqueue compatibility adapters
   Compatibility enqueue surfaces are evidence-bound, but they remain an additional maintenance-sensitive admission shape.

### Top 5 Highest-Frequency Risky Paths

1. Console interactive path
   Main user-facing action path; partially governed but still hybrid.
2. Insights queued path
   Frequently triggered asynchronous insight work still enters the queue before interactive runtime review.
3. Insights direct path
   Synchronous insight generation remains a user-facing direct execution path.
4. Legacy processor bootstrap ownership
   Compatibility-owned registration remains a frequent dependency of queued execution startup.
5. Legacy enqueue compatibility adapters
   Older enqueue callers remain a recurring compatibility dependency despite fail-closed admission validation.

### Top 5 Easiest Migration Candidates

1. Insights queued path
   Typed input and an existing governed worker boundary make route admission a bounded next step.
2. Insights direct path
   The synchronous/queued branch is already explicit and can be split behind a typed action boundary.
3. Console interactive fallback path
   Remaining fallback branches can be inventoried and migrated one bounded action family at a time.
4. Legacy processor bootstrap ownership
   Registration can move to an explicit worker bootstrap module without changing admitted execution contracts.
5. Legacy enqueue compatibility adapters
   Existing normalization and durable evidence checks provide a clear boundary for consolidating remaining callers.

### Most Inconsistent Runtime Behaviors

- The shared controlled-plan helper now serves console, operations, research, dashboard, admin, jobs API, research brief/report mutations, and worker processor paths, while remaining direct generation paths still bypass it.
- Governed interactive APIs coexist with direct generation and partially governed queue initiators, producing inconsistent admission guarantees by entrypoint.
- Typed and legacy background jobs now persist and enforce processor admission evidence. Legacy enqueue adapters normalize old and new actor shapes and fail closed unless actor, workspace, source, and contract provenance are explicit.
- Processor registration remains centralized in `ensureJobProcessorsRegistered()`, but queued legacy work cannot invoke a protected processor without matching persisted evidence and a fresh reviewed runtime authority decision.
- Console and control-center read endpoints no longer start the scheduler or queue digest work; Node instrumentation owns startup and the SSE loop is read-only.
- Watcher rule previews remain read-only, while matched-rule schedule starts now traverse a single-flight system-authored control/review/engine/router path and fail closed on authority mismatch.
- Recurring agent schedule ticks now traverse a single-flight scheduler system plan and fail closed before agent activation when control or router authority rejects execution.
- Legacy console compatibility requests now retain their original risk class while traversing structured control/review, the execution engine, and a source-authorized router adapter before existing formatting or approval handlers run.
- Agent task creation and optional immediate execution now traverse a collision-free structured plan before typed workspace-scoped mutation and admitted worker processing.
- Source refresh now requires explicit network-side-effect confirmation before reviewed engine/router admission, typed manager authorization, admitted enqueue, and reviewed connector processing.
- Scheduled summary generation now requires explicit network-side-effect confirmation before reviewed engine/router admission and typed workspace-authorized AI/report generation.
- Research report create, update, reassignment, and delete mutations now require explicit confirmation before reviewed engine/router admission and typed workspace/ownership authorization; report reads remain direct and read-only.
- Research brief create, update, reassignment, routing, and delete mutations now require explicit confirmation before reviewed engine/router admission and typed workspace/ownership authorization; brief reads remain direct and read-only.

## STEP 7 — MIGRATION PRIORITIES

| Path Name | Current Classification | Priority (high/medium/low/exception) | Reason | Complexity | Evidence |
| --- | --- | --- | --- | --- | --- |
| Console interactive path | `PARTIAL_GOVERNED` | medium | Major migration work is complete, but residual fallback behavior still deserves cleanup. | Medium | `src/server/services/console-runtime.ts`; `services/runtimeControl.js`; `services/executionEngine.js`; `services/toolRouter.js` |
| Operations action path | `GOVERNED` | complete | Structured review, confirmation, engine, and router admission are now enforced. | Complete | `app/api/operations/actions/route.ts`; `src/server/services/governed-operations-action-service.ts` |
| Research action path | `GOVERNED` | complete | Collision-free structured review, confirmation, engine, and router admission are now enforced. | Complete | `app/api/research/actions/route.ts`; `src/server/services/governed-research-action-service.ts` |
| Jobs queue management path | `GOVERNED` | complete | Queue mutation admission, confirmation, engine/router dispatch, and target-workspace authorization are enforced. | Complete | `app/api/jobs/route.ts`; `src/server/services/governed-job-action-service.ts`; `src/server/services/job-action-service.ts` |
| External worker processor path | `GOVERNED` | complete | Typed and legacy execution is admission-bound and routed through review/engine/router before processor invocation. | Complete | `scripts/job-worker.ts`; `src/server/jobs/background-jobs.ts`; `services/legacyConsoleHandler.js`; `services/jobQueue.js`; `services/toolRouter.js` |
| Source refresh path | `GOVERNED` | complete | Manager and rate checks, network-side-effect confirmation, engine/router admission, typed source authorization, and reviewed worker execution are enforced. | Complete | `app/api/sources/refresh/route.ts`; `src/server/services/governed-source-refresh-action-service.ts`; `src/server/services/source-refresh-action-service.ts`; `services/toolRouter.js`; `src/server/jobs/background-jobs.ts` |
| Admin privileged mutation path | `GOVERNED` | complete | Admin admission, confirmation, structured review, engine/router dispatch, and typed-service authorization are enforced. | Complete | `app/api/admin/access/route.ts`; `src/server/services/governed-admin-access-action-service.ts` |
| Dashboard action path | `GOVERNED` | complete | Workspace membership, structured review, explicit confirmation, engine, and router admission are enforced. | Complete | `app/api/dashboard/actions/route.ts`; `src/server/services/governed-dashboard-action-service.ts` |
| Research briefs CRUD path | `GOVERNED` | complete | Read-only GET remains direct; all mutations use explicit confirmation, collision-free review/engine/router admission, and typed workspace/ownership authorization. | Complete | `app/api/research/briefs/route.ts`; `src/server/services/governed-research-brief-mutation-service.ts`; `src/server/services/research-brief-mutation-service.ts`; `services/toolRouter.js` |
| Research reports CRUD path | `GOVERNED` | complete | Read-only GET remains direct; all mutations use explicit confirmation, collision-free review/engine/router admission, and typed workspace/ownership authorization. | Complete | `app/api/research/reports/route.ts`; `src/server/services/governed-research-report-mutation-service.ts`; `src/server/services/research-report-mutation-service.ts`; `services/toolRouter.js` |
| Scheduled summary generation path | `GOVERNED` | complete | Explicit browser confirmation, reviewed engine/router admission, typed workspace authorization, and preserved due-schedule semantics are enforced. | Complete | `app/api/research/summaries/run-due/route.ts`; `src/server/services/governed-scheduled-summary-action-service.ts`; `src/server/services/scheduled-summary-action-service.ts`; `services/toolRouter.js` |
| Digest scheduler autonomous path | `GOVERNED` | complete | Startup is isolated to Node instrumentation and system-authored enqueue plans traverse control/review/engine/router. | Complete | `src/instrumentation.ts`; `src/instrumentation-node.ts`; `services/digestScheduler.js`; `services/toolRouter.js` |
| Watcher autonomous path | `GOVERNED` | complete | Matched rules use system-authored structured plans, watcher-only router authority, and single-flight execution; previews remain read-only. | Complete | `services/watcher.js`; `services/toolRouter.js`; `tests/unit/governed-watcher-routing.test.ts` |
| Scheduler autonomous path | `GOVERNED` | complete | Recurring ticks use system-authored structured plans, scheduler-only router authority, and existing per-agent single-flight execution. | Complete | `services/scheduler.js`; `services/toolRouter.js`; `tests/unit/governed-scheduler-routing.test.ts` |
| Legacy console compatibility path | `GOVERNED` | complete | Risk-preserving wrapper plans require control/review, engine execution, and source-authorized router dispatch while preserving legacy responses and approvals. | Complete | `services/legacyConsoleHandler.js`; `services/toolRouter.js`; `tests/unit/legacy-console-governed-routing.test.ts` |
| Agent task creation and queued execution path | `GOVERNED` | complete | Authenticated task creation and optional enqueue use collision-free review/engine/router admission, typed workspace authorization, and governed worker execution. | Complete | `app/api/agents/tasks/route.ts`; `src/server/services/governed-agent-task-action-service.ts`; `src/server/services/agent-task-action-service.ts`; `services/toolRouter.js`; `tests/unit/governed-agent-task-routing.test.ts` |
| Console overview read path | `EXCEPTION` | exception | Primarily read-only; can remain outside main action runtime if side effects are separated. | Low | `app/api/console/route.ts:12-24` |
| Health / readiness path | `EXCEPTION` | exception | Operational probes should stay outside action runtime. | Low | `app/api/health/route.ts:1-48`; `app/api/ready/route.ts:1-46` |
| Auth/session path | `EXCEPTION` | exception | Auth bootstrap belongs outside governed action runtime. | Low | `app/api/auth/login/route.ts:1-31`; `app/api/auth/signup/route.ts:1-51` |

## STEP 8 — SUMMARY

The runtime is healthiest where it has an explicit gateway: the console, operations, research actions and brief/report mutations, dashboard, admin, jobs, agent-task, source-refresh, and scheduled-summary API paths. These interactive paths now have confirmed control-to-engine-to-router execution.

The runtime is most fragmented in two places:

1. Remaining generation APIs that bypass the governed runtime.
2. Remaining queue initiators that can admit governed worker execution without first traversing the full interactive control path.
The console, legacy console compatibility adapter, operations, research actions and brief/report mutations, dashboard, admin, jobs API, agent-task API, source-refresh API, scheduled-summary API, watcher initiation, scheduled agent ticks, and typed and legacy worker execution paths are now unified. The strongest next runtime migration candidates are the remaining insights initiators and residual console/worker bootstrap cleanup.

Paths that can remain exception-only are operational health/readiness probes and auth/session bootstrap endpoints. They are explicit, low-risk, and operationally necessary outside the action runtime.

Remaining uncertainty:

- Typed queue processor execution now traverses control/review/engine/router, but the insights queue initiator is not yet governed.
- Legacy job processor registration still lives in the compatibility handler, so bootstrap ownership should eventually move to an explicit worker module even though admission and reviewed invocation now fail closed.
- Some low-risk read APIs were grouped rather than traced one-by-one when they followed the same `auth + service read` shape and did not initiate meaningful execution.
