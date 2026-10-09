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
- all typed processors registered by `background-jobs.ts` now require durable admission evidence matching the processor contract, job type, workspace, actor, and provenance before execution; legacy processors and full control/review admission remain separate work
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
| Console API overview | `app/api/console/route.ts` | API | `app/api/console/route.ts:12-24` | Read path with scheduler side effect. |
| Console API command/action execution | `app/api/console/route.ts` | API | `app/api/console/route.ts:29-38` | Main interactive runtime entrypoint. |
| Console stream / SSE overview loop | `app/api/console/stream/route.ts` | API / SSE | `app/api/console/stream/route.ts:13-45`, `49-76` | Poll-like stream with digest sweep side effect. |
| Operations actions API | `app/api/operations/actions/route.ts` | API | `app/api/operations/actions/route.ts`; `src/server/services/governed-operations-action-service.ts` | Governed action admission with an explicit confirmation retry. |
| Research actions API | `app/api/research/actions/route.ts` | API | `app/api/research/actions/route.ts`; `src/server/services/governed-research-action-service.ts` | Governed action admission with an explicit confirmation retry. |
| Dashboard actions API | `app/api/dashboard/actions/route.ts` | API | `app/api/dashboard/actions/route.ts`; `src/server/services/governed-dashboard-action-service.ts` | Governed action admission with workspace membership and an explicit confirmation retry. |
| Jobs API | `app/api/jobs/route.ts` | API | `app/api/jobs/route.ts`; `src/server/services/governed-job-action-service.ts` | Governed queue creation, cancellation, and retry with explicit confirmation and target-workspace authorization. |
| Insights API | `app/api/insights/route.ts` | API | `app/api/insights/route.ts:15-64` | Has both direct execution and queued execution paths. |
| Agent tasks API | `app/api/agents/tasks/route.ts` | API | `app/api/agents/tasks/route.ts:16-67` | Creates tasks and can queue `agent:execute`. |
| Source refresh API | `app/api/sources/refresh/route.ts` | API | `app/api/sources/refresh/route.ts:13-31` | Queues background source refresh. |
| Research briefs CRUD API | `app/api/research/briefs/route.ts` | API | `app/api/research/briefs/route.ts:46-133` | Mostly direct Prisma mutations; `PATCH routeToQueue` delegates to research action service. |
| Research reports CRUD API | `app/api/research/reports/route.ts` | API | `app/api/research/reports/route.ts:41-113` | Direct Prisma-backed mutations. |
| Scheduled summary run API | `app/api/research/summaries/run-due/route.ts` | API | `app/api/research/summaries/run-due/route.ts:29-89` | Directly generates summaries/reports. |
| Admin access mutation API | `app/api/admin/access/route.ts` | API | `app/api/admin/access/route.ts`; `src/server/services/governed-admin-access-action-service.ts` | Governed privileged mutations with explicit confirmation and typed-service authorization. |
| Control center overview API | `app/api/control-center/overview/route.ts` | API | `app/api/control-center/overview/route.ts:10-21` | Read path; also calls `ensureDigestScheduler()`. |
| Digest scheduler loop | `services/digestScheduler.js` | Autonomous service initiator | `services/digestScheduler.js:20-45`, `70-84` | Confirmed timer-based background initiator. |
| Watcher loop | `services/watcher.js` | Autonomous service initiator | `services/watcher.js:147-235`, `238-321` | Confirmed timer-based rule evaluator. |
| Scheduler loop | `services/scheduler.js` | Autonomous service initiator | `services/scheduler.js:204-347`, `351-409` | Confirmed timer-based schedule runner. |
| Legacy console compatibility module | `services/consoleApi.js`, `services/legacyConsoleHandler.js` | Internal/module entrypoint | `services/consoleApi.js:1-5`; `services/legacyConsoleHandler.js:635-713`, `908-911` | Still exported; external callers are not enumerated in repo. |
| Operational auth/session/health probes | `app/api/auth/*`, `app/api/health/route.ts`, `app/api/ready/route.ts` | API | `app/api/auth/session/route.ts:1-10`; `app/api/auth/login/route.ts:1-31`; `app/api/health/route.ts:1-48`; `app/api/ready/route.ts:1-46` | Operational and auth bootstrap surfaces. |

