import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/server/services/policy-governance-service", () => ({
  getPolicyGovernanceSnapshot: vi.fn(),
  updateGovernanceSettings: vi.fn(),
}));

vi.mock("@/src/server/services/control-center-service", () => ({
  buildControlCenterOverview: vi.fn(),
}));

vi.mock("@/src/server/services/operations-action-service", () => ({
  executeOperationsAction: vi.fn(),
}));

vi.mock("@/src/server/services/terminal-collaboration-service", () => ({
  executeTerminalCollaborationAction: vi.fn(),
}));

vi.mock("@/src/server/services/terminal-digest-service", () => ({
  createTerminalDigest: vi.fn(),
}));

vi.mock("@/src/server/services/terminal-governance-compat-service", () => ({
  canHandleTerminalGovernanceCompatAction: vi.fn(),
  executeTerminalGovernanceCompatAction: vi.fn(),
}));

vi.mock("@/src/server/services/terminal-command-service", () => ({
  canHandleTerminalCommand: vi.fn(),
  executeTerminalCommand: vi.fn(),
}));

vi.mock("../../services/operatorRecovery.js", () => ({
  getOperatorRecoverySurface: vi.fn((planId: string) => ({
    ok: true,
    data: {
      planId,
      status: "paused",
      whyPaused: "operator_recovery_required",
      safeActions: [{ action: "approve_resume", requiresReason: false }],
      recommendedAction: { action: "approve_resume", requiresReason: false },
    },
  })),
  previewOperatorRecoveryAction: vi.fn((planId: string, action: string, payload: Record<string, unknown>) => ({
    ok: true,
    data: {
      planId,
      action,
      payload,
      preview: { willWrite: false },
    },
  })),
  applyOperatorRecoveryAction: vi.fn(async (planId: string, action: string, payload: Record<string, unknown>) => ({
    ok: true,
    data: {
      planId,
      action,
      payload,
    },
  })),
}));

vi.mock("@/src/server/services/terminal-overview-service", () => ({
  buildTerminalOverviewSnapshot: vi.fn(() => ({
    system: {
      agentCount: 3,
      totalTasks: 9,
      queuedTasks: 4,
      claimedTasks: 2,
      completedTasks: 3,
      activeSchedules: 2,
      watcherEnabled: true,
    },
    health: {
      overall: "stable",
      queuePressure: "moderate",
      reviewPressure: "low",
      watcherStatus: "running",
    },
    queue: [{ id: "task_1", agentName: "researcher", status: "queued", description: "Follow up", createdAt: "2026-04-05T01:00:00.000Z" }],
    reviews: [],
    schedules: [],
    watcher: { enabled: true, intervalSeconds: 4, lastRunAt: null, lastError: null, ruleCount: 0, rules: [] },
    alerts: { activeCount: 1, items: [], all: [] },
    plugins: [],
    workload: [],
    agentDetails: [],
    trust: { lastWatcherRunAt: null, lastWatcherError: null, pendingReviews: 0, activeAlerts: 1, schedulesWithErrors: 0 },
    recommendations: [{ id: "alerts", title: "Triage active research signals", command: "alerts:active", tone: "critical" }],
    ownershipSignals: [{ id: "ownership:orphaned", title: "1 workspace item is unassigned", detail: "1 brief does not have an owner.", tone: "warning", command: "ownership:signals" }],
    activity: [{ timestamp: "2026-04-05T01:00:00.000Z", event: "system_activity", message: "Activity recorded." }],
    automation: {
      alertThresholds: { queuedTasksHigh: 6, pendingReviewsHigh: 4, inactiveAgentsHigh: 2 },
      policy: {
        escalation: {
          autoRunWatcherOnPolicySave: false,
          autoRunAlertsOnPolicySave: false,
          autoAcknowledgeWatcherStopped: false,
          preferredAlertOwner: "manager",
        },
        remediation: {
          allowScheduleRestartRecommendations: true,
          allowAlertResolutionRecommendations: true,
          allowReviewFollowupRecommendations: true,
        },
      },
    },
    telemetry: { totals: { events: 0, errors: 0, approvals: 0, avgCommandLatencyMs: 0, avgWatcherLatencyMs: 0, avgSchedulerLatencyMs: 0 }, recent: [], byType: [] },
    jobs: { total: 0, queued: 0, running: 0, failed: 0, metrics: { avgQueueWaitMs: 0, avgRunTimeMs: 0, completionRate: 0, retryPressure: 0, scheduledRetries: 0 }, items: [] },
  })),
  buildTerminalCollaborationSnapshot: vi.fn(() => ({
    currentUser: { id: "user_1", name: "Admin", email: "admin@example.com", role: "admin", workspaceId: "workspace_1" },
    sharedSessions: [{ id: "session_1", name: "Ops handoff", draftCommand: "inbox:list", sharedWith: ["team"] }],
    handoffs: [{ id: "handoff_1", title: "Escalate", assignedTo: "team", assignedByName: "Admin", note: "Review needed", status: "open" }],
    digestPreferences: { enabled: true, cadence: "daily", preferredChannel: "inbox", includeTrustReport: true, trustAudience: "self", trustEnvironment: "production", immediateOnTrustDrop: true },
    digestRuns: [{ id: "digest_1", createdAt: "2026-04-05T02:00:00.000Z", summary: "Digest summary", stats: { open: 1 }, highlights: [], report: "Trust report", reportType: "trust" }],
    digestScheduler: { enabled: true, intervalMs: 60000, lastRunAt: "2026-04-05T02:00:00.000Z", lastResult: { workspaceCount: 1, queuedJobCount: 1, queuedJobIds: ["job_1"] }, lastError: null },
    inbox: [{ id: "inbox:approval_1", type: "approval", title: "Approve resolved for Pulse Workspace", detail: "Waiting on approval.", status: "pending", read: false, acknowledged: false }],
    notificationHistory: [{ id: "inbox:approval_1", type: "approval", title: "Approve resolved for Pulse Workspace", detail: "Waiting on approval.", status: "pending", read: false, acknowledged: false }],
    notificationDigest: { open: 1, unread: 1, acknowledged: 0, ownership: 0, handoffs: 0, approvals: 1, trust: 0 },
  })),
}));

vi.mock("tsx/cjs/api", () => ({
  require: vi.fn((id: string) => {
    if (String(id).includes("research-service.ts")) {
      return {
        listBriefs: vi.fn(async () => [
          { id: "brief_1", status: "draft", title: "Track rumor velocity", question: "What shifted overnight?" },
        ]),
        createBrief: vi.fn(async (input: { title: string; question: string }) => ({
          id: "brief_2",
          status: "draft",
          title: input.title,
          question: input.question,
        })),
        listReports: vi.fn(async () => [
          { id: "report_1", status: "draft", title: "Morning memo", briefId: "brief_1" },
        ]),
      };
    }

    if (String(id).includes("research-action-service.ts")) {
      return {
        executeResearchAction: vi.fn(async (input: { action: string }) => {
          if (input.action === "brief:route") {
            return { action: input.action, output: 'Queued brief "Track rumor velocity" as task_1.' };
          }
          if (input.action === "report:create") {
            return { action: input.action, output: 'Created draft report "Morning memo".' };
          }
          if (input.action === "report:publish") {
            return { action: input.action, output: 'Published report "Morning memo".' };
          }
          return { action: input.action, output: "Unhandled research action." };
        }),
      };
    }

    throw new Error(`Unexpected tsx require path: ${id}`);
  }),
}));

(globalThis as Record<string, unknown>).__AI_COMMAND_CONSOLE_RESEARCH_BRIDGE__ = {
  loadResearchService: () => ({
    listBriefs: async () => [{ id: "brief_1", status: "draft", title: "Track rumor velocity", question: "What shifted overnight?" }],
    createBrief: async (input: { title: string; question: string }) => ({
      id: "brief_2",
      status: "draft",
      title: input.title,
      question: input.question,
    }),
    listReports: async () => [{ id: "report_1", status: "draft", title: "Morning memo", briefId: "brief_1" }],
  }),
  loadResearchActionService: () => ({
    executeResearchAction: async (input: { action: string }) => {
      if (input.action === "brief:route") {
        return { action: input.action, output: 'Queued brief "Track rumor velocity" as task_1.' };
      }
      if (input.action === "report:create") {
        return { action: input.action, output: 'Created draft report "Morning memo".' };
      }
      if (input.action === "report:publish") {
        return { action: input.action, output: 'Published report "Morning memo".' };
      }
      return { action: input.action, output: "Unhandled research action." };
    },
  }),
};

