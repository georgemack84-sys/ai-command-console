# Phase 3.3A Runtime Path Audit

Date: 2026-04-18
Repository: `MissionControl / AI Command Console`
Scope: Audit artifact refreshed after Phase 3.3 migration cleanup. This document still describes runtime-path findings, but key console-path notes now reflect the governed routing work completed on 2026-04-18.

## Post-Migration Refresh

Since the initial audit, the console runtime has materially improved:

- structured console actions now route through `control -> reviewed plan -> execution engine -> toolRouter` for terminal actions, operations actions, collaboration actions, digest actions, and governance-compat actions
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
| Operations actions API | `app/api/operations/actions/route.ts` | API | `app/api/operations/actions/route.ts:6-16` | Direct action execution service. |
| Research actions API | `app/api/research/actions/route.ts` | API | `app/api/research/actions/route.ts:6-16` | Direct action execution service. |
| Dashboard actions API | `app/api/dashboard/actions/route.ts` | API | `app/api/dashboard/actions/route.ts:6-15` | Direct action execution service. |
| Jobs API | `app/api/jobs/route.ts` | API | `app/api/jobs/route.ts:42-125` | Queues and manages background jobs. |
| Insights API | `app/api/insights/route.ts` | API | `app/api/insights/route.ts:15-64` | Has both direct execution and queued execution paths. |
| Agent tasks API | `app/api/agents/tasks/route.ts` | API | `app/api/agents/tasks/route.ts:16-67` | Creates tasks and can queue `agent:execute`. |
| Source refresh API | `app/api/sources/refresh/route.ts` | API | `app/api/sources/refresh/route.ts:13-31` | Queues background source refresh. |
| Research briefs CRUD API | `app/api/research/briefs/route.ts` | API | `app/api/research/briefs/route.ts:46-133` | Mostly direct Prisma mutations; `PATCH routeToQueue` delegates to research action service. |
| Research reports CRUD API | `app/api/research/reports/route.ts` | API | `app/api/research/reports/route.ts:41-113` | Direct Prisma-backed mutations. |
| Scheduled summary run API | `app/api/research/summaries/run-due/route.ts` | API | `app/api/research/summaries/run-due/route.ts:29-89` | Directly generates summaries/reports. |
| Admin access mutation API | `app/api/admin/access/route.ts` | API | `app/api/admin/access/route.ts:132-191` | Direct privileged mutations. |
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
| Operations action path | `POST /api/operations/actions` | route -> `executeOperationsAction()` -> direct Prisma / policy-governance / workspace-operations mutations | no | no | no | no | no | `app/api/operations/actions/route.ts:6-16`; `src/server/services/operations-action-service.ts` (schema and direct handlers, e.g. `990-1020`) | No control or runtime router involvement found. |
| Research action path | `POST /api/research/actions` | route -> `executeResearchAction()` -> direct Prisma mutations / report service calls / activity writes | no | no | no | no | no | `app/api/research/actions/route.ts:6-16`; `src/server/services/research-action-service.ts:74-224` | No control or runtime router involvement found. |
| Dashboard action path | `POST /api/dashboard/actions` | route -> `executeDashboardAction()` -> direct Prisma writes or `queueBackgroundJob()` | no | no | no | no | no | `app/api/dashboard/actions/route.ts:6-15`; `src/server/services/dashboard-action-service.ts:29-128` | One branch queues jobs; others mutate state directly. |
| Jobs queue management path | `POST /api/jobs` | route -> `queueBackgroundJob()` / `cancelBackgroundJob()` / `retryBackgroundJob()` -> `ensureBackgroundJobProcessors()` -> `enqueueJob()` or job state mutation | no | no | no | no | no | `app/api/jobs/route.ts:68-125`; `src/server/jobs/background-jobs.ts:60-279`; `services/jobQueue.js:104-126`, `559-565` | Uses queue infrastructure, but not control/review/router/engine. |
| Insights direct path | `POST /api/insights` with `async=false` | route -> `generateWorkspaceInsights()` -> Prisma reads/writes -> optional alert creation | no | no | no | no | no | `app/api/insights/route.ts:54-63`; `src/server/services/insight-service.ts:5-70` | Direct execution path. |
| Insights queued path | `POST /api/insights` with `async=true` | route -> `queueBackgroundJob("workspace:generate-insights")` -> worker cycle -> registered processor -> `generateWorkspaceInsights()` | no | no | no | no | no | `app/api/insights/route.ts:39-51`; `src/server/jobs/background-jobs.ts:72-92`; `services/jobQueue.js:559-565` | Queue-managed, but bypasses governed runtime. |
| Agent task queued execution path | `POST /api/agents/tasks` with `runNow=true` | route -> `createAgentTask()` -> `queueBackgroundJob("agent:execute")` -> worker cycle -> registered processor -> `startAgentExecution()` / `completeAgentExecution()` | no | no | no | no | no | `app/api/agents/tasks/route.ts:33-63`; `src/server/jobs/background-jobs.ts:168-197`; `services/jobQueue.js:559-565` | Queue path; placeholder agent execution implementation. |
| Source refresh path | `POST /api/sources/refresh` | route -> `requestSourceRefresh()` -> `queueBackgroundJob("source:refresh")` -> worker cycle -> registered processor -> `refreshSourceByConnector()` | no | no | no | no | no | `app/api/sources/refresh/route.ts:13-31`; `src/server/services/source-service.ts:83-146`; `src/server/jobs/background-jobs.ts:131-166` | Queue-managed mutation path. |
| Research briefs CRUD path | `/api/research/briefs` | route -> `createBrief()` / `updateBrief()` / `deleteBrief()` direct Prisma; optional `PATCH routeToQueue` -> `executeResearchAction("brief:route")` | no | no | no | no | no | `app/api/research/briefs/route.ts:56-133`; `src/server/services/research-service.ts:72-143`; `src/server/services/research-action-service.ts:74-104` | Mostly direct mutations; one subpath delegates to research action service. |
| Research reports CRUD path | `/api/research/reports` | route -> `createReport()` / `updateReport()` / `deleteReport()` direct Prisma transaction path | no | no | no | no | no | `app/api/research/reports/route.ts:51-113`; `src/server/services/research-service.ts:145-224` | Direct mutation path. |
| Scheduled summary generation path | `POST /api/research/summaries/run-due` | route -> `isScheduleDue()` filter -> `createSummaryReportForView()` or `generateSummaryForView()` | no | no | no | no | no | `app/api/research/summaries/run-due/route.ts:29-89`; `src/server/services/summary-service.ts:39-192` | Direct generation path, not queued and not governed. |
| Admin privileged mutation path | `PATCH /api/admin/access` | route -> `updateUserRole()` / `updateUserStatus()` / `moveUserToWorkspace()` / `saveControlCenterWorkspacePolicy()` / `saveControlCenterGovernance()` / `runAdminAiSummaryCheck()` | no | no | no | no | no | `app/api/admin/access/route.ts:132-191`; `src/server/services/admin-service.ts:93-258`; `src/server/services/control-center-service.ts` | Privileged direct mutation path. |
| Legacy console compatibility path | `services/consoleApi.js` / `legacyConsoleHandler.handleConsoleRequest()` | compatibility export -> `createLegacyConsoleRequestHandlers()` -> `reviewControlRequest()` -> direct legacy command/action handlers and job queue helpers | yes | no | yes | no | no | `services/consoleApi.js:1-5`; `services/legacyConsoleHandler.js:635-713`; `services/legacyConsoleRequestHandlers.js:78-249` | Confirmed governed wrapper, but still dispatches legacy direct handlers after review. External callers inside repo are unverified. |
| External worker processor path | `npm run worker:jobs` | `scripts/job-worker.ts` -> `configureJobQueue()` -> `ensureBackgroundJobProcessors()` -> loop `runJobWorkerCycle()` -> registered processors -> direct services | no | no | no | no | no | `scripts/job-worker.ts:10-39`; `src/server/jobs/background-jobs.ts:60-199`; `services/jobQueue.js:559-565` | Autonomous execution path. |
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
| Operations action path | `BYPASS` | Directly mutates workspace/policy state with auth and schema validation only. No control/review/router/engine. | `app/api/operations/actions/route.ts:6-16`; `src/server/services/operations-action-service.ts` |
| Research action path | `BYPASS` | Direct action service with Prisma writes and no governed runtime layers. | `app/api/research/actions/route.ts:6-16`; `src/server/services/research-action-service.ts:74-224` |
| Dashboard action path | `BYPASS` | Direct state mutation or direct queue request without control/review. | `app/api/dashboard/actions/route.ts:6-15`; `src/server/services/dashboard-action-service.ts:29-128` |
| Jobs queue management path | `PARTIAL_UNORCHESTRATED` | Uses queue infrastructure and processors, but bypasses control/review/router/engine. | `app/api/jobs/route.ts:68-125`; `src/server/jobs/background-jobs.ts:60-279`; `services/jobQueue.js:559-565` |
| Insights direct path | `BYPASS` | Direct generation and optional alert creation with no governed runtime. | `app/api/insights/route.ts:54-63`; `src/server/services/insight-service.ts:5-70` |
| Insights queued path | `PARTIAL_UNORCHESTRATED` | Queue-managed execution, but no control/review/router/engine. | `app/api/insights/route.ts:39-51`; `src/server/jobs/background-jobs.ts:72-92` |
| Agent task queued execution path | `PARTIAL_UNORCHESTRATED` | Queue + processor path, but no control/review/router/engine. | `app/api/agents/tasks/route.ts:54-63`; `src/server/jobs/background-jobs.ts:168-197` |
| Source refresh path | `PARTIAL_UNORCHESTRATED` | Queue-managed network mutation path; not governed by runtime control. | `app/api/sources/refresh/route.ts:13-31`; `src/server/services/source-service.ts:83-146`; `src/server/jobs/background-jobs.ts:131-166` |
| Research briefs CRUD path | `BYPASS` | Direct Prisma-backed CRUD path; one sub-branch routes to the research action service, which is also bypass. | `app/api/research/briefs/route.ts:56-133`; `src/server/services/research-service.ts:72-143` |
| Research reports CRUD path | `BYPASS` | Direct Prisma-backed CRUD path with no governed runtime layers. | `app/api/research/reports/route.ts:51-113`; `src/server/services/research-service.ts:145-224` |
| Scheduled summary generation path | `BYPASS` | Directly performs summary/report generation without queue governance or runtime control. | `app/api/research/summaries/run-due/route.ts:29-89`; `src/server/services/summary-service.ts:39-192` |
| Admin privileged mutation path | `BYPASS` | Privileged mutations are direct service calls with no governed runtime wrapper. | `app/api/admin/access/route.ts:132-191`; `src/server/services/admin-service.ts:93-258` |
| Legacy console compatibility path | `PARTIAL_GOVERNED` | It enters `reviewControlRequest()`, but then branches into legacy direct handlers instead of planner/router/engine. | `services/legacyConsoleHandler.js:635-713`; `services/legacyConsoleRequestHandlers.js:78-249` |
| External worker processor path | `PARTIAL_UNORCHESTRATED` | Real execution infrastructure exists, but processors invoke services directly. | `scripts/job-worker.ts:10-39`; `src/server/jobs/background-jobs.ts:60-199`; `services/jobQueue.js:559-565` |
| Digest scheduler autonomous path | `PARTIAL_UNORCHESTRATED` | Autonomous initiator that queues work without control/review. Processor registration is only partially verified. | `services/digestScheduler.js:20-45`, `70-84`; `services/legacyConsoleOperationsSupport.js:98-151`; `services/legacyConsoleHandler.js:497-509` |
| Watcher autonomous path | `PARTIAL_UNORCHESTRATED` | Autonomous rule engine starts schedules directly, without governed runtime layers. | `services/watcher.js:147-235`, `238-321` |
| Scheduler autonomous path | `PARTIAL_UNORCHESTRATED` | Autonomous schedule ticks call agent runtime directly, without governed runtime layers. | `services/scheduler.js:204-409` |
| Health / readiness path | `EXCEPTION` | Operational health/readiness probes are intentionally outside the governed runtime and are low-risk. | `app/api/health/route.ts:1-48`; `app/api/ready/route.ts:1-46` |
| Auth/session path | `EXCEPTION` | Auth bootstrap/session endpoints are intentionally outside the action runtime. | `app/api/auth/login/route.ts:1-31`; `app/api/auth/logout/route.ts:1-10`; `app/api/auth/signup/route.ts:1-51`; `app/api/auth/session/route.ts:1-10` |