## STEP 2 — RUNTIME PATH INVENTORY

| Path Name | Entrypoint | Flow (step-by-step) | Reaches Control | Reaches Planner | Reaches Review | Reaches Router | Reaches Engine | Evidence | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Console interactive path | `POST /api/console` | `Terminal.tsx` -> `app/api/console/route.ts` -> `executeTerminalRequest()` -> governed candidates use `executeControlledPlan()` / `executeControlledStructuredPlan()` -> reviewed plan -> execution engine -> `toolRouter.route()`; residual fallback branches still handle read-formatting helpers and legacy help | yes | partial | yes | yes | yes | `src/components/Terminal.tsx:931-938`; `app/api/console/route.ts:29-38`; `src/server/services/console-runtime.ts`; `services/runtimeControl.js`; `services/executionEngine.js`; `services/toolRouter.js` | The console path now has a real governed execution lane for most action traffic, but it is not yet the only lane. |
| Console overview read path | `GET /api/console` | `Terminal.tsx` -> `GET /api/console` -> `ensureDigestScheduler()` -> `getTerminalOverview()` -> typed overview builders | no | no | no | no | no | `src/components/Terminal.tsx:926-929`; `app/api/console/route.ts:12-24`; `src/server/services/console-runtime.ts:165-214`; `services/digestScheduler.js:70-84` | Read path, but scheduler initialization is a side effect. |
| Console stream path | `GET /api/console/stream` | `Terminal.tsx` EventSource -> `ensureDigestScheduler()` -> loop -> `queueTerminalDigestSweep()` -> `queueLegacyDueDigestSweepIfNeeded()` -> enqueue `digest:run-due` job -> `getTerminalOverview()` for stream payload | no | no | no | no | no | `src/components/Terminal.tsx:1196-1203`; `app/api/console/stream/route.ts:13-76`; `src/server/services/console-runtime.ts:486-490`; `services/legacyConsoleOperationsSupport.js:98-151` | Mixed read/write path. Downstream `digest:run-due` processor registration is only partially verified. |
| Operations action path | `POST /api/operations/actions` | route auth/workspace check -> `executeGovernedOperationsAction()` -> control/review -> execution engine -> `toolRouter.route()` -> `executeOperationsAction()` | yes | structured plan | yes | yes | yes | `app/api/operations/actions/route.ts`; `src/server/services/governed-operations-action-service.ts`; `services/runtimeControl.js`; `services/executionEngine.js`; `services/toolRouter.js` | Higher-risk actions stop at `confirm_required`; the client resubmits only after explicit operator confirmation. |
| Research action path | `POST /api/research/actions` | route auth/workspace check -> internal `research:*` action -> control/review -> execution engine -> `toolRouter.route()` -> `executeResearchAction()` | yes | structured plan | yes | yes | yes | `app/api/research/actions/route.ts`; `src/server/services/governed-research-action-service.ts`; `services/runtimeControl.js`; `services/executionEngine.js`; `services/toolRouter.js` | Internal IDs prevent collisions with legacy console handlers; typed service authorization remains downstream. |
| Dashboard action path | `POST /api/dashboard/actions` | route auth/workspace check -> internal `dashboard:*` action -> control/review -> execution engine -> `toolRouter.route()` -> `executeDashboardAction()` | yes | structured plan | yes | yes | yes | `app/api/dashboard/actions/route.ts`; `src/server/services/governed-dashboard-action-service.ts`; `services/runtimeControl.js`; `services/executionEngine.js`; `services/toolRouter.js` | Internal IDs avoid legacy alert/workspace handler collisions; typed service workspace checks remain downstream. |
| Admin privileged mutation path | `PATCH /api/admin/access` | route admin check -> internal `admin:*` action -> control/review -> execution engine -> `toolRouter.route()` -> `executeAdminAccessAction()` -> typed admin/control-center service | yes | structured plan | yes | yes | yes | `app/api/admin/access/route.ts`; `src/server/services/governed-admin-access-action-service.ts`; `src/server/services/admin-access-action-service.ts`; `services/toolRouter.js` | All nine mutation types use collision-free IDs; confirmation, admin authorization, actor propagation, and response status semantics are preserved. |
| Jobs queue management path | `POST /api/jobs` | route auth/workspace/rate checks -> internal `jobs:*` action -> control/review -> execution engine -> `toolRouter.route()` -> `executeJobAction()` -> target-workspace authorization -> queue mutation | yes | structured plan | yes | yes | yes | `app/api/jobs/route.ts`; `src/server/services/governed-job-action-service.ts`; `src/server/services/job-action-service.ts`; `services/toolRouter.js` | Governs API admission and queue mutation; asynchronous worker processor execution is tracked separately. |
| Insights direct path | `POST /api/insights` with `async=false` | route -> `generateWorkspaceInsights()` -> Prisma reads/writes -> optional alert creation | no | no | no | no | no | `app/api/insights/route.ts:54-63`; `src/server/services/insight-service.ts:5-70` | Direct execution path. |
| Insights queued path | `POST /api/insights` with `async=true` | route -> `queueBackgroundJob("workspace:generate-insights")` with durable admission -> worker validates contract/type/workspace/actor -> registered processor -> `generateWorkspaceInsights()` | no | no | no | no | no | `app/api/insights/route.ts:39-51`; `src/server/jobs/background-jobs.ts`; `services/jobQueue.js`; `services/jobQueueStore.js` | Queue-managed with fail-closed processor admission, but the initiating route still bypasses control/review. |
| Agent task queued execution path | `POST /api/agents/tasks` with `runNow=true` | route -> `createAgentTask()` -> `queueBackgroundJob("agent:execute")` with durable admission -> worker contract validation -> `startAgentExecution()` / `completeAgentExecution()` | no | no | no | no | no | `app/api/agents/tasks/route.ts:33-63`; `src/server/jobs/background-jobs.ts`; `services/jobQueue.js` | Typed processor admission is enforced; route admission and processor side effects do not yet traverse the full runtime. |
| Source refresh path | `POST /api/sources/refresh` | route -> `requestSourceRefresh()` -> `queueBackgroundJob("source:refresh")` with durable admission -> worker contract validation -> `refreshSourceByConnector()` | no | no | no | no | no | `app/api/sources/refresh/route.ts:13-31`; `src/server/services/source-service.ts:83-146`; `src/server/jobs/background-jobs.ts`; `services/jobQueue.js` | Network mutation now has fail-closed typed processor admission, but the initiating route still bypasses control/review. |
| Research briefs CRUD path | `/api/research/briefs` | route -> `createBrief()` / `updateBrief()` / `deleteBrief()` direct Prisma; optional `PATCH routeToQueue` -> `executeResearchAction("brief:route")` | no | no | no | no | no | `app/api/research/briefs/route.ts:56-133`; `src/server/services/research-service.ts:72-143`; `src/server/services/research-action-service.ts:74-104` | Mostly direct mutations; one subpath delegates to research action service. |
| Research reports CRUD path | `/api/research/reports` | route -> `createReport()` / `updateReport()` / `deleteReport()` direct Prisma transaction path | no | no | no | no | no | `app/api/research/reports/route.ts:51-113`; `src/server/services/research-service.ts:145-224` | Direct mutation path. |
| Scheduled summary generation path | `POST /api/research/summaries/run-due` | route -> `isScheduleDue()` filter -> `createSummaryReportForView()` or `generateSummaryForView()` | no | no | no | no | no | `app/api/research/summaries/run-due/route.ts:29-89`; `src/server/services/summary-service.ts:39-192` | Direct generation path, not queued and not governed. |
| Legacy console compatibility path | `services/consoleApi.js` / `legacyConsoleHandler.handleConsoleRequest()` | compatibility export -> `createLegacyConsoleRequestHandlers()` -> `reviewControlRequest()` -> direct legacy command/action handlers and job queue helpers | yes | no | yes | no | no | `services/consoleApi.js:1-5`; `services/legacyConsoleHandler.js:635-713`; `services/legacyConsoleRequestHandlers.js:78-249` | Confirmed governed wrapper, but still dispatches legacy direct handlers after review. External callers inside repo are unverified. |
| External worker processor path | `npm run worker:jobs` | worker loop -> persisted job -> admission contract/type/workspace/actor/provenance validation -> typed registered processor -> direct service | no | no | admission contract | no | no | `scripts/job-worker.ts`; `src/server/jobs/background-jobs.ts`; `services/jobQueue.js`; `services/jobQueueStore.js` | Typed processors fail closed before execution without matching durable admission; legacy processors and direct service execution remain outside full runtime governance. |
| Digest scheduler autonomous path | `ensureDigestScheduler()` timer | API GET/stream or control-center overview -> `ensureDigestScheduler()` -> timer -> `runDigestSchedulerSweep()` -> `queueLegacyDueDigestSweepIfNeeded()` -> enqueue `digest:run-due` | no | no | no | no | no | `services/digestScheduler.js:20-45`, `70-84`; `services/legacyConsoleOperationsSupport.js:98-151` | Processor registration for `digest:run-due` is not confirmed at enqueue site. |
| Watcher autonomous path | `startWatcher()` timer | `startWatcher()` -> timer -> `evaluateRules()` -> `startSchedule()` | no | no | no | no | no | `services/watcher.js:147-235`, `238-321`; `services/scheduler.js:379-409` | Autonomous orchestration path without control/review. |
| Scheduler autonomous path | `startSchedule()` timer | `startSchedule()` -> timer -> `runScheduledTick()` -> `resumeAgentForScheduler()` -> `tickAgent()` | no | no | no | no | no | `services/scheduler.js:204-409` | Autonomous execution path without control/review. |
| Health / readiness path | `GET /api/health`, `GET /api/ready` | route -> configure queue health -> db check / runtime warnings -> structured status response | no | no | no | no | no | `app/api/health/route.ts:1-48`; `app/api/ready/route.ts:1-46` | Operational probes; low-risk. |
| Auth/session path | `/api/auth/*`, `/api/auth/session` | route -> auth helper functions -> session cookie set/clear or session read | no | no | no | no | no | `app/api/auth/login/route.ts:1-31`; `app/api/auth/logout/route.ts:1-10`; `app/api/auth/signup/route.ts:1-51`; `app/api/auth/session/route.ts:1-10` | Authentication bootstrap path; outside target runtime by design. |