(globalThis as Record<string, unknown>).__AI_COMMAND_CONSOLE_RUNTIME_SERVICE_BRIDGE__ = {
  loadOperationsActionService: () => ({
    executeOperationsAction: async (input: { action: string }) => {
      if (input.action === "collaboration:automation-set-status") {
        return { action: input.action, output: "Updated incident status to resolved." };
      }
      return { action: input.action, output: "Operations action completed." };
    },
  }),
  loadTerminalCollaborationService: () => ({
    executeTerminalCollaborationAction: async (input: { action: string; payload?: Record<string, unknown> }) => {
      if (input.action === "collaboration:create-handoff") {
        const title = String(input.payload?.title || "Escalate");
        return { action: input.action, output: `Created handoff "${title}".` };
      }
      return { action: input.action, output: "Collaboration action completed." };
    },
  }),
  loadTerminalGovernanceCompatService: () => ({
    executeTerminalGovernanceCompatAction: async (input: { action: string; payload?: Record<string, unknown> }) => {
      if (input.action === "collaboration:acknowledge-trust-alert") {
        return { ok: true, output: `Acknowledged trust alert ${String(input.payload?.alertId || "trust_1")}.` };
      }
      return { ok: true, output: "Governance compat action completed." };
    },
  }),
  loadTerminalDigestService: () => ({
    createTerminalDigest: (actor: { id?: string }) => ({
      id: "digest_1",
      actorId: actor.id || "user_1",
    }),
  }),
  loadPolicyGovernanceService: () => ({
    getPolicyGovernanceSnapshot: async () => ({
      currentEnvironment: "production",
      sensitiveActionsRequireApproval: false,
      environmentPolicies: { production: { minimumRoleForGovernance: "admin" } },
      workspacePolicyOverrides: {},
      workspacePolicyPlaybooks: [],
      workspacePolicyPlaybookRollouts: [],
      defaultPolicyPlaybookPresets: [],
      demoScenario: null,
    }),
    updateGovernanceSettings: async () => ({}),
  }),
};