## STEP 4 — BYPASS REGISTER

| Path Name | Location | What It Bypasses | Risk Level | Frequency | Why It Exists | Recommendation | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Operations action path | `app/api/operations/actions/route.ts` -> `src/server/services/operations-action-service.ts` | Control, planner, review/intervention, router, engine | High | High | Product operations UI needed direct mutations quickly. | High-priority unification candidate. Wrap this service family behind control/review before state mutation. | `app/api/operations/actions/route.ts:6-16`; `src/server/services/operations-action-service.ts` |
| Research action path | `app/api/research/actions/route.ts` -> `src/server/services/research-action-service.ts` | Control, planner, review/intervention, router, engine | Medium | Medium | Research desk action APIs were added as typed services rather than runtime-governed execution. | Unify after operations path; schema is already structured, which helps. | `app/api/research/actions/route.ts:6-16`; `src/server/services/research-action-service.ts:74-224` |
| Admin privileged mutation path | `app/api/admin/access/route.ts` | Control, planner, review/intervention, router, engine | High | Medium | Admin panel uses direct service mutations. | Add governed mutation review for policy/governance changes before broad rollout. | `app/api/admin/access/route.ts:132-191`; `src/server/services/admin-service.ts:93-258` |
| Scheduled summary generation path | `app/api/research/summaries/run-due/route.ts` | Control, planner, review/intervention, queue governance, router, engine | Medium | Medium | Convenience endpoint directly runs due schedules. | Move toward queued, reviewed execution or explicitly carve out as constrained scheduler logic. | `app/api/research/summaries/run-due/route.ts:29-89`; `src/server/services/summary-service.ts:39-192` |
| Source refresh path | `app/api/sources/refresh/route.ts` -> worker processor | Control, review/intervention, router, engine | High | Medium | Uses background jobs for connector refresh, but no runtime governance. | High-priority queue-path unification candidate because it performs network mutation. | `app/api/sources/refresh/route.ts:13-31`; `src/server/jobs/background-jobs.ts:131-166` |
| External worker processor path | `scripts/job-worker.ts` -> `src/server/jobs/background-jobs.ts` | Control, planner, review/intervention, router, engine | High | Medium | Queue infrastructure executes background mutations directly. | Introduce reviewed job contracts before processor execution. | `scripts/job-worker.ts:10-39`; `src/server/jobs/background-jobs.ts:60-199` |
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