### Internal Target-Architecture Helper With No Confirmed Entrypoint

The only confirmed full `control -> planner -> review/intervention -> engine -> router` helper is `executeControlledPlan()` in `services/runtimeControl.js:940-979`. A repo-wide search found no caller during this audit. This helper is therefore closest to the target architecture, but it is not counted as a confirmed runtime entrypoint.

## STEP 3 — CLASSIFICATION TABLE

| Path Name | Classification | Justification | Evidence |
| --- | --- | --- | --- |
| Console interactive path | `PARTIAL_GOVERNED` | Most action traffic now proceeds through control/review plus execution engine and router, but the endpoint still contains residual non-governed fallback behavior for some read/helper flows. | `src/server/services/console-runtime.ts`; `services/runtimeControl.js`; `services/executionEngine.js`; `services/toolRouter.js` |
| Console overview read path | `EXCEPTION` | Read-oriented overview path. Side effect is scheduler initialization, which is operational rather than direct user mutation. | `app/api/console/route.ts:12-24`; `services/digestScheduler.js:70-84` |
| Console stream path | `PARTIAL_UNORCHESTRATED` | The stream path is mainly read-only, but it enqueues digest work on a timer without going through control/review. | `app/api/console/stream/route.ts:31-76`; `services/legacyConsoleOperationsSupport.js:98-151` |
| Operations action path | `GOVERNED` | Authenticated operations actions use structured control review, confirmation where required, and engine/router dispatch before the operations service mutates state. | `app/api/operations/actions/route.ts`; `src/server/services/governed-operations-action-service.ts`; `services/toolRouter.js` |
| Research action path | `GOVERNED` | Authenticated research actions use collision-free structured plans, explicit confirmation, and engine/router dispatch before typed service mutations. | `app/api/research/actions/route.ts`; `src/server/services/governed-research-action-service.ts`; `services/toolRouter.js` |
| Dashboard action path | `GOVERNED` | Authenticated workspace members use collision-free structured plans, explicit confirmation, and engine/router dispatch before typed service mutation or queueing. | `app/api/dashboard/actions/route.ts`; `src/server/services/governed-dashboard-action-service.ts`; `services/toolRouter.js` |
| Admin privileged mutation path | `GOVERNED` | Route-level admin checks, collision-free structured plans, explicit confirmation, engine/router admission, and downstream typed-service authorization are enforced for all privileged mutations. | `app/api/admin/access/route.ts`; `src/server/services/governed-admin-access-action-service.ts`; `src/server/services/admin-access-action-service.ts`; `services/toolRouter.js` |
| Jobs queue management path | `GOVERNED` | Queue creation, cancellation, and retry use structured review, explicit confirmation, engine/router admission, and target-workspace authorization before mutation. | `app/api/jobs/route.ts`; `src/server/services/governed-job-action-service.ts`; `src/server/services/job-action-service.ts`; `services/toolRouter.js` |
| Insights direct path | `BYPASS` | Direct generation and optional alert creation with no governed runtime. | `app/api/insights/route.ts:54-63`; `src/server/services/insight-service.ts:5-70` |
| Insights queued path | `PARTIAL_GOVERNED` | Typed processor admission is durable and fail-closed, but the route and processor side effect do not traverse control/review/router/engine. | `app/api/insights/route.ts:39-51`; `src/server/jobs/background-jobs.ts`; `services/jobQueue.js` |
| Agent task queued execution path | `PARTIAL_GOVERNED` | Typed processor admission is enforced, but route admission and downstream execution remain outside the full governed runtime. | `app/api/agents/tasks/route.ts:54-63`; `src/server/jobs/background-jobs.ts`; `services/jobQueue.js` |
| Source refresh path | `PARTIAL_GOVERNED` | Durable typed processor admission protects the network mutation boundary, while the initiating route still bypasses full runtime control. | `app/api/sources/refresh/route.ts:13-31`; `src/server/services/source-service.ts`; `src/server/jobs/background-jobs.ts` |
| Research briefs CRUD path | `BYPASS` | Direct Prisma-backed CRUD path; one sub-branch routes to the research action service, which is also bypass. | `app/api/research/briefs/route.ts:56-133`; `src/server/services/research-service.ts:72-143` |
| Research reports CRUD path | `BYPASS` | Direct Prisma-backed CRUD path with no governed runtime layers. | `app/api/research/reports/route.ts:51-113`; `src/server/services/research-service.ts:145-224` |
| Scheduled summary generation path | `BYPASS` | Directly performs summary/report generation without queue governance or runtime control. | `app/api/research/summaries/run-due/route.ts:29-89`; `src/server/services/summary-service.ts:39-192` |
| Legacy console compatibility path | `PARTIAL_GOVERNED` | It enters `reviewControlRequest()`, but then branches into legacy direct handlers instead of planner/router/engine. | `services/legacyConsoleHandler.js:635-713`; `services/legacyConsoleRequestHandlers.js:78-249` |
| External worker processor path | `PARTIAL_GOVERNED` | Typed processors require matching durable admission evidence before execution, but still invoke services directly and legacy processors are not covered. | `scripts/job-worker.ts`; `src/server/jobs/background-jobs.ts`; `services/jobQueue.js`; `services/jobQueueStore.js` |
| Digest scheduler autonomous path | `PARTIAL_UNORCHESTRATED` | Autonomous initiator that queues work without control/review. Processor registration is only partially verified. | `services/digestScheduler.js:20-45`, `70-84`; `services/legacyConsoleOperationsSupport.js:98-151`; `services/legacyConsoleHandler.js:497-509` |
| Watcher autonomous path | `PARTIAL_UNORCHESTRATED` | Autonomous rule engine starts schedules directly, without governed runtime layers. | `services/watcher.js:147-235`, `238-321` |
| Scheduler autonomous path | `PARTIAL_UNORCHESTRATED` | Autonomous schedule ticks call agent runtime directly, without governed runtime layers. | `services/scheduler.js:204-409` |
| Health / readiness path | `EXCEPTION` | Operational health/readiness probes are intentionally outside the governed runtime and are low-risk. | `app/api/health/route.ts:1-48`; `app/api/ready/route.ts:1-46` |
| Auth/session path | `EXCEPTION` | Auth bootstrap/session endpoints are intentionally outside the action runtime. | `app/api/auth/login/route.ts:1-31`; `app/api/auth/logout/route.ts:1-10`; `app/api/auth/signup/route.ts:1-51`; `app/api/auth/session/route.ts:1-10` |