vi.mock("node:module", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:module")>();
  return {
    ...actual,
    default: actual,
    createRequire: (...args: Parameters<typeof actual.createRequire>) => {
      const realRequire = actual.createRequire(...args);
      return (path: string) => {
      if (path.includes("legacyConsoleCompat")) {
        return {
          queueLegacyDueDigestSweepIfNeeded: vi.fn(),
          formatLegacyConsoleHelp: vi.fn(() => "Available Commands\n------------------\nhelp"),
        };
      }

      if (path.includes("permissions")) {
        return {
          canApproveInEnvironment: vi.fn(() => true),
          canManageGovernanceInEnvironment: vi.fn((role: string) => role === "admin"),
          getEnvironmentPolicy: vi.fn(() => ({
            minimumRoleForCommands: "operator",
            minimumRoleForApprovals: "approver",
            minimumRoleForGovernance: "admin",
          })),
        };
      }

      if (path.includes("runtimeControl")) {
        return {
          recordLearningEvent: vi.fn(),
          executeControlledPlan: vi.fn(async (input: string, options?: { modes?: { confirmed?: boolean } }) => {
            const normalized = String(input || "").trim();
            const pluginListing = normalized === "plugins";
            const pluginRun = normalized.startsWith("run plugin ");
            const confirmed = Boolean(options?.modes?.confirmed);
            const action = pluginListing
              ? "list_plugins"
              : pluginRun
                ? "run_plugin"
              : normalized === "whyblocked"
                ? "whyblocked"
                : normalized.toLowerCase().startsWith("diagnose")
                  ? normalized.toLowerCase() === "diagnose"
                    ? "diagnose_environment"
                    : "diagnose_path"
                  : normalized.toLowerCase().startsWith("read ")
                    ? "read_file"
                    : normalized.toLowerCase().startsWith("summarize ")
                      ? "summarize_text"
                      : "list_files";
            const output = pluginListing
              ? "=== Plugins ===\n- samplePlugin | loaded=true | Example plugin"
              : pluginRun
                ? "Plugin helloPlugin completed."
              : action === "diagnose_environment"
                ? "=== Diagnostics ===\nEnvironment healthy"
                : action === "diagnose_path"
                  ? "=== Diagnostics ===\nPath checked"
                  : action === "read_file"
                    ? "file contents"
                    : action === "summarize_text"
                      ? "summary output"
                      : "file_a\nfile_b";

            if (pluginRun && !confirmed) {
              return {
                ok: false,
                review: {
                  reviewMode: "deep",
                  reviewModeReason: "Elevated risk score requires deep review before operator approval.",
                  recommendation: {
                    title: "Use a deliberate review pass before execution.",
                    detail: "This path still requires explicit confirmation before any execution should proceed.",
                  },
                  attentionPoints: [{ title: "Plugin execution needs review.", priority: "high" }],
                  summary: { headline: "DEEP review", bullets: ["Plugin execution needs review."] },
                },
                plan: {
                  type: "single",
                  action: "run_plugin",
                  payload: "helloPlugin",
                  reviewStatus: "approved",
                  currentStageExecutable: true,
                  finalMode: "confirm_required",
                  originalRequest: input,
                },
                control: {
                  context: {
                    safeMode: false,
                    dryRun: false,
                    identity: { sourceIdentity: "human", role: "admin", maxExecutionMode: "auto_execute" },
                  },
                  decision: {
                    reason: "control_review_required",
                    explanation: "Control review requires confirmation before execution.",
                    riskScore: 65,
                    decision: "confirm_required",
                  },
                },
              };
            }

            return {
              ok: true,
              review: {
                reviewMode: "minimal",
                reviewModeReason: "Risk and uncertainty are low enough for a compressed operator review.",
                recommendation: {
                  title: "A compact review pass is sufficient.",
                  detail: "No strong blockers, novelty spikes, or advisory pattern pressures are present in the available evidence.",
                },
                attentionPoints: [],
                summary: { headline: "MINIMAL review", bullets: ["Compact review is sufficient."] },
              },
              plan: {
                type: "single",
                action,
                payload: pluginRun ? "helloPlugin" : ".",
                reviewStatus: "approved",
                currentStageExecutable: true,
                finalMode: "auto_execute",
                originalRequest: input,
              },
              result: output,
              control: {
                context: {
                  safeMode: false,
                  dryRun: false,
                  identity: { sourceIdentity: "human", role: "admin", maxExecutionMode: "auto_execute" },
                },
                decision: {
                  reason: "low_risk_auto_execute",
                  explanation: "Policy allows low-risk execution without additional confirmation.",
                  riskScore: 10,
                  decision: "auto_execute",
                },
              },
            };
          }),
          executeControlledStructuredPlan: vi.fn(
            async (
              plan: { action: string; payload?: string },
              options?: { modes?: { confirmed?: boolean }; actor?: { role?: string } },
            ) => {
            const action = String(plan?.action || "");
            const confirmed = Boolean(options?.modes?.confirmed);
            const actorRole = String(options?.actor?.role || "admin");
            if (
              actorRole === "viewer" &&
              (action.startsWith("collaboration:") || action.startsWith("approval:"))
            ) {
              return {
                ok: false,
                review: {
                  reviewMode: "standard",
                  reviewModeReason: "Recent advisory review patterns warrant standard operator attention.",
                  recommendation: {
                    title: "Use a deliberate review pass before execution.",
                    detail: "Viewer role ceilings keep this path in simulation.",
                  },
                  attentionPoints: [{ title: "Viewer role ceiling applied.", priority: "medium" }],
                  summary: { headline: "STANDARD review", bullets: ["Viewer role ceiling applied."] },
                },
                plan: {
                  type: "single",
                  action,
                  payload: plan?.payload || ".",
                  reviewStatus: "downgraded",
                  currentStageExecutable: true,
                  finalMode: "simulate",
                  originalRequest: action,
                },
                control: {
                  context: {
                    safeMode: false,
                    dryRun: false,
                    identity: { sourceIdentity: "human", role: "viewer", maxExecutionMode: "simulate" },
                  },
                  decision: {
                    reason: "role_ceiling_applied",
                    explanation: "Control review requires confirmation before execution.",
                    riskScore: 45,
                    decision: "simulate",
                  },
                },
              };
            }
            if (
              [
                "agent_start",
                "agent_tick",
                "agent_stop",
                "manager_route",
                "review_create",
                "brief_create",
                "brief_route",
                "report_create",
                "report_publish",
                "workflow:create-task",
                "workflow:route-task",
                "job:cancel",
                "job:retry",
                "watcher:start",
                "watcher:stop",
                "watcher:rule-upsert",
                "watcher:rule-delete",
                "policy:update-thresholds",
                "policy:update-automation",
                "agent:update-config",
                "review:approve",
                "review:create",
                "review:revise",
                "review:followup",
                "collaboration:update-governance",
                "collaboration:apply-approval-policy-recommendation",
                "collaboration:promote-approval-policy-recommendation",
                "collaboration:acknowledge-trust-alert",
                "collaboration:restart-approval-recommendation-observation",
                "collaboration:extend-approval-recommendation-cooldown",
                "alert:acknowledge",
                "alert:resolve",
                "alert:note",
                "alert:run-checks",
              ].includes(action) &&
              !confirmed
            ) {
              return {
                ok: false,
                review: {
                  reviewMode: "deep",
                  reviewModeReason: "Elevated risk score requires deep review before operator approval.",
                  recommendation: {
                    title: "Use a deliberate review pass before execution.",
                    detail: "This path still requires explicit confirmation before any execution should proceed.",
                  },
                  attentionPoints: [{ title: "Confirmation gate active.", priority: "high" }],
                  summary: { headline: "DEEP review", bullets: ["Confirmation gate active."] },
                },
                plan: {
                  type: "single",
                  action,
                  payload: plan?.payload || ".",
                  reviewStatus: "downgraded",
                  currentStageExecutable: true,
                  finalMode: "confirm_required",
                  originalRequest: action,
                },
                control: {
                  context: {
                    safeMode: false,
                    dryRun: false,
                    identity: { sourceIdentity: "human", role: "admin", maxExecutionMode: "auto_execute" },
                  },
                  decision: {
                    reason: "control_review_required",
                    explanation: "Control review requires confirmation before execution.",
                    riskScore: 45,
                    decision: "confirm_required",
                  },
                },
              };
            }

            const output =
              action === "agents_list"
                ? "Agent Profiles\n- planner • strategist\n  Plans safely."
                : action === "agent_status"
                  ? "Agent Status: planner\n{\"status\":\"idle\"}"
              : action === "dashboard_agent"
                ? "Agent Dashboard: planner\n{\"queuedTasks\":1}"
              : action === "brief_list"
                ? "Research Briefs\n- brief_1 • draft • Track rumor velocity\n  What shifted overnight?"
              : action === "report_list"
                ? "Reports\n- report_1 • draft • Morning memo\n  Brief: brief_1"
              : action === "dashboard_system"
                ? "System Summary\n{\"agentCount\":3}"
                : action === "dashboard_health"
                  ? "Health Summary\n{\"overall\":\"stable\"}"
                  : action === "dashboard_workload"
                    ? "Workload Summary\n{\"agents\":[]}"
                    : action === "queue_list"
                      ? "Tasks\n- task_1 • researcher • queued • p3\n  Follow up"
                      : action === "queue_next"
                        ? "Tasks\n- task_1 • researcher • queued • p3\n  Follow up"
                        : action === "alerts_list"
                        ? "Alerts\nNo alerts found."
                        : action === "digest_health"
                          ? "Digest Automation Health\n{\"activeAlertCount\":0}"
                        : action === "ownership_signals"
                          ? "Ownership signals\n- 1 workspace item is unassigned\n  1 brief does not have an owner.\n  Action: ownership:signals"
                        : action === "review_list"
                          ? "Review Queue\n{\"items\":[]}"
                        : action === "schedule_list"
                          ? "Schedule: planner\n{\"enabled\":true}"
                        : action === "schedule_status"
                          ? "Schedule: planner\n{\"enabled\":true}"
                        : action === "watcher_status"
                          ? "Watcher\n{\"enabled\":true}"
                        : action === "schedule_run"
                          ? "Schedule for \"planner\" reached max cycles and stopped safely.\n\nSchedule: planner\n{\"enabled\":false}"
                        : action === "watcher_run"
                          ? "Queued watcher run as job_watcher_1."
                        : action === "alerts_run"
                          ? "Queued alert sweep as job_alerts_1."
                        : action === "agent_start"
                          ? 'Agent "planner" started.\n\nAgent Status: planner\n{"status":"running"}'
                        : action === "agent_tick"
                          ? 'Agent "planner" executed a bounded step.\nStep: Analyze goal: Review next assignment\nRead-only inspection completed.'
                        : action === "agent_stop"
                          ? 'Agent "planner" stopped.\n\nAgent Status: planner\n{"status":"stopped"}'
                        : action === "manager_route"
                          ? "Routed to planner.\n\nReason: Brief emphasizes framing, scope control, or sequencing work.\n\nTasks\n- task_1 • planner • queued • p1\n  Review backlog"
                        : action === "review_create"
                          ? 'Review item created for task "task_1".'
                        : action === "brief_create"
                          ? "Research Briefs\n- brief_2 • draft • New brief\n  What shifted overnight?"
                        : action === "brief_route"
                          ? 'Queued brief "Track rumor velocity" as task_1.'
                        : action === "report_create"
                          ? 'Created draft report "Morning memo".'
                        : action === "report_publish"
                          ? 'Published report "Morning memo".'
                        : action === "collaboration:automation-set-status"
                          ? "Updated incident status to resolved."
                        : action === "collaboration:create-handoff"
                          ? 'Created handoff "Escalate".'
                        : action === "collaboration:update-governance"
                          ? "Updated collaboration governance."
                        : action === "collaboration:acknowledge-trust-alert"
                          ? "Acknowledged trust alert trust_1."
                        : action === "collaboration:digest-generate"
                          ? "Generated digest digest_1."
                        : action === "collaboration:digest-run-due"
                          ? "Queued digest sweep as job_digest_1."
                        : action === "workflow:create-task"
                          ? "Created task task_1 for researcher."
                        : action === "workflow:route-task"
                          ? "Routed to planner.\n\nReason: Brief emphasizes framing, scope control, or sequencing work.\n\nTask task_1"
                        : action === "job:cancel"
                          ? "Canceled job job_1."
                        : action === "job:retry"
                          ? "Retried job job_1."
                        : action === "job:detail"
                          ? "Loaded job job_2."
                        : action === "watcher:start"
                          ? "Watcher started at 5s interval."
                        : action === "watcher:stop"
                          ? "Watcher stopped."
                        : action === "watcher:rule-upsert"
                          ? "Saved watcher rule cpu_spike."
                        : action === "watcher:rule-delete"
                          ? "Removed watcher rule cpu_spike."
                        : action === "policy:update-thresholds"
                          ? "Updated alert thresholds."
                        : action === "policy:update-automation"
                          ? "Updated automation policy."
                        : action === "agent:update-config"
                          ? "Updated profile for planner."
                        : action === "review:approve"
                          ? 'Approved review item for task "task_1".'
                        : action === "review:create"
                          ? 'Review item created for task "task_1".'
                        : action === "review:revise"
                          ? 'Marked review item for task "task_1" as needs_revision.'
                        : action === "review:followup"
                          ? 'Created follow-up task task_2 for researcher.'
                        : action === "alert:acknowledge"
                          ? 'Alert "alert_1" acknowledged.'
                        : action === "alert:resolve"
                          ? 'Alert "alert_1" resolved.'
                        : action === "alert:note"
                          ? 'Note added to alert "alert_1".'
                        : action === "alert:run-checks"
                          ? "Alert checks completed."
                          : "Active Alerts\nNo alerts found.";

              return {
                ok: true,
                plan: {
                  type: "single",
                  action,
                  payload: plan?.payload || ".",
                  reviewStatus: "approved",
                  currentStageExecutable: true,
                  finalMode: "auto_execute",
                  originalRequest: action,
                },
                result: output,
                control: {
                  context: {
                    safeMode: false,
                    dryRun: false,
                    identity: { sourceIdentity: "human", role: "admin", maxExecutionMode: "auto_execute" },
                  },
                  decision: {
                    reason: confirmed ? "confirmed_execution" : "low_risk_auto_execute",
                    explanation: confirmed
                      ? "User confirmation allows the reviewed plan to execute."
                      : "Policy allows low-risk execution without additional confirmation.",
                    riskScore: ["agent_start", "agent_tick", "agent_stop", "manager_route", "review_create"].includes(action) ? 45 : 10,
                    decision: "auto_execute",
                  },
                },
              };
            },
          ),
          reviewRequest: vi.fn(async (input: { command?: string; action?: string; payload?: Record<string, unknown> }) => {
            const command = String(input?.command || "").trim();
            const action = String(input?.action || "").trim();

            if (command.startsWith("run plugin ")) {
              return {
                context: {
                  safeMode: false,
                  dryRun: false,
                  identity: { sourceIdentity: "human", role: "admin", maxExecutionMode: "auto_execute" },
                },
                plan: { type: "single", action: "__terminal_command__", payload: command, command },
                decision: {
                  reason: "control_review_required",
                  explanation: "Control review requires confirmation before execution.",
                  riskScore: 65,
                  decision: "confirm_required",
                },
              };
            }

            if (action === "collaboration:automation-set-status") {
              return {
                context: {
                  safeMode: false,
                  dryRun: false,
                  identity: { sourceIdentity: "human", role: "admin", maxExecutionMode: "auto_execute" },
                },
                plan: {
                  type: "single",
                  action,
                  payload: {
                    workspaceId: "workspace_1",
                    incidentStatus: "resolved",
                    reviewed: true,
                  },
                  reviewStatus: "approved",
                  currentStageExecutable: true,
                  finalMode: "auto_execute",
                },
                decision: {
                  reason: "low_risk_auto_execute",
                  explanation: "Policy allows low-risk execution without additional confirmation.",
                  riskScore: 25,
                  decision: "auto_execute",
                },
              };
            }

            if (action === "collaboration:create-handoff" && command === "") {
              return {
                context: {
                  safeMode: false,
                  dryRun: false,
                  identity: { sourceIdentity: "human", role: "admin", maxExecutionMode: "auto_execute" },
                },
                plan: {
                  type: "single",
                  action,
                  payload: input?.payload || {},
                  reviewStatus: "pending",
                  currentStageExecutable: true,
                  finalMode: "auto_execute",
                },
                decision: {
                  reason: "low_risk_auto_execute",
                  explanation: "Policy allows low-risk execution without additional confirmation.",
                  riskScore: 25,
                  decision: "auto_execute",
                },
              };
            }

            return {
              context: {
                safeMode: false,
                dryRun: false,
                identity: { sourceIdentity: "human", role: "admin", maxExecutionMode: "auto_execute" },
              },
              plan: { type: "single", action: "__terminal_command__", payload: command || "agents:list", command: command || "agents:list" },
              decision: {
                reason: "low_risk_auto_execute",
                explanation: "Policy allows low-risk execution without additional confirmation.",
                riskScore: 10,
                decision: "auto_execute",
              },
            };
          }),
        };
      }

        return realRequire(path);
      };
    },
  };
});