1. Operations action path  
   High mutation scope, user-facing, no control/review.
2. External worker processor path  
   Autonomous execution of queued work with direct service calls.
3. Watcher -> scheduler -> agent tick path  
   Multi-step autonomous coordination with process-wide effects.
4. Source refresh path  
   Network mutation through queued worker path without runtime governance.
5. Admin privileged mutation path  
   Broad authority with direct service mutation path.

### Top 5 Highest-Frequency Risky Paths

1. Console stream digest sweep path  
   High-frequency SSE loop; side-effecting queue request on a timer.
2. Console interactive path  
   Main user-facing action path; partially governed but still hybrid.
3. Operations action path  
   Directly wired into terminal and operations UI flows.
4. Jobs queue management path  
   Central control-center and platform UI integration.
5. Dashboard action path  
   User-facing dashboard mutation path.

### Top 5 Easiest Migration Candidates

1. Research action path  
   Structured discriminated action schema already exists.
2. Dashboard action path  
   Small action surface and limited action classes.
3. Source refresh path  
   Single queued mutation type with clear contract.
4. Jobs queue management path  
   Shared queue boundary already exists and can host reviewed job contracts.
5. Legacy console compatibility path  
   Similar request vocabulary to the console path, but still exits through legacy direct handlers.

### Most Inconsistent Runtime Behaviors