## STEP 4 — BYPASS REGISTER

| Path Name | Location | What It Bypasses | Risk Level | Frequency | Why It Exists | Recommendation | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Scheduled summary generation path | `app/api/research/summaries/run-due/route.ts` | Control, planner, review/intervention, queue governance, router, engine | Medium | Medium | Convenience endpoint directly runs due schedules. | Move toward queued, reviewed execution or explicitly carve out as constrained scheduler logic. | `app/api/research/summaries/run-due/route.ts:29-89`; `src/server/services/summary-service.ts:39-192` |
| Source refresh path | `app/api/sources/refresh/route.ts` -> worker processor | Control, review/intervention, router, engine | High | Medium | Uses fail-closed typed worker admission, but the route and connector mutation still bypass the full governed runtime. | High-priority queue-path unification candidate because it performs network mutation. | `app/api/sources/refresh/route.ts:13-31`; `src/server/jobs/background-jobs.ts:131-166` |
| External worker processor path | `scripts/job-worker.ts` -> `src/server/jobs/background-jobs.ts` | Full control/planner/router/engine admission after the durable contract gate; legacy processor coverage | High | Medium | Typed processor contracts now fail closed, but accepted work still invokes services directly. | Route typed processor execution through reviewed runtime admission and migrate legacy processor registrations to explicit contracts. | `scripts/job-worker.ts`; `src/server/jobs/background-jobs.ts`; `services/jobQueue.js` |
| Watcher -> scheduler path | `services/watcher.js` -> `services/scheduler.js` | Control, planner, review/intervention, router, engine | High | Medium | Legacy autonomous coordination loop. | Audit and constrain before any broader automation work; likely needs staged unification. | `services/watcher.js:147-235`, `238-321`; `services/scheduler.js:204-409` |
| Scheduler -> agent tick path | `services/scheduler.js` -> `services/agentRuntime.js` | Control, planner, review/intervention, router, engine | High | Medium | Legacy scheduling/runtime flow predates current control stack. | Treat as a later but high-risk unification track. | `services/scheduler.js:204-409`; `services/agentRuntime.js:230-280` |
| Console stream digest sweep path | `app/api/console/stream/route.ts` | Control, review/intervention, explicit queue governance | Medium | High | Keeps dashboard stream current and opportunistically queues due digests. | Separate read streaming from side-effecting digest queueing, or wrap queue request in control/review. | `app/api/console/stream/route.ts:31-76`; `services/legacyConsoleOperationsSupport.js:98-151` |
| Plugin run queue path | `src/server/services/terminal-command-service.ts`, `src/server/services/terminal-action-service.ts` | Confirmed reviewed processor registration; also bypasses control once queued | High | Medium | Plugin invocation is queued as a job. | Unify plugin jobs under explicit reviewed execution contracts. Processor registration dependency should be made explicit. | `src/server/services/terminal-command-service.ts:415-430`; `src/server/services/terminal-action-service.ts:248-267`; `services/legacyConsoleHandler.js:474-509` |