import { getPolicyGovernanceSnapshot, updateGovernanceSettings } from "@/src/server/services/policy-governance-service";
import { buildControlCenterOverview } from "@/src/server/services/control-center-service";
import { executeOperationsAction } from "@/src/server/services/operations-action-service";
import { executeTerminalCollaborationAction } from "@/src/server/services/terminal-collaboration-service";
import { createTerminalDigest } from "@/src/server/services/terminal-digest-service";
import {
  canHandleTerminalGovernanceCompatAction,
  executeTerminalGovernanceCompatAction,
} from "@/src/server/services/terminal-governance-compat-service";
import { canHandleTerminalCommand, executeTerminalCommand } from "@/src/server/services/terminal-command-service";
let applyTerminalOperatorRecoveryAction: typeof import("@/src/server/services/console-runtime").applyTerminalOperatorRecoveryAction;
let executeTerminalRequest: typeof import("@/src/server/services/console-runtime").executeTerminalRequest;
let getTerminalOperatorRecoverySurface: typeof import("@/src/server/services/console-runtime").getTerminalOperatorRecoverySurface;
let getTerminalOverview: typeof import("@/src/server/services/console-runtime").getTerminalOverview;
let previewTerminalOperatorRecoveryAction: typeof import("@/src/server/services/console-runtime").previewTerminalOperatorRecoveryAction;

const actor = {
  id: "user_1",
  workspaceId: "workspace_1",
  email: "admin@example.com",
  name: "Admin",
  role: "admin" as const,
};