- The repo contains a full target-style helper (`executeControlledPlan()`), but no confirmed external caller.
- `POST /api/console` enters control/review, while most other mutation APIs do not.
- Background jobs have typed processors in `src/server/jobs/background-jobs.ts`, but legacy job processors (`plugin:run`, `digest:run-due`, `watcher:run`, `alerts:run`, `brief:route`, `report:*`) live in `services/legacyConsoleHandler.js:467-509`.
- Queue enqueue sites for legacy-style jobs do not directly call `ensureJobProcessorsRegistered()`, so downstream execution is partially verified rather than explicit.
- Some read endpoints (`GET /api/console`, `GET /api/console/stream`, `GET /api/control-center/overview`) trigger scheduler setup or queue side effects even though they are primarily read surfaces.

## STEP 7 — MIGRATION PRIORITIES

| Path Name | Current Classification | Priority (high/medium/low/exception) | Reason | Complexity | Evidence |
| --- | --- | --- | --- | --- | --- |
| Console interactive path | `PARTIAL_GOVERNED` | medium | Major migration work is complete, but residual fallback behavior still deserves cleanup. | Medium | `src/server/services/console-runtime.ts`; `services/runtimeControl.js`; `services/executionEngine.js`; `services/toolRouter.js` |
| Operations action path | `BYPASS` | high | High-risk mutations on a high-frequency path. | Medium | `app/api/operations/actions/route.ts:6-16`; `src/server/services/operations-action-service.ts` |
| Research action path | `BYPASS` | high | Structured action schema makes it a practical next migration step. | Medium | `src/server/services/research-action-service.ts:74-224` |
| Jobs queue management path | `PARTIAL_UNORCHESTRATED` | high | Shared queue boundary affects many downstream processors. | High | `app/api/jobs/route.ts:68-125`; `src/server/jobs/background-jobs.ts:60-279` |
| External worker processor path | `PARTIAL_UNORCHESTRATED` | high | High-risk autonomous execution path. | High | `scripts/job-worker.ts:10-39`; `src/server/jobs/background-jobs.ts:60-199` |
| Source refresh path | `PARTIAL_UNORCHESTRATED` | high | Network mutation and background execution. | Medium | `src/server/services/source-service.ts:83-146`; `src/server/jobs/background-jobs.ts:131-166` |
| Admin privileged mutation path | `BYPASS` | high | Broad authority and policy mutation. | Medium | `app/api/admin/access/route.ts:132-191` |
| Dashboard action path | `BYPASS` | medium | Smaller surface, meaningful value, easier cleanup. | Low | `src/server/services/dashboard-action-service.ts:29-128` |
| Research briefs CRUD path | `BYPASS` | medium | Moderate mutation scope, but straightforward service surface. | Medium | `app/api/research/briefs/route.ts:56-133` |
| Research reports CRUD path | `BYPASS` | medium | Similar to briefs CRUD; direct service path. | Medium | `app/api/research/reports/route.ts:51-113` |
| Scheduled summary generation path | `BYPASS` | medium | Mixed generation path with direct execution; should eventually align with queued/reviewed path. | Medium | `app/api/research/summaries/run-due/route.ts:29-89` |
| Console stream digest sweep path | `PARTIAL_UNORCHESTRATED` | medium | High-frequency but narrower blast radius than operations/admin. | Medium | `app/api/console/stream/route.ts:31-76` |
| Watcher autonomous path | `PARTIAL_UNORCHESTRATED` | medium | High-risk, but deeper legacy rewiring required. | High | `services/watcher.js:147-321` |
| Scheduler autonomous path | `PARTIAL_UNORCHESTRATED` | medium | Deep legacy agent runtime coupling. | High | `services/scheduler.js:204-409` |
| Console overview read path | `EXCEPTION` | exception | Primarily read-only; can remain outside main action runtime if side effects are separated. | Low | `app/api/console/route.ts:12-24` |
| Health / readiness path | `EXCEPTION` | exception | Operational probes should stay outside action runtime. | Low | `app/api/health/route.ts:1-48`; `app/api/ready/route.ts:1-46` |
| Auth/session path | `EXCEPTION` | exception | Auth bootstrap belongs outside governed action runtime. | Low | `app/api/auth/login/route.ts:1-31`; `app/api/auth/signup/route.ts:1-51` |