## STEP 5 — EXCEPTION REGISTER

| Path Name | Location | Justification | Should Remain? (yes/no) | Guardrails Present | Evidence | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Health probe path | `app/api/health/route.ts` | Operational health/readiness probe; returns status only. | yes | Runtime/db/job health checks; no domain mutation. | `app/api/health/route.ts:1-48` | Queue configuration call is operational setup, not domain execution. |
| Readiness probe path | `app/api/ready/route.ts` | Operational readiness probe; explicit startup validation endpoint. | yes | Read-only status plus feature-flag bootstrap. | `app/api/ready/route.ts:1-46` | `ensureDefaultFeatureFlags()` mutates defaults, but this is startup/bootstrap behavior rather than user-directed domain execution. |
| Auth/session bootstrap path | `app/api/auth/*`, `app/api/auth/session` | Authentication/session lifecycle is outside the target runtime request-to-execution architecture. | yes | Rate limiting, schema validation, auth helpers. | `app/api/auth/login/route.ts:1-31`; `app/api/auth/signup/route.ts:1-51`; `app/api/auth/logout/route.ts:1-10`; `app/api/auth/session/route.ts:1-10` | Keep separate from action runtime. |
| Console overview read path | `GET /api/console` | Primary purpose is read-only overview delivery. | yes, if side effects are split out later | Auth + workspace membership checks. | `app/api/console/route.ts:12-24` | The embedded `ensureDigestScheduler()` side effect makes this exception less clean than health/auth paths. |