describe("console runtime", () => {
  beforeAll(async () => {
    const runtime = await import("@/src/server/services/console-runtime");
    applyTerminalOperatorRecoveryAction = runtime.applyTerminalOperatorRecoveryAction;
    executeTerminalRequest = runtime.executeTerminalRequest;
    getTerminalOperatorRecoverySurface = runtime.getTerminalOperatorRecoverySurface;
    getTerminalOverview = runtime.getTerminalOverview;
    previewTerminalOperatorRecoveryAction = runtime.previewTerminalOperatorRecoveryAction;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getPolicyGovernanceSnapshot).mockResolvedValue({
      currentEnvironment: "production",
      sensitiveActionsRequireApproval: false,
      environmentPolicies: { production: { minimumRoleForGovernance: "admin" } },
      workspacePolicyOverrides: {},
      workspacePolicyPlaybooks: [],
      workspacePolicyPlaybookRollouts: [],
      defaultPolicyPlaybookPresets: [],
      demoScenario: null,
    } as never);
    vi.mocked(buildControlCenterOverview).mockResolvedValue({
      collaboration: {
        digestWorkspaceHealth: [
          {
            workspaceId: "workspace_1",
            workspaceName: "Pulse Workspace",
            incidentApprovalHistory: [
              {
                id: "approval_1",
                label: "Approve resolved for Pulse Workspace",
                status: "pending",
                requestedByName: "Admin",
                requestedStatus: "resolved",
                approverTarget: "role:admin",
                approvedByName: null,
                rejectedByName: null,
                resolvedAt: null,
                createdAt: new Date("2026-04-05T01:00:00.000Z").toISOString(),
              },
            ],
          },
        ],
        digestEscalations: [],
        globalOperations: { totals: { openIncidents: 1, completedTrustIncidents: 0 } },
        policyPlaybookAdoption: { totalTracked: 0, presetCount: 0, savedCount: 0, items: [], recommendations: [] },
        incidentApprovalPressure: [],
        approvalThroughput: { totals: { totalApprovals: 1 }, targets: [], workspaces: [] },
        approvalPolicyRecommendations: [],
        approvalRecommendationObservations: [],
        approvalTrustDashboard: { score: 90, alerts: [] },
        approvalTrustEnvironments: [{ environment: "production", score: 90, alertCount: 1, regressedCount: 0, improvedCount: 1 }],
        approvalTrustTrends: [{ environment: "production", deltas: { day: -2, week: 3, month: 8 } }],
        approvalTrustSignals: [{ id: "trust_1", title: "Production trust dipped", detail: "One regression needs attention." }],
        approvalRecommendationFamilies: [{ label: "Policy rollout", recommendationCount: 2, promotedCount: 1, rolledBackCount: 0, trustSignalCount: 1 }],
        completedTrustIncidents: [{ workspaceId: "workspace_1", workspaceName: "Pulse Workspace", environment: "production", archivedAt: "2026-04-05T01:00:00.000Z", summary: "Recovered" }],
        completedTrustEnvironments: [{ environment: "production", archivedCount: 1, latestArchivedAt: "2026-04-05T01:00:00.000Z", recentWorkspaces: ["Pulse Workspace"] }],
        environmentTrustRecaps: [{ environment: "production", score: 90, activeSignals: 1, completedArchived: 1, latestArchivedAt: "2026-04-05T01:00:00.000Z" }],
        automationFollowups: [],
        appliedApprovalPolicies: [],
        notificationDigest: { open: 1, unread: 1, acknowledged: 0, ownership: 0, handoffs: 0, approvals: 1, trust: 1 },
        inbox: [{ id: "inbox:approval_1", title: "Approve resolved for Pulse Workspace", type: "approval", status: "open" }],
        digestPreferences: { includeTrustReport: true, trustEnvironment: "production" },
      },
    } as never);
    vi.mocked(executeOperationsAction).mockResolvedValue({
      action: "collaboration:automation-set-status",
      output: "Updated incident status to resolved.",
    } as never);
    vi.mocked(executeTerminalCollaborationAction).mockResolvedValue({
      action: "collaboration:create-handoff",
      output: 'Created handoff "Escalate".',
    } as never);
    vi.mocked(createTerminalDigest).mockReturnValue({
      id: "digest_1",
      summary: "Digest summary",
      stats: { open: 1 },
      highlights: [],
      report: "Trust report",
      reportType: "trust",
      createdAt: new Date("2026-04-05T02:00:00.000Z").toISOString(),
    } as never);
    vi.mocked(canHandleTerminalCommand).mockReturnValue(false);
    vi.mocked(executeTerminalCommand).mockResolvedValue("terminal command output" as never);
    vi.mocked(canHandleTerminalGovernanceCompatAction).mockImplementation(
      ((action: string) =>
        [
          "collaboration:apply-approval-policy-recommendation",
          "collaboration:promote-approval-policy-recommendation",
          "collaboration:acknowledge-trust-alert",
          "collaboration:restart-approval-recommendation-observation",
          "collaboration:extend-approval-recommendation-cooldown",
        ].includes(String(action || ""))) as never,
    );
    vi.mocked(executeTerminalGovernanceCompatAction).mockResolvedValue({
      ok: true,
      output: "compat action output",
    } as never);
  });

  it("overlays terminal governance from the Prisma-backed governance snapshot", async () => {
    const overview = await getTerminalOverview(actor);

    expect((overview as Record<string, unknown>).system).toEqual(
      expect.objectContaining({
        queuedTasks: 4,
        completedTasks: 3,
      }),
    );
    expect((overview as Record<string, unknown>).recommendations).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "alerts", command: "alerts:active" })]),
    );
    expect((overview as Record<string, unknown>).ownershipSignals).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "ownership:orphaned", command: "ownership:signals" })]),
    );
    expect(overview.collaboration).toEqual(
      expect.objectContaining({
        currentUser: expect.objectContaining({ name: "Admin", role: "admin" }),
        digestPreferences: expect.objectContaining({ enabled: true, trustEnvironment: "production" }),
        notificationDigest: expect.objectContaining({ open: 1, approvals: 1 }),
      }),
    );
    expect(overview.collaboration?.governance).toEqual(
      expect.objectContaining({
        currentEnvironment: "production",
        sensitiveActionsRequireApproval: false,
      }),
    );
    expect(overview.collaboration?.permissions).toEqual(
      expect.objectContaining({
        currentEnvironment: "production",
        canManageGovernance: true,
      }),
    );
    expect(overview.collaboration?.approvals).toEqual([
      expect.objectContaining({
        id: "approval_1",
        action: "collaboration:automation-set-status",
        requestedStatus: "resolved",
      }),
    ]);
  });

  it("admits governance updates and stops at confirmation before execution", async () => {
    const result = await executeTerminalRequest(
      {
        action: "collaboration:update-governance",
        payload: { sensitiveActionsRequireApproval: true },
      },
      actor,
    );

    expect(updateGovernanceSettings).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        requiresConfirmation: true,
        error: expect.stringContaining("confirmation"),
        control: expect.objectContaining({
          decision: expect.objectContaining({ decision: "confirm_required" }),
        }),
        plan: expect.objectContaining({
          action: "collaboration:update-governance",
        }),
      }),
    );
  });

  it("executes confirmed governance updates through the governed path", async () => {
    const result = await executeTerminalRequest(
      {
        action: "collaboration:update-governance",
        payload: { sensitiveActionsRequireApproval: true },
        confirmed: true,
      },
      actor,
    );

    expect(updateGovernanceSettings).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        control: expect.objectContaining({
          decision: expect.objectContaining({ decision: "auto_execute" }),
        }),
        plan: expect.objectContaining({
          action: "collaboration:update-governance",
          finalMode: "auto_execute",
          reviewStatus: "approved",
        }),
      }),
    );
  });

  it("routes terminal operations actions through the governed execution path", async () => {
    const result = await executeTerminalRequest(
      {
        action: "collaboration:automation-set-status",
        payload: { workspaceId: "workspace_1", incidentStatus: "archived" },
      },
      actor,
    );

    expect(executeOperationsAction).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        control: expect.objectContaining({
          decision: expect.objectContaining({ decision: "auto_execute" }),
        }),
        plan: expect.objectContaining({
          action: "collaboration:automation-set-status",
          reviewStatus: "approved",
        }),
      }),
    );
  });

  it("routes terminal collaboration actions through the governed execution path", async () => {
    const result = await executeTerminalRequest(
      {
        action: "collaboration:create-handoff",
        payload: { title: "Escalate", note: "Need operator review.", assignedTo: "team" },
      },
      actor,
    );

    expect(executeTerminalCollaborationAction).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        control: expect.objectContaining({
          decision: expect.objectContaining({ decision: "auto_execute" }),
        }),
        plan: expect.objectContaining({
          action: "collaboration:create-handoff",
          reviewStatus: "approved",
        }),
      }),
    );
  });

  it("renders inbox:list from the merged terminal overview instead of the legacy command formatter", async () => {
    const result = await executeTerminalRequest(
      {
        command: "inbox:list",
      },
      actor,
    );

    expect(result.ok).toBe(true);
    expect(result.output).toContain("Operator inbox");
    expect(result.output).toContain("Approve resolved for Pulse Workspace");
  });

  it("renders trust:report from the merged terminal overview", async () => {
    const result = await executeTerminalRequest(
      {
        command: "trust:report",
      },
      actor,
    );

    expect(result.ok).toBe(true);
    expect(result.output).toContain("Trust report");
    expect(result.output).toContain("Environment summary");
    expect(result.output).toContain("Pulse Workspace");
  });

  it("routes agent list commands through the governed execution path", async () => {
    vi.mocked(canHandleTerminalCommand).mockReturnValue(true);

    const result = await executeTerminalRequest(
      {
        command: "agents:list",
      },
      actor,
    );

    expect(executeTerminalCommand).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        control: expect.objectContaining({
          decision: expect.objectContaining({ decision: "auto_execute" }),
        }),
        plan: expect.objectContaining({
          action: "agents_list",
          reviewStatus: "approved",
        }),
      }),
    );
  });

  it("simulates collaboration actions for viewer-role actors instead of dispatching them", async () => {
    const viewer = { ...actor, role: "viewer" as const };
    const result = await executeTerminalRequest(
      {
        action: "collaboration:create-handoff",
        payload: { title: "Escalate", note: "Need operator review.", assignedTo: "team" },
      },
      viewer,
    );

    expect(executeTerminalCollaborationAction).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        control: expect.objectContaining({
          decision: expect.objectContaining({ decision: "simulate" }),
        }),
      }),
    );
  });

  it("routes plugins through the reviewed planner execution path", async () => {
    vi.mocked(canHandleTerminalCommand).mockReturnValue(true);

    const result = await executeTerminalRequest(
      {
        command: "plugins",
      },
      actor,
    );

    expect(executeTerminalCommand).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        control: expect.objectContaining({
          decision: expect.objectContaining({ decision: "auto_execute" }),
        }),
        plan: expect.objectContaining({
          action: "list_plugins",
          reviewStatus: "approved",
        }),
      }),
    );
  });

  it("routes planner-governed read-only commands through the reviewed execution path", async () => {
    vi.mocked(canHandleTerminalCommand).mockReturnValue(false);

    const result = await executeTerminalRequest(
      {
        command: "diagnose workspace/cache",
      },
      actor,
    );

    expect(executeTerminalCommand).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        control: expect.objectContaining({
          decision: expect.objectContaining({ decision: "auto_execute" }),
        }),
        plan: expect.objectContaining({
          action: "diagnose_path",
          reviewStatus: "approved",
        }),
      }),
    );
  });

  it("routes structured dashboard commands through the governed execution path", async () => {
    vi.mocked(canHandleTerminalCommand).mockReturnValue(true);

    const result = await executeTerminalRequest(
      {
        command: "dashboard:system",
      },
      actor,
    );

    expect(executeTerminalCommand).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        control: expect.objectContaining({
          decision: expect.objectContaining({ decision: "auto_execute" }),
        }),
        plan: expect.objectContaining({
          action: "dashboard_system",
          reviewStatus: "approved",
        }),
      }),
    );
  });

  it("routes agent dashboard commands through the governed execution path", async () => {
    vi.mocked(canHandleTerminalCommand).mockReturnValue(true);

    const result = await executeTerminalRequest(
      {
        command: "dashboard:agent planner",
      },
      actor,
    );

    expect(executeTerminalCommand).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        control: expect.objectContaining({
          decision: expect.objectContaining({ decision: "auto_execute" }),
        }),
        plan: expect.objectContaining({
          action: "dashboard_agent",
          reviewStatus: "approved",
        }),
      }),
    );
  });

  it("routes structured alert commands through the governed execution path", async () => {
    vi.mocked(canHandleTerminalCommand).mockReturnValue(true);

    const result = await executeTerminalRequest(
      {
        command: "alerts:active",
      },
      actor,
    );

    expect(executeTerminalCommand).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        control: expect.objectContaining({
          decision: expect.objectContaining({ decision: "auto_execute" }),
        }),
        plan: expect.objectContaining({
          action: "alerts_active",
          reviewStatus: "approved",
        }),
      }),
    );
  });

  it("routes digest health commands through the governed execution path", async () => {
    vi.mocked(canHandleTerminalCommand).mockReturnValue(true);

    const result = await executeTerminalRequest(
      {
        command: "digest:health",
      },
      actor,
    );

    expect(executeTerminalCommand).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        control: expect.objectContaining({
          decision: expect.objectContaining({ decision: "auto_execute" }),
        }),
        plan: expect.objectContaining({
          action: "digest_health",
          reviewStatus: "approved",
        }),
      }),
    );
  });

  it("routes ownership signal commands through the governed execution path", async () => {
    vi.mocked(canHandleTerminalCommand).mockReturnValue(true);

    const result = await executeTerminalRequest(
      {
        command: "ownership:signals",
      },
      actor,
    );

    expect(executeTerminalCommand).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        control: expect.objectContaining({
          decision: expect.objectContaining({ decision: "auto_execute" }),
        }),
        plan: expect.objectContaining({
          action: "ownership_signals",
          reviewStatus: "approved",
        }),
      }),
    );
  });

  it("routes brief list commands through the governed execution path", async () => {
    vi.mocked(canHandleTerminalCommand).mockReturnValue(true);

    const result = await executeTerminalRequest(
      {
        command: "brief:list",
      },
      actor,
    );

    expect(executeTerminalCommand).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        control: expect.objectContaining({
          decision: expect.objectContaining({ decision: "auto_execute" }),
        }),
        plan: expect.objectContaining({
          action: "brief_list",
          reviewStatus: "approved",
        }),
      }),
    );
  });

  it("routes report list commands through the governed execution path", async () => {
    vi.mocked(canHandleTerminalCommand).mockReturnValue(true);

    const result = await executeTerminalRequest(
      {
        command: "report:list",
      },
      actor,
    );

    expect(executeTerminalCommand).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        control: expect.objectContaining({
          decision: expect.objectContaining({ decision: "auto_execute" }),
        }),
        plan: expect.objectContaining({
          action: "report_list",
          reviewStatus: "approved",
        }),
      }),
    );
  });

  it("routes schedule status commands through the governed execution path", async () => {
    vi.mocked(canHandleTerminalCommand).mockReturnValue(true);

    const result = await executeTerminalRequest(
      {
        command: "schedule:status planner",
      },
      actor,
    );

    expect(executeTerminalCommand).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        control: expect.objectContaining({
          decision: expect.objectContaining({ decision: "auto_execute" }),
        }),
        plan: expect.objectContaining({
          action: "schedule_status",
          reviewStatus: "approved",
        }),
      }),
    );
  });

  it("routes watcher status commands through the governed execution path", async () => {
    vi.mocked(canHandleTerminalCommand).mockReturnValue(true);

    const result = await executeTerminalRequest(
      {
        command: "watcher:status",
      },
      actor,
    );

    expect(executeTerminalCommand).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        control: expect.objectContaining({
          decision: expect.objectContaining({ decision: "auto_execute" }),
        }),
        plan: expect.objectContaining({
          action: "watcher_status",
          reviewStatus: "approved",
        }),
      }),
    );
  });

  it("routes review list commands through the governed execution path", async () => {
    vi.mocked(canHandleTerminalCommand).mockReturnValue(true);

    const result = await executeTerminalRequest(
      {
        command: "review:list",
      },
      actor,
    );

    expect(executeTerminalCommand).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        control: expect.objectContaining({
          decision: expect.objectContaining({ decision: "auto_execute" }),
        }),
        plan: expect.objectContaining({
          action: "review_list",
          reviewStatus: "approved",
        }),
      }),
    );
  });

  it("routes schedule run commands through the governed execution path", async () => {
    vi.mocked(canHandleTerminalCommand).mockReturnValue(true);

    const result = await executeTerminalRequest(
      {
        command: "schedule:run planner",
      },
      actor,
    );

    expect(executeTerminalCommand).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        control: expect.objectContaining({
          decision: expect.objectContaining({ decision: "auto_execute" }),
        }),
        plan: expect.objectContaining({
          action: "schedule_run",
          reviewStatus: "approved",
        }),
      }),
    );
  });

  it("routes watcher run commands through the governed execution path", async () => {
    vi.mocked(canHandleTerminalCommand).mockReturnValue(true);

    const result = await executeTerminalRequest(
      {
        command: "watcher:run",
      },
      actor,
    );

    expect(executeTerminalCommand).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        control: expect.objectContaining({
          decision: expect.objectContaining({ decision: "auto_execute" }),
        }),
        plan: expect.objectContaining({
          action: "watcher_run",
          reviewStatus: "approved",
        }),
      }),
    );
  });

  it("routes alerts run commands through the governed execution path", async () => {
    vi.mocked(canHandleTerminalCommand).mockReturnValue(true);

    const result = await executeTerminalRequest(
      {
        command: "alerts:run",
      },
      actor,
    );

    expect(executeTerminalCommand).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        control: expect.objectContaining({
          decision: expect.objectContaining({ decision: "auto_execute" }),
        }),
        plan: expect.objectContaining({
          action: "alerts_run",
          reviewStatus: "approved",
        }),
      }),
    );
  });

  it("admits agent start commands and stops at confirmation before execution", async () => {
    vi.mocked(canHandleTerminalCommand).mockReturnValue(true);

    const result = await executeTerminalRequest(
      {
        command: "agent:start planner",
      },
      actor,
    );

    expect(executeTerminalCommand).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        requiresConfirmation: true,
        error: expect.stringContaining("confirmation"),
        control: expect.objectContaining({
          decision: expect.objectContaining({ decision: "confirm_required" }),
        }),
        plan: expect.objectContaining({
          action: "agent_start",
        }),
      }),
    );
  });

  it("admits manager route commands and stops at confirmation before execution", async () => {
    vi.mocked(canHandleTerminalCommand).mockReturnValue(true);

    const result = await executeTerminalRequest(
      {
        command: "manager:route Review backlog",
      },
      actor,
    );

    expect(executeTerminalCommand).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        requiresConfirmation: true,
        error: expect.stringContaining("confirmation"),
        control: expect.objectContaining({
          decision: expect.objectContaining({ decision: "confirm_required" }),
        }),
        plan: expect.objectContaining({
          action: "manager_route",
        }),
      }),
    );
  });

  it("executes confirmed manager route commands through the governed path", async () => {
    vi.mocked(canHandleTerminalCommand).mockReturnValue(true);

    const result = await executeTerminalRequest(
      {
        command: "manager:route Review backlog",
        confirmed: true,
      },
      actor,
    );

    expect(executeTerminalCommand).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        control: expect.objectContaining({
          decision: expect.objectContaining({ decision: "auto_execute" }),
        }),
        plan: expect.objectContaining({
          action: "manager_route",
          finalMode: "auto_execute",
          reviewStatus: "approved",
        }),
      }),
    );
  });

  it("admits brief create commands and stops at confirmation before execution", async () => {
    vi.mocked(canHandleTerminalCommand).mockReturnValue(true);

    const result = await executeTerminalRequest(
      {
        command: "brief:create New brief | What shifted overnight?",
      },
      actor,
    );

    expect(executeTerminalCommand).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        requiresConfirmation: true,
        error: expect.stringContaining("confirmation"),
        control: expect.objectContaining({
          decision: expect.objectContaining({ decision: "confirm_required" }),
        }),
        plan: expect.objectContaining({
          action: "brief_create",
        }),
      }),
    );
  });

  it("executes confirmed brief create commands through the governed path", async () => {
    vi.mocked(canHandleTerminalCommand).mockReturnValue(true);

    const result = await executeTerminalRequest(
      {
        command: "brief:create New brief | What shifted overnight?",
        confirmed: true,
      },
      actor,
    );

    expect(executeTerminalCommand).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        control: expect.objectContaining({
          decision: expect.objectContaining({ decision: "auto_execute" }),
        }),
        plan: expect.objectContaining({
          action: "brief_create",
          finalMode: "auto_execute",
          reviewStatus: "approved",
        }),
      }),
    );
  });

  it("admits brief route commands and stops at confirmation before execution", async () => {
    vi.mocked(canHandleTerminalCommand).mockReturnValue(true);

    const result = await executeTerminalRequest(
      {
        command: "brief:route brief_1",
      },
      actor,
    );

    expect(executeTerminalCommand).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        requiresConfirmation: true,
        error: expect.stringContaining("confirmation"),
        control: expect.objectContaining({
          decision: expect.objectContaining({ decision: "confirm_required" }),
        }),
        plan: expect.objectContaining({
          action: "brief_route",
        }),
      }),
    );
  });

  it("executes confirmed brief route commands through the governed path", async () => {
    vi.mocked(canHandleTerminalCommand).mockReturnValue(true);

    const result = await executeTerminalRequest(
      {
        command: "brief:route brief_1",
        confirmed: true,
      },
      actor,
    );

    expect(executeTerminalCommand).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        control: expect.objectContaining({
          decision: expect.objectContaining({ decision: "auto_execute" }),
        }),
        plan: expect.objectContaining({
          action: "brief_route",
          finalMode: "auto_execute",
          reviewStatus: "approved",
        }),
      }),
    );
  });

  it("executes confirmed agent start commands through the governed path", async () => {
    vi.mocked(canHandleTerminalCommand).mockReturnValue(true);

    const result = await executeTerminalRequest(
      {
        command: "agent:start planner",
        confirmed: true,
      },
      actor,
    );

    expect(executeTerminalCommand).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        control: expect.objectContaining({
          decision: expect.objectContaining({ decision: "auto_execute" }),
        }),
        plan: expect.objectContaining({
          action: "agent_start",
          finalMode: "auto_execute",
          reviewStatus: "approved",
        }),
      }),
    );
  });

  it("executes confirmed agent tick commands through the governed path", async () => {
    vi.mocked(canHandleTerminalCommand).mockReturnValue(true);

    const result = await executeTerminalRequest(
      {
        command: "agent:tick planner",
        confirmed: true,
      },
      actor,
    );

    expect(executeTerminalCommand).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        control: expect.objectContaining({
          decision: expect.objectContaining({ decision: "auto_execute" }),
        }),
        plan: expect.objectContaining({
          action: "agent_tick",
          finalMode: "auto_execute",
          reviewStatus: "approved",
        }),
      }),
    );
  });

  it("executes confirmed agent stop commands through the governed path", async () => {
    vi.mocked(canHandleTerminalCommand).mockReturnValue(true);

    const result = await executeTerminalRequest(
      {
        command: "agent:stop planner",
        confirmed: true,
      },
      actor,
    );

    expect(executeTerminalCommand).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        control: expect.objectContaining({
          decision: expect.objectContaining({ decision: "auto_execute" }),
        }),
        plan: expect.objectContaining({
          action: "agent_stop",
          finalMode: "auto_execute",
          reviewStatus: "approved",
        }),
      }),
    );
  });

  it("admits review create commands and stops at confirmation before execution", async () => {
    vi.mocked(canHandleTerminalCommand).mockReturnValue(true);

    const result = await executeTerminalRequest(
      {
        command: "review:create task_1",
      },
      actor,
    );

    expect(executeTerminalCommand).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        requiresConfirmation: true,
        error: expect.stringContaining("confirmation"),
        control: expect.objectContaining({
          decision: expect.objectContaining({ decision: "confirm_required" }),
        }),
        plan: expect.objectContaining({
          action: "review_create",
        }),
      }),
    );
  });

  it("executes confirmed review create commands through the governed path", async () => {
    vi.mocked(canHandleTerminalCommand).mockReturnValue(true);

    const result = await executeTerminalRequest(
      {
        command: "review:create task_1",
        confirmed: true,
      },
      actor,
    );

    expect(executeTerminalCommand).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        control: expect.objectContaining({
          decision: expect.objectContaining({ decision: "auto_execute" }),
        }),
        plan: expect.objectContaining({
          action: "review_create",
          finalMode: "auto_execute",
          reviewStatus: "approved",
        }),
      }),
    );
  });

  it("admits report create commands and stops at confirmation before execution", async () => {
    vi.mocked(canHandleTerminalCommand).mockReturnValue(true);

    const result = await executeTerminalRequest(
      {
        command: "report:create brief_1 | Morning memo",
      },
      actor,
    );

    expect(executeTerminalCommand).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        requiresConfirmation: true,
        error: expect.stringContaining("confirmation"),
        control: expect.objectContaining({
          decision: expect.objectContaining({ decision: "confirm_required" }),
        }),
        plan: expect.objectContaining({
          action: "report_create",
        }),
      }),
    );
  });

  it("executes confirmed report create commands through the governed path", async () => {
    vi.mocked(canHandleTerminalCommand).mockReturnValue(true);

    const result = await executeTerminalRequest(
      {
        command: "report:create brief_1 | Morning memo",
        confirmed: true,
      },
      actor,
    );

    expect(executeTerminalCommand).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        control: expect.objectContaining({
          decision: expect.objectContaining({ decision: "auto_execute" }),
        }),
        plan: expect.objectContaining({
          action: "report_create",
          finalMode: "auto_execute",
          reviewStatus: "approved",
        }),
      }),
    );
  });

  it("admits report publish commands and stops at confirmation before execution", async () => {
    vi.mocked(canHandleTerminalCommand).mockReturnValue(true);

    const result = await executeTerminalRequest(
      {
        command: "report:publish report_1",
      },
      actor,
    );

    expect(executeTerminalCommand).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        requiresConfirmation: true,
        error: expect.stringContaining("confirmation"),
        control: expect.objectContaining({
          decision: expect.objectContaining({ decision: "confirm_required" }),
        }),
        plan: expect.objectContaining({
          action: "report_publish",
        }),
      }),
    );
  });

  it("executes confirmed report publish commands through the governed path", async () => {
    vi.mocked(canHandleTerminalCommand).mockReturnValue(true);

    const result = await executeTerminalRequest(
      {
        command: "report:publish report_1",
        confirmed: true,
      },
      actor,
    );

    expect(executeTerminalCommand).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        control: expect.objectContaining({
          decision: expect.objectContaining({ decision: "auto_execute" }),
        }),
        plan: expect.objectContaining({
          action: "report_publish",
          finalMode: "auto_execute",
          reviewStatus: "approved",
        }),
      }),
    );
  });

  it("returns confirmation-required responses without executing the request", async () => {
    vi.mocked(canHandleTerminalCommand).mockReturnValue(true);

    const result = await executeTerminalRequest(
      {
        command: "run plugin helloPlugin",
      },
      actor,
    );

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        requiresConfirmation: true,
        error: "Control review requires confirmation before execution.",
        control: expect.objectContaining({
          decision: expect.objectContaining({
            decision: "confirm_required",
            reason: "control_review_required",
          }),
        }),
      }),
    );
    expect(executeTerminalCommand).not.toHaveBeenCalled();
  });

  it("surfaces adaptive review metadata alongside confirmation responses", async () => {
    vi.mocked(canHandleTerminalCommand).mockReturnValue(true);

    const result = await executeTerminalRequest(
      {
        command: "run plugin helloPlugin",
      },
      actor,
    );

    expect(result.review).toEqual(
      expect.objectContaining({
        reviewMode: "deep",
        recommendation: expect.objectContaining({
          title: expect.any(String),
          detail: expect.any(String),
        }),
        summary: expect.objectContaining({
          headline: expect.any(String),
        }),
      }),
    );
  });

  it("admits planner-native write commands and stops at confirmation before execution", async () => {
    vi.mocked(canHandleTerminalCommand).mockReturnValue(false);

    const result = await executeTerminalRequest(
      {
        command: "write notes.txt: hello",
      },
      actor,
    );

    expect(executeTerminalCommand).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        requiresConfirmation: true,
        error: expect.stringContaining("confirmation"),
        control: expect.objectContaining({
          decision: expect.objectContaining({ decision: "confirm_required" }),
        }),
        plan: expect.objectContaining({
          action: "write_file",
        }),
      }),
    );
  });

  it("executes confirmed plugin commands through the controlled planner path", async () => {
    vi.mocked(canHandleTerminalCommand).mockReturnValue(true);

    const result = await executeTerminalRequest(
      {
        command: "run plugin helloPlugin",
        confirmed: true,
      },
      actor,
    );

    expect(executeTerminalCommand).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        control: expect.objectContaining({
          decision: expect.objectContaining({ decision: "auto_execute" }),
        }),
        plan: expect.objectContaining({
          action: "run_plugin",
          reviewStatus: "approved",
          finalMode: "auto_execute",
        }),
      }),
    );
  });

  it("routes plugin actions onto the governed confirmation path", async () => {
    const result = await executeTerminalRequest(
      {
        action: "plugin:run",
        payload: { name: "helloPlugin", pluginArg: "" },
      },
      actor,
    );

    expect(executeTerminalCommand).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        requiresConfirmation: true,
        error: expect.stringContaining("confirmation"),
        control: expect.objectContaining({
          decision: expect.objectContaining({ decision: "confirm_required" }),
        }),
        plan: expect.objectContaining({
          action: "run_plugin",
        }),
      }),
    );
  });

  it("admits workflow create-task actions and stops at confirmation before execution", async () => {
    const result = await executeTerminalRequest(
      {
        action: "workflow:create-task",
        payload: { agentName: "researcher", description: "Trace signal drift", priority: 2 },
      },
      actor,
    );

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        requiresConfirmation: true,
        error: expect.stringContaining("confirmation"),
        control: expect.objectContaining({
          decision: expect.objectContaining({ decision: "confirm_required" }),
        }),
        plan: expect.objectContaining({
          action: "workflow:create-task",
        }),
      }),
    );
  });

  it("executes confirmed workflow create-task actions through the governed path", async () => {
    const result = await executeTerminalRequest(
      {
        action: "workflow:create-task",
        payload: { agentName: "researcher", description: "Trace signal drift", priority: 2 },
        confirmed: true,
      },
      actor,
    );

    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        control: expect.objectContaining({
          decision: expect.objectContaining({ decision: "auto_execute" }),
        }),
        plan: expect.objectContaining({
          action: "workflow:create-task",
          finalMode: "auto_execute",
          reviewStatus: "approved",
        }),
      }),
    );
  });

  it("admits workflow route-task actions and stops at confirmation before execution", async () => {
    const result = await executeTerminalRequest(
      {
        action: "workflow:route-task",
        payload: { description: "Summarize source changes" },
      },
      actor,
    );

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        requiresConfirmation: true,
        error: expect.stringContaining("confirmation"),
        control: expect.objectContaining({
          decision: expect.objectContaining({ decision: "confirm_required" }),
        }),
        plan: expect.objectContaining({
          action: "workflow:route-task",
        }),
      }),
    );
  });

  it("executes confirmed workflow route-task actions through the governed path", async () => {
    const result = await executeTerminalRequest(
      {
        action: "workflow:route-task",
        payload: { description: "Summarize source changes" },
        confirmed: true,
      },
      actor,
    );

    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        control: expect.objectContaining({
          decision: expect.objectContaining({ decision: "auto_execute" }),
        }),
        plan: expect.objectContaining({
          action: "workflow:route-task",
          finalMode: "auto_execute",
          reviewStatus: "approved",
        }),
      }),
    );
  });

  it("routes job detail actions through the governed path without confirmation", async () => {
    const result = await executeTerminalRequest(
      {
        action: "job:detail",
        payload: { jobId: "job_2" },
      },
      actor,
    );

    expect(result).toEqual(
      expect.objectContaining({
        control: expect.objectContaining({
          decision: expect.objectContaining({ decision: "auto_execute" }),
        }),
        plan: expect.objectContaining({
          action: "job:detail",
          reviewStatus: "approved",
        }),
      }),
    );
    if (!result.ok) {
      expect(result.error).toContain("Job not found: job_2");
    }
  });

  it("admits job cancel actions and stops at confirmation before execution", async () => {
    const result = await executeTerminalRequest(
      {
        action: "job:cancel",
        payload: { jobId: "job_1" },
      },
      actor,
    );

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        requiresConfirmation: true,
        error: expect.stringContaining("confirmation"),
        control: expect.objectContaining({
          decision: expect.objectContaining({ decision: "confirm_required" }),
        }),
        plan: expect.objectContaining({
          action: "job:cancel",
        }),
      }),
    );
  });

  it("admits watcher start actions and stops at confirmation before execution", async () => {
    const result = await executeTerminalRequest(
      {
        action: "watcher:start",
        payload: { intervalSeconds: 5 },
      },
      actor,
    );

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        requiresConfirmation: true,
        error: expect.stringContaining("confirmation"),
        control: expect.objectContaining({
          decision: expect.objectContaining({ decision: "confirm_required" }),
        }),
        plan: expect.objectContaining({
          action: "watcher:start",
        }),
      }),
    );
  });

  it("executes confirmed watcher start actions through the governed path", async () => {
    const result = await executeTerminalRequest(
      {
        action: "watcher:start",
        payload: { intervalSeconds: 5 },
        confirmed: true,
      },
      actor,
    );

    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        control: expect.objectContaining({
          decision: expect.objectContaining({ decision: "auto_execute" }),
        }),
        plan: expect.objectContaining({
          action: "watcher:start",
          finalMode: "auto_execute",
          reviewStatus: "approved",
        }),
      }),
    );
  });

  it("admits alert run-checks actions and stops at confirmation before execution", async () => {
    const result = await executeTerminalRequest(
      {
        action: "alert:run-checks",
        payload: {},
      },
      actor,
    );

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        requiresConfirmation: true,
        error: expect.stringContaining("confirmation"),
        control: expect.objectContaining({
          decision: expect.objectContaining({ decision: "confirm_required" }),
        }),
        plan: expect.objectContaining({
          action: "alert:run-checks",
        }),
      }),
    );
  });

  it("executes confirmed alert run-checks actions through the governed path", async () => {
    const result = await executeTerminalRequest(
      {
        action: "alert:run-checks",
        payload: {},
        confirmed: true,
      },
      actor,
    );

    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        control: expect.objectContaining({
          decision: expect.objectContaining({ decision: "auto_execute" }),
        }),
        plan: expect.objectContaining({
          action: "alert:run-checks",
          finalMode: "auto_execute",
          reviewStatus: "approved",
        }),
      }),
    );
  });

  it("admits policy threshold updates and stops at confirmation before execution", async () => {
    const result = await executeTerminalRequest(
      {
        action: "policy:update-thresholds",
        payload: { queuedTasksHigh: 8 },
      },
      actor,
    );

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        requiresConfirmation: true,
        error: expect.stringContaining("confirmation"),
        control: expect.objectContaining({
          decision: expect.objectContaining({ decision: "confirm_required" }),
        }),
        plan: expect.objectContaining({
          action: "policy:update-thresholds",
        }),
      }),
    );
  });

  it("executes confirmed policy threshold updates through the governed path", async () => {
    const result = await executeTerminalRequest(
      {
        action: "policy:update-thresholds",
        payload: { queuedTasksHigh: 8 },
        confirmed: true,
      },
      actor,
    );

    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        control: expect.objectContaining({
          decision: expect.objectContaining({ decision: "auto_execute" }),
        }),
        plan: expect.objectContaining({
          action: "policy:update-thresholds",
          finalMode: "auto_execute",
          reviewStatus: "approved",
        }),
      }),
    );
  });

  it("admits agent profile updates and stops at confirmation before execution", async () => {
    const result = await executeTerminalRequest(
      {
        action: "agent:update-config",
        payload: { agentName: "planner", description: "Plans safely." },
      },
      actor,
    );

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        requiresConfirmation: true,
        error: expect.stringContaining("confirmation"),
        control: expect.objectContaining({
          decision: expect.objectContaining({ decision: "confirm_required" }),
        }),
        plan: expect.objectContaining({
          action: "agent:update-config",
        }),
      }),
    );
  });

  it("admits review approve actions and stops at confirmation before execution", async () => {
    const result = await executeTerminalRequest(
      {
        action: "review:approve",
        payload: { taskId: "task_1" },
      },
      actor,
    );

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        requiresConfirmation: true,
        error: expect.stringContaining("confirmation"),
        control: expect.objectContaining({
          decision: expect.objectContaining({ decision: "confirm_required" }),
        }),
        plan: expect.objectContaining({
          action: "review:approve",
        }),
      }),
    );
  });

  it("admits review create actions and stops at confirmation before execution", async () => {
    const result = await executeTerminalRequest(
      {
        action: "review:create",
        payload: { taskId: "task_1" },
      },
      actor,
    );

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        requiresConfirmation: true,
        error: expect.stringContaining("confirmation"),
        control: expect.objectContaining({
          decision: expect.objectContaining({ decision: "confirm_required" }),
        }),
        plan: expect.objectContaining({
          action: "review:create",
        }),
      }),
    );
  });

  it("executes confirmed review create actions through the governed path", async () => {
    const result = await executeTerminalRequest(
      {
        action: "review:create",
        payload: { taskId: "task_1" },
        confirmed: true,
      },
      actor,
    );

    expect(result).toEqual(
      expect.objectContaining({
        control: expect.objectContaining({
          decision: expect.objectContaining({ decision: "auto_execute" }),
        }),
        plan: expect.objectContaining({
          action: "review:create",
          finalMode: "auto_execute",
          reviewStatus: "approved",
        }),
      }),
    );
    if (!result.ok) {
      expect(result.error).toContain("Task not found: task_1");
    }
  });

  it("executes confirmed plugin actions through the governed path", async () => {
    const result = await executeTerminalRequest(
      {
        action: "plugin:run",
        payload: { name: "helloPlugin", pluginArg: "" },
        confirmed: true,
      },
      actor,
    );

    expect(executeTerminalCommand).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        control: expect.objectContaining({
          decision: expect.objectContaining({ decision: "auto_execute" }),
        }),
        plan: expect.objectContaining({
          action: "run_plugin",
          finalMode: "auto_execute",
          reviewStatus: "approved",
        }),
      }),
    );
  });

  it("allows only explicit legacy command fallback paths", async () => {
    const result = await executeTerminalRequest(
      {
        command: "help",
      },
      actor,
    );

    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
      }),
    );
  });

  it("rejects unknown terminal commands instead of falling through the legacy handler", async () => {
    const result = await executeTerminalRequest(
      {
        command: "totally:unknown-command",
      },
      actor,
    );

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        error: "Unsupported terminal command: totally:unknown-command.",
      }),
    );
  });

  it("routes digest generation through the governed execution path", async () => {
    const result = await executeTerminalRequest(
      {
        action: "collaboration:digest-generate",
      },
      actor,
    );

    expect(createTerminalDigest).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        control: expect.objectContaining({
          decision: expect.objectContaining({ decision: "auto_execute" }),
        }),
        plan: expect.objectContaining({
          action: "collaboration:digest-generate",
          reviewStatus: "approved",
        }),
      }),
    );
  });

  it("rejects unknown terminal actions instead of silently falling through the legacy handler", async () => {
    const result = await executeTerminalRequest(
      {
        action: "totally:unknown-action",
        payload: {},
      },
      actor,
    );

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        error: "Unsupported terminal action: totally:unknown-action.",
      }),
    );
  });

  it("admits governance compatibility actions and stops at confirmation before execution", async () => {
    const result = await executeTerminalRequest(
      {
        action: "collaboration:acknowledge-trust-alert",
        payload: { alertId: "trust_1" },
      },
      actor,
    );

    expect(executeTerminalGovernanceCompatAction).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        requiresConfirmation: true,
        error: expect.stringContaining("confirmation"),
        control: expect.objectContaining({
          decision: expect.objectContaining({ decision: "confirm_required" }),
        }),
        plan: expect.objectContaining({
          action: "collaboration:acknowledge-trust-alert",
        }),
      }),
    );
  });

  it("executes confirmed governance compatibility actions through the governed path", async () => {
    const result = await executeTerminalRequest(
      {
        action: "collaboration:acknowledge-trust-alert",
        payload: { alertId: "trust_1" },
        confirmed: true,
      },
      actor,
    );

    expect(executeTerminalGovernanceCompatAction).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        control: expect.objectContaining({
          decision: expect.objectContaining({ decision: "auto_execute" }),
        }),
        plan: expect.objectContaining({
          action: "collaboration:acknowledge-trust-alert",
          finalMode: "auto_execute",
          reviewStatus: "approved",
        }),
      }),
    );
  });

  it("exposes the operator recovery surface through the console runtime adapter", async () => {
    const result = await getTerminalOperatorRecoverySurface("plan_operator_adapter", actor);

    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        data: expect.objectContaining({
          planId: "plan_operator_adapter",
          status: "paused",
          recommendedAction: expect.objectContaining({
            action: "cancel_execution",
          }),
        }),
        overview: expect.any(Object),
      }),
    );
  });

  it("previews operator recovery actions through the console runtime adapter", async () => {
    const result = await previewTerminalOperatorRecoveryAction(
      "plan_operator_adapter",
      "approve_resume",
      { idempotencyKey: "preview_key_1" },
      actor,
    );

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        error: expect.objectContaining({
          code: "INVALID_TRANSITION",
        }),
        surface: expect.objectContaining({
          planId: "plan_operator_adapter",
        }),
        overview: expect.any(Object),
      }),
    );
  });

  it("applies operator recovery actions through the console runtime adapter", async () => {
    const result = await applyTerminalOperatorRecoveryAction(
      "plan_operator_adapter",
      "approve_resume",
      { idempotencyKey: "apply_key_1" },
      actor,
    );

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        error: expect.objectContaining({
          code: "INVALID_TRANSITION",
        }),
        surface: expect.objectContaining({
          planId: "plan_operator_adapter",
        }),
        overview: expect.any(Object),
      }),
    );
  });
});