## STEP 8 — SUMMARY

The runtime is healthiest where it already has an explicit gateway: the console action path and the internal `executeControlledPlan()` helper. The problem is that these two do not currently meet in the middle. The console path reaches control/review but usually exits into direct service handlers, while the only confirmed full control-to-engine path has no confirmed external caller.

The runtime is most fragmented in three places:

1. Typed mutation APIs (`operations`, `research`, `dashboard`, `admin`) that bypass the governed runtime entirely.
2. Queue/worker execution paths that have solid processor infrastructure but no control/review boundary.
3. Legacy autonomous loops (`digest scheduler`, `watcher`, `scheduler`) that can start meaningful work without the modern control stack.

The best first unification target is the console interactive path because it already passes through control and review. After that, the strongest migration candidates are the structured action APIs (`operations`, `research`, `dashboard`) and the queue boundary in `background-jobs.ts`.

Paths that can remain exception-only are operational health/readiness probes and auth/session bootstrap endpoints. They are explicit, low-risk, and operationally necessary outside the action runtime.

Remaining uncertainty:

- `executeControlledPlan()` is fully wired but has no confirmed entrypoint in the audited codebase.
- Legacy job processor execution for `plugin:run`, `digest:run-due`, and related legacy job types is only partially verified because processor registration lives in `services/legacyConsoleHandler.js:467-509`, while enqueue sites do not directly invoke `ensureJobProcessorsRegistered()`.
- Some low-risk read APIs were grouped rather than traced one-by-one when they followed the same `auth + service read` shape and did not initiate meaningful execution.