## STEP 6 — RISK SUMMARY

### Top 5 High-Risk Paths

1. External worker processor path
   Typed work is contract-gated, but accepted processors still execute direct service calls and legacy processors remain outside the gate.
2. Watcher -> scheduler -> agent tick path
   Multi-step autonomous coordination with process-wide effects.
3. Source refresh path
   Network mutation through queued worker path without runtime governance.
4. Plugin run queue path
   Reviewed enqueueing still hands work to a processor boundary without governed execution admission.
5. Scheduled summary generation path
   User-triggerable generation still executes outside the governed runtime.

### Top 5 Highest-Frequency Risky Paths

1. Console stream digest sweep path
   High-frequency SSE loop; side-effecting queue request on a timer.
2. Console interactive path
   Main user-facing action path; partially governed but still hybrid.
3. Scheduled summary generation path
   Direct generation path used by recurring research workflows.
4. Source refresh path
   User-triggerable network work enters an ungoverned queue path.
5. Research briefs CRUD path
   Common desk mutations still use a direct Prisma-backed service path.

### Top 5 Easiest Migration Candidates

1. Source refresh path
   Single queued mutation type with clear contract.
2. Legacy console compatibility path
   Similar request vocabulary to the console path, but still exits through legacy direct handlers.
3. Scheduled summary generation path
   Typed input and a narrow service boundary make reviewed dispatch practical.
4. Research reports CRUD path
   Direct typed mutations have a clear route-to-service boundary.
5. Research briefs CRUD path
   Direct typed mutations have a clear route-to-service boundary.

### Most Inconsistent Runtime Behaviors

- The shared controlled-plan helper now serves console, operations, research, dashboard, admin, and jobs API action paths, while worker execution and CRUD paths still bypass it.
- Governed interactive APIs coexist with direct CRUD and autonomous job initiators, producing inconsistent admission guarantees by entrypoint.
- Typed background jobs now persist and enforce processor admission evidence, while legacy processors (`plugin:run`, `digest:run-due`, `watcher:run`, `alerts:run`, `brief:route`, `report:*`) remain registered without the typed contract.
- Queue enqueue sites for legacy-style jobs do not directly call `ensureJobProcessorsRegistered()`, so downstream execution is partially verified rather than explicit.
- Some read endpoints (`GET /api/console`, `GET /api/console/stream`, `GET /api/control-center/overview`) trigger scheduler setup or queue side effects even though they are primarily read surfaces.

## STEP 7 — MIGRATION PRIORITIES

| Path Name | Current Classification | Priority (high/medium/low/exception) | Reason | Complexity | Evidence |
| --- | --- | --- | --- | --- | --- |
| Console interactive path | `PARTIAL_GOVERNED` | medium | Major migration work is complete, but residual fallback behavior still deserves cleanup. | Medium | `src/server/services/console-runtime.ts`; `services/runtimeControl.js`; `services/executionEngine.js`; `services/toolRouter.js` |
| Operations action path | `GOVERNED` | complete | Structured review, confirmation, engine, and router admission are now enforced. | Complete | `app/api/operations/actions/route.ts`; `src/server/services/governed-operations-action-service.ts` |
| Research action path | `GOVERNED` | complete | Collision-free structured review, confirmation, engine, and router admission are now enforced. | Complete | `app/api/research/actions/route.ts`; `src/server/services/governed-research-action-service.ts` |
| Jobs queue management path | `GOVERNED` | complete | Queue mutation admission, confirmation, engine/router dispatch, and target-workspace authorization are enforced. | Complete | `app/api/jobs/route.ts`; `src/server/services/governed-job-action-service.ts`; `src/server/services/job-action-service.ts` |
| External worker processor path | `PARTIAL_GOVERNED` | high | Durable typed admission now fails closed, but full reviewed execution and legacy processor coverage remain. | High | `scripts/job-worker.ts`; `src/server/jobs/background-jobs.ts`; `services/jobQueue.js`; `services/jobQueueStore.js` |
| Source refresh path | `PARTIAL_GOVERNED` | high | Typed worker admission is fail-closed, but route admission and the connector mutation remain outside the full runtime. | Medium | `src/server/services/source-service.ts:83-146`; `src/server/jobs/background-jobs.ts:131-166` |
| Admin privileged mutation path | `GOVERNED` | complete | Admin admission, confirmation, structured review, engine/router dispatch, and typed-service authorization are enforced. | Complete | `app/api/admin/access/route.ts`; `src/server/services/governed-admin-access-action-service.ts` |
| Dashboard action path | `GOVERNED` | complete | Workspace membership, structured review, explicit confirmation, engine, and router admission are enforced. | Complete | `app/api/dashboard/actions/route.ts`; `src/server/services/governed-dashboard-action-service.ts` |
| Research briefs CRUD path | `BYPASS` | medium | Moderate mutation scope, but straightforward service surface. | Medium | `app/api/research/briefs/route.ts:56-133` |
| Research reports CRUD path | `BYPASS` | medium | Similar to briefs CRUD; direct service path. | Medium | `app/api/research/reports/route.ts:51-113` |
| Scheduled summary generation path | `BYPASS` | medium | Mixed generation path with direct execution; should eventually align with queued/reviewed path. | Medium | `app/api/research/summaries/run-due/route.ts:29-89` |
| Console stream digest sweep path | `PARTIAL_UNORCHESTRATED` | medium | High-frequency but narrower blast radius than privileged action paths. | Medium | `app/api/console/stream/route.ts:31-76` |
| Watcher autonomous path | `PARTIAL_UNORCHESTRATED` | medium | High-risk, but deeper legacy rewiring required. | High | `services/watcher.js:147-321` |
| Scheduler autonomous path | `PARTIAL_UNORCHESTRATED` | medium | Deep legacy agent runtime coupling. | High | `services/scheduler.js:204-409` |
| Console overview read path | `EXCEPTION` | exception | Primarily read-only; can remain outside main action runtime if side effects are separated. | Low | `app/api/console/route.ts:12-24` |
| Health / readiness path | `EXCEPTION` | exception | Operational probes should stay outside action runtime. | Low | `app/api/health/route.ts:1-48`; `app/api/ready/route.ts:1-46` |
| Auth/session path | `EXCEPTION` | exception | Auth bootstrap belongs outside governed action runtime. | Low | `app/api/auth/login/route.ts:1-31`; `app/api/auth/signup/route.ts:1-51` |

## STEP 8 — SUMMARY

The runtime is healthiest where it has an explicit gateway: the console, operations, research, dashboard, admin, and jobs API action paths. These interactive paths now have confirmed control-to-engine-to-router execution.

The runtime is most fragmented in three places:

1. Remaining typed CRUD and generation APIs that bypass the governed runtime.
2. Queue/worker execution paths whose typed processors now have durable admission contracts but still lack full control/review/router execution and legacy coverage.
3. Legacy autonomous loops (`digest scheduler`, `watcher`, `scheduler`) that can start meaningful work without the modern control stack.

The console, operations, research, dashboard, admin, and jobs API action paths are now unified. Typed worker processors now fail closed on missing or mismatched admission evidence; the strongest next migration candidates are full reviewed worker execution and autonomous initiators, followed by direct research CRUD and scheduled-generation paths.

Paths that can remain exception-only are operational health/readiness probes and auth/session bootstrap endpoints. They are explicit, low-risk, and operationally necessary outside the action runtime.

Remaining uncertainty:

- Typed queue processor admission remains a durable contract gate rather than a full control/review/engine/router path.
- Legacy job processor execution for `plugin:run`, `digest:run-due`, and related legacy job types is only partially verified because processor registration lives in `services/legacyConsoleHandler.js:467-509`, while enqueue sites do not directly invoke `ensureJobProcessorsRegistered()`.
- Some low-risk read APIs were grouped rather than traced one-by-one when they followed the same `auth + service read` shape and did not initiate meaningful execution.
