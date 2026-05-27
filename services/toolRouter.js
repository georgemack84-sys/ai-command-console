const listFiles = require("../tools/list_files");
const readFile = require("../tools/read_file");
const writeFile = require("../tools/write_file");
const appendFile = require("../tools/append_file");
const summarizeText = require("../tools/summarize_text");
const memory = require("./memory");
const historyService = require("./history");
const { diagnoseEnvironment, diagnosePath, formatDiagnosticReport } = require("./diagnostics");
const { explainWhyBlocked, formatWhyBlocked } = require("./whyBlocked");
const { listPlugins, runPlugin } = require("./pluginLoader");
const { logAction } = require("./logger");
const path = require("path");
const { isExecutionAuthorized, validateReviewedPlanForRouting } = require("./runtimeControl");
const { listTasks, peekNextTask } = require("./taskQueue");
const { buildSystemSummary, buildHealthSummary, buildWorkloadSummary } = require("./dashboard");
const { getAgentDashboard } = require("./dashboard");
const { listAlerts, listActiveAlerts, runAlertChecks, acknowledgeAlert, resolveAlert, addAlertNote } = require("./alerts");
const { listAgentProfiles, getAgentStatus } = require("./agentRuntime");
const { startAgent, tickAgent, stopAgent } = require("./agentRuntime");
const { routeManagerTask } = require("./agentRuntime");
const { listSchedules, getSchedule, runScheduledTick } = require("./scheduler");
const { getWatcherStatus, startWatcher, stopWatcher, updateWatcherRule, addWatcherRule, removeWatcherRule, evaluateRules } = require("./watcher");
const { getDigestSchedulerStatus } = require("./digestScheduler");
const { enqueueJob, cancelJob, retryJob, getJob } = require("./jobQueue");
const { addReviewItemForTask, listReviewItems, approveReviewItem, reviseReviewItem, createFollowupTask } = require("./reviewQueue");
const { listBriefs, listReports } = require("./researchDesk");
const { listWorkspaceRoutes } = require("./legacyConsoleWorkspaceSupport");
const { loadWorkspaceDocument } = require("./workspaceDocuments");
const { getWorkspaceDataPath } = require("./runtimePaths");
const { buildOwnershipSignals } = require("./legacyConsoleOperationsSupport");
const { formatOwnershipSignals } = require("./legacyConsoleCollaborationFormatting");
const { appendAuditEvent } = require("./auditTrail");
const { updateAlertThresholds } = require("./alerts");
const { updateAutomationPolicy } = require("./automationPolicy");
const { updateAgentProfile } = require("./agentProfiles");
const { requireTypeScriptModule } = require("./tsxRuntimeBridge");

const ROUTES_PATH = getWorkspaceDataPath("workspace-user-routes.json");
const RESEARCH_SERVICE_PATH = path.join(__dirname, "..", "src", "server", "services", "research-service.ts");
const RESEARCH_ACTION_SERVICE_PATH = path.join(__dirname, "..", "src", "server", "services", "research-action-service.ts");
const OPERATIONS_ACTION_SERVICE_PATH = path.join(__dirname, "..", "src", "server", "services", "operations-action-service.ts");
const TERMINAL_COLLABORATION_SERVICE_PATH = path.join(__dirname, "..", "src", "server", "services", "terminal-collaboration-service.ts");
const TERMINAL_GOVERNANCE_COMPAT_SERVICE_PATH = path.join(__dirname, "..", "src", "server", "services", "terminal-governance-compat-service.ts");
const TERMINAL_DIGEST_SERVICE_PATH = path.join(__dirname, "..", "src", "server", "services", "terminal-digest-service.ts");
const POLICY_GOVERNANCE_SERVICE_PATH = path.join(__dirname, "..", "src", "server", "services", "policy-governance-service.ts");
const RESEARCH_BRIDGE_GLOBAL = "__AI_COMMAND_CONSOLE_RESEARCH_BRIDGE__";
const RUNTIME_SERVICE_BRIDGE_GLOBAL = "__AI_COMMAND_CONSOLE_RUNTIME_SERVICE_BRIDGE__";
const OPERATIONS_ROUTED_ACTIONS = new Set([
  "approval:approve",
  "approval:reject",
  "approval:reassign-target",
  "approval:take-over",
  "approval:bulk-reassign-target",
  "approval:bulk-take-over",
  "collaboration:automation-assign",
  "collaboration:automation-assign-approver",
  "collaboration:automation-assign-backup-approver",
  "collaboration:automation-bulk-assign",
  "collaboration:automation-bulk-assign-approver",
  "collaboration:automation-bulk-assign-backup-approver",
  "collaboration:automation-snooze",
  "collaboration:automation-bulk-snooze",
  "collaboration:automation-run-sweep",
  "collaboration:automation-bulk-run-sweep",
  "collaboration:automation-create-followup",
  "collaboration:automation-bulk-create-followup",
  "collaboration:automation-add-note",
  "collaboration:automation-generate-summary",
  "collaboration:automation-set-status",
  "collaboration:automation-share-summary",
  "collaboration:automation-checklist-toggle",
  "collaboration:automation-bulk-apply-policy-override",
  "collaboration:automation-bulk-reset-policy-override",
  "collaboration:automation-bulk-apply-policy-playbook",
  "collaboration:automation-bulk-stabilize",
  "collaboration:save-policy-playbook",
  "collaboration:delete-policy-playbook",
  "collaboration:rollback-approval-policy",
]);
const TERMINAL_COLLABORATION_ROUTED_ACTIONS = new Set([
  "collaboration:share-session",
  "collaboration:create-handoff",
  "collaboration:close-handoff",
  "collaboration:inbox-mark-read",
  "collaboration:inbox-acknowledge",
  "collaboration:digest-preferences",
]);
const GOVERNANCE_COMPAT_ROUTED_ACTIONS = new Set([
  "collaboration:apply-approval-policy-recommendation",
  "collaboration:promote-approval-policy-recommendation",
  "collaboration:acknowledge-trust-alert",
  "collaboration:restart-approval-recommendation-observation",
  "collaboration:extend-approval-recommendation-cooldown",
]);

function loadResearchService() {
  const injectedBridge = globalThis[RESEARCH_BRIDGE_GLOBAL];
  if (injectedBridge && typeof injectedBridge.loadResearchService === "function") {
    return injectedBridge.loadResearchService();
  }
  return requireTypeScriptModule(RESEARCH_SERVICE_PATH, __filename);
}

function loadResearchActionService() {
  const injectedBridge = globalThis[RESEARCH_BRIDGE_GLOBAL];
  if (injectedBridge && typeof injectedBridge.loadResearchActionService === "function") {
    return injectedBridge.loadResearchActionService();
  }
  return requireTypeScriptModule(RESEARCH_ACTION_SERVICE_PATH, __filename);
}

function loadOperationsActionService() {
  const injectedBridge = globalThis[RUNTIME_SERVICE_BRIDGE_GLOBAL];
  if (injectedBridge && typeof injectedBridge.loadOperationsActionService === "function") {
    return injectedBridge.loadOperationsActionService();
  }
  return requireTypeScriptModule(OPERATIONS_ACTION_SERVICE_PATH, __filename);
}

function loadTerminalCollaborationService() {
  const injectedBridge = globalThis[RUNTIME_SERVICE_BRIDGE_GLOBAL];
  if (injectedBridge && typeof injectedBridge.loadTerminalCollaborationService === "function") {
    return injectedBridge.loadTerminalCollaborationService();
  }
  return requireTypeScriptModule(TERMINAL_COLLABORATION_SERVICE_PATH, __filename);
}

function loadTerminalGovernanceCompatService() {
  const injectedBridge = globalThis[RUNTIME_SERVICE_BRIDGE_GLOBAL];
  if (injectedBridge && typeof injectedBridge.loadTerminalGovernanceCompatService === "function") {
    return injectedBridge.loadTerminalGovernanceCompatService();
  }
  return requireTypeScriptModule(TERMINAL_GOVERNANCE_COMPAT_SERVICE_PATH, __filename);
}

function loadTerminalDigestService() {
  const injectedBridge = globalThis[RUNTIME_SERVICE_BRIDGE_GLOBAL];
  if (injectedBridge && typeof injectedBridge.loadTerminalDigestService === "function") {
    return injectedBridge.loadTerminalDigestService();
  }
  return requireTypeScriptModule(TERMINAL_DIGEST_SERVICE_PATH, __filename);
}

function loadPolicyGovernanceService() {
  const injectedBridge = globalThis[RUNTIME_SERVICE_BRIDGE_GLOBAL];
  if (injectedBridge && typeof injectedBridge.loadPolicyGovernanceService === "function") {
    return injectedBridge.loadPolicyGovernanceService();
  }
  return requireTypeScriptModule(POLICY_GOVERNANCE_SERVICE_PATH, __filename);
}

function getPlanActor(plan = {}) {
  const meta = plan.meta && typeof plan.meta === "object" ? plan.meta : {};
  return {
    id: String(meta.userId || ""),
    workspaceId: String(meta.workspaceId || ""),
    name: String(meta.userName || ""),
    email: String(meta.userEmail || meta.userName || ""),
    role: String(meta.userRole || "operator"),
  };
}

function formatBlock(title, value) {
  return `${title}\n${JSON.stringify(value, null, 2)}`;
}

function formatTasks(tasks = []) {
  if (!tasks.length) {
    return "No tasks found.";
  }

  return [
    "Tasks",
    ...tasks.map(
      (task) =>
        `- ${String(task.id || "task")} • ${String(task.agentName || "agent")} • ${String(task.status || "unknown")} • p${String(task.priority || 3)}\n  ${String(task.description || "")}`
    ),
  ].join("\n");
}

function formatAlerts(title, alerts = []) {
  if (!alerts.length) {
    return `${title}\nNo alerts found.`;
  }

  return [
    title,
    ...alerts.map(
      (alert) =>
        `- ${String(alert.title || alert.id || "alert")} • ${String(alert.status || "unknown")}\n  ${String(alert.message || alert.detail || "")}`
    ),
  ].join("\n");
}

function formatSchedule(schedule) {
  if (!schedule) {
    return "Schedule not found.";
  }
  return formatBlock(`Schedule: ${String(schedule.agentName || "unknown")}`, schedule);
}

function formatWatcher(status) {
  return formatBlock("Watcher", status);
}

function formatAgentStatusBlock(agentName, state) {
  return formatBlock(`Agent Status: ${agentName}`, state || {});
}

function formatAgentProfilesBlock(profiles = []) {
  if (!profiles.length) {
    return "No agent profiles found.";
  }

  return [
    "Agent Profiles",
    ...profiles.map(
      (profile) =>
        `- ${String(profile.name || "unknown")} • ${String(profile.role || "unknown")}\n  ${String(profile.description || "")}`
    ),
  ].join("\n");
}

function formatReviews(reviews = []) {
  if (!reviews.length) {
    return "No review items found.";
  }

  return formatBlock("Review Queue", { items: reviews });
}

async function route(plan, modes = {}) {
  const reviewedPlanStatus = validateReviewedPlanForRouting(plan);
  if (!reviewedPlanStatus.ok) {
    return {
      ok: false,
      error: reviewedPlanStatus.error,
      control: {
        executionMode: modes.executionMode || "blocked",
        decision: modes.controlDecision || null,
      },
    };
  }

  if (!isExecutionAuthorized(modes)) {
    return {
      ok: false,
      error: "Routing blocked because control approval is required before dispatch.",
      control: {
        executionMode: modes.executionMode || "blocked",
        decision: modes.controlDecision || null,
      },
    };
  }

  let result;

  switch (plan.action) {
    case "echo":
      result = `Echo: ${plan.payload}`;
      break;

    case "list_files":
      result = await listFiles(plan.payload || ".");
      break;

    case "read_file":
      result = await readFile(plan.payload);
      break;

    case "write_file":
      result = await writeFile(plan.payload, plan.content || "");
      break;

    case "append_file":
      result = await appendFile(plan.payload, plan.content || "");
      break;

    case "summarize_text":
      result = await summarizeText(plan.payload);
      break;

    case "diagnose_environment":
      result = formatDiagnosticReport(diagnoseEnvironment());
      break;

    case "diagnose_path":
      result = formatDiagnosticReport(diagnosePath(plan.payload));
      break;

    case "whyblocked":
      result = formatWhyBlocked(
        explainWhyBlocked(memory.loadMemory(), historyService.loadHistory())
      );
      break;

    case "list_plugins": {
      const plugins = listPlugins();
      result = [
        "=== Plugins ===",
        ...plugins.map((p) =>
          `- ${p.name} | loaded=${p.loaded} | ${p.description}${p.error ? ` | error=${p.error}` : ""}`
        ),
      ].join("\n");
      break;
    }

    case "run_plugin":
      result = await runPlugin(plan.payload, {
        input: plan.input || `run plugin ${plan.payload}`,
        payload: plan.pluginArg || "",
        pluginArg: plan.pluginArg || "",
        modes,
      });
      break;

    case "dashboard_system":
      result = formatBlock("System Summary", buildSystemSummary());
      break;

    case "dashboard_health":
      result = formatBlock("Health Summary", buildHealthSummary());
      break;

    case "dashboard_workload":
      result = formatBlock("Workload Summary", { agents: buildWorkloadSummary() });
      break;

    case "dashboard_agent":
      result = formatBlock(`Agent Dashboard: ${String(plan.payload || "unknown")}`, getAgentDashboard(plan.payload));
      break;

    case "queue_list":
      result = formatTasks(listTasks());
      break;

    case "queue_next":
      result = formatTasks([peekNextTask(plan.payload)].filter(Boolean));
      break;

    case "alerts_list":
      result = formatAlerts("Alerts", listAlerts());
      break;

    case "alerts_active":
      result = formatAlerts("Active Alerts", listActiveAlerts());
      break;

    case "digest_health": {
      const activeAlerts = listActiveAlerts();
      result = formatBlock("Digest Automation Health", {
        scheduler: getDigestSchedulerStatus(),
        alerts: activeAlerts,
        activeAlertCount: activeAlerts.length,
      });
      break;
    }

    case "review_list":
      result = formatReviews(listReviewItems());
      break;

    case "ownership_signals": {
      const workspaceId = String(plan.payload || "default");
      const signals = buildOwnershipSignals(workspaceId, {
        listBriefs,
        listReports,
        listWorkspaceRoutes: (id) => listWorkspaceRoutes(loadWorkspaceDocument, ROUTES_PATH, id),
      });
      result = formatOwnershipSignals(signals);
      break;
    }

    case "brief_list": {
      const actor = getPlanActor(plan);
      const researchService = loadResearchService();
      const briefs = await researchService.listBriefs(actor.workspaceId);
      result = briefs.length
        ? [
            "Research Briefs",
            ...briefs.map(
              (brief) =>
                `- ${String(brief.id || "brief")} • ${String(brief.status || "draft")} • ${String(brief.title || "Untitled brief")}\n  ${String(brief.question || "")}`
            ),
          ].join("\n")
        : "No research briefs found.";
      break;
    }

    case "brief_create": {
      const actor = getPlanActor(plan);
      const researchService = loadResearchService();
      const payload = plan.payload && typeof plan.payload === "object" ? plan.payload : {};
      const brief = await researchService.createBrief({
        workspaceId: actor.workspaceId,
        ownerId: actor.id,
        title: String(payload.title || ""),
        question: String(payload.question || ""),
        status: "draft",
        priority: "medium",
        assignedAgent: "researcher",
        tags: [],
        summary: "Created from the terminal command desk.",
        linkedTaskId: null,
      });
      result = [
        "Research Briefs",
        `- ${String(brief.id || "brief")} • ${String(brief.status || "draft")} • ${String(brief.title || "Untitled brief")}\n  ${String(brief.question || "")}`,
      ].join("\n");
      break;
    }

    case "brief_route": {
      const actor = getPlanActor(plan);
      const researchActions = loadResearchActionService();
      const routed = await researchActions.executeResearchAction(
        { action: "brief:route", payload: { briefId: String(plan.payload || "") } },
        actor
      );
      result = routed.output;
      break;
    }

    case "report_list": {
      const actor = getPlanActor(plan);
      const researchService = loadResearchService();
      const reports = await researchService.listReports(actor.workspaceId);
      result = reports.length
        ? [
            "Reports",
            ...reports.map(
              (report) =>
                `- ${String(report.id || "report")} • ${String(report.status || "draft")} • ${String(report.title || "Untitled report")}\n  Brief: ${String(report.briefId || "n/a")}`
            ),
          ].join("\n")
        : "No reports found.";
      break;
    }

    case "report_create": {
      const actor = getPlanActor(plan);
      const payload = plan.payload && typeof plan.payload === "object" ? plan.payload : {};
      const researchActions = loadResearchActionService();
      const created = await researchActions.executeResearchAction(
        {
          action: "report:create",
          payload: {
            briefId: String(payload.briefId || ""),
            title: String(payload.title || ""),
            format: "memo",
            excerpt: "Created from the terminal command desk.",
            keyFindings: [],
          },
        },
        actor
      );
      result = created.output;
      break;
    }

    case "report_publish": {
      const actor = getPlanActor(plan);
      const researchActions = loadResearchActionService();
      const published = await researchActions.executeResearchAction(
        { action: "report:publish", payload: { reportId: String(plan.payload || "") } },
        actor
      );
      result = published.output;
      break;
    }

    case "workflow:create-task": {
      const payload = plan.payload && typeof plan.payload === "object" ? plan.payload : {};
      const task = require("./taskQueue").addTask(String(payload.agentName || ""), String(payload.description || ""), {
        priority: Number(payload.priority || 3),
        sourceAgent: "manager",
        delegationReason: "Created from the browser console workflow.",
        tags: ["browser-workflow"],
        notifyAgent: "manager",
        callbackEnabled: true,
      });
      appendAuditEvent({
        type: "workflow:create-task",
        message: `Created task ${task.id} for ${task.agentName}.`,
        summary: task.description,
        payload: { taskId: task.id, agentName: task.agentName, actorId: getPlanActor(plan).id },
      });
      result = { ok: true, output: `Created task ${task.id} for ${task.agentName}.`, detail: { task } };
      break;
    }

    case "workflow:route-task": {
      const payload = plan.payload && typeof plan.payload === "object" ? plan.payload : {};
      const routed = routeManagerTask(String(payload.description || ""));
      appendAuditEvent({
        type: "workflow:route-task",
        message: `Routed task ${routed.task.id} to ${routed.routing.agentName}.`,
        summary: String(payload.description || ""),
        payload: { taskId: routed.task.id, agentName: routed.routing.agentName, actorId: getPlanActor(plan).id },
      });
      result = {
        ok: true,
        output: [`Routed to ${routed.routing.agentName}.`, `Reason: ${routed.routing.delegationReason}`, `Task ${routed.task.id}`].join("\n\n"),
        detail: routed,
      };
      break;
    }

    case "job:detail": {
      const payload = plan.payload && typeof plan.payload === "object" ? plan.payload : {};
      const job = getJob(String(payload.jobId || ""), { full: true });
      result = job
        ? { ok: true, output: `Loaded job ${job.id}.`, detail: { job } }
        : { ok: false, error: `Job not found: ${payload.jobId}.` };
      break;
    }

    case "job:cancel": {
      const payload = plan.payload && typeof plan.payload === "object" ? plan.payload : {};
      const job = cancelJob(String(payload.jobId || ""));
      result =
        job && job.status === "canceled"
          ? { ok: true, output: `Canceled job ${job.id}.` }
          : { ok: false, error: `Unable to cancel job ${payload.jobId}.` };
      if (result.ok) {
        appendAuditEvent({
          type: "job:cancel",
          message: `Canceled job ${job.id}.`,
          payload: { actorId: getPlanActor(plan).id, jobId: job.id },
        });
      }
      break;
    }

    case "job:retry": {
      const payload = plan.payload && typeof plan.payload === "object" ? plan.payload : {};
      const job = retryJob(String(payload.jobId || ""));
      result =
        job && job.status === "queued"
          ? { ok: true, output: `Retried job ${job.id}.` }
          : { ok: false, error: `Unable to retry job ${payload.jobId}.` };
      if (result.ok) {
        appendAuditEvent({
          type: "job:retry",
          message: `Retried job ${job.id}.`,
          payload: { actorId: getPlanActor(plan).id, jobId: job.id },
        });
      }
      break;
    }

    case "watcher:start": {
      const payload = plan.payload && typeof plan.payload === "object" ? plan.payload : {};
      const state = startWatcher(Number(payload.intervalSeconds || 5));
      appendAuditEvent({
        type: "watcher:start",
        message: `Started watcher at ${state.intervalSeconds}s.`,
        payload: { intervalSeconds: state.intervalSeconds, actorId: getPlanActor(plan).id },
      });
      result = { ok: true, output: `Watcher started at ${state.intervalSeconds}s interval.` };
      break;
    }

    case "watcher:stop": {
      const payload = plan.payload && typeof plan.payload === "object" ? plan.payload : {};
      const reason = String(payload.reason || "stopped_by_user");
      stopWatcher(reason);
      appendAuditEvent({
        type: "watcher:stop",
        message: "Stopped watcher.",
        payload: { reason, actorId: getPlanActor(plan).id },
      });
      result = { ok: true, output: "Watcher stopped." };
      break;
    }

    case "watcher:rule-upsert": {
      const payload = plan.payload && typeof plan.payload === "object" ? plan.payload : {};
      const ruleName = String(payload.name || "");
      const existing = getWatcherStatus().rules.find((rule) => rule.name === ruleName);
      const rule = existing ? updateWatcherRule(ruleName, payload) : addWatcherRule(payload);
      appendAuditEvent({
        type: "watcher:rule-upsert",
        message: `Saved watcher rule ${rule.name}.`,
        payload: { ...rule, actorId: getPlanActor(plan).id },
      });
      result = { ok: true, output: `Saved watcher rule ${rule.name}.` };
      break;
    }

    case "watcher:rule-delete": {
      const payload = plan.payload && typeof plan.payload === "object" ? plan.payload : {};
      const ruleName = String(payload.name || "");
      const removed = removeWatcherRule(ruleName);
      appendAuditEvent({
        type: "watcher:rule-delete",
        message: removed ? `Removed watcher rule ${ruleName}.` : `Watcher rule not found: ${ruleName}.`,
        payload: { name: ruleName, actorId: getPlanActor(plan).id },
      });
      result = removed
        ? { ok: true, output: `Removed watcher rule ${ruleName}.` }
        : { ok: false, error: `Watcher rule not found: ${ruleName}.` };
      break;
    }

    case "policy:update-thresholds": {
      const payload = plan.payload && typeof plan.payload === "object" ? plan.payload : {};
      const thresholds = updateAlertThresholds(payload);
      appendAuditEvent({
        type: "policy:update-thresholds",
        message: "Updated alert thresholds.",
        payload: { ...thresholds, actorId: getPlanActor(plan).id },
      });
      result = { ok: true, output: "Updated alert thresholds.", detail: { thresholds } };
      break;
    }

    case "review:create": {
      const payload = plan.payload && typeof plan.payload === "object" ? plan.payload : {};
      const created = addReviewItemForTask(String(payload.taskId || ""));
      appendAuditEvent({
        type: "review:create",
        message: created.message,
        payload: { ...payload, actorId: getPlanActor(plan).id },
      });
      result = created.ok ? { ok: true, output: created.message } : { ok: false, error: created.message };
      break;
    }

    case "review:approve": {
      const payload = plan.payload && typeof plan.payload === "object" ? plan.payload : {};
      const approved = approveReviewItem(String(payload.taskId || ""));
      appendAuditEvent({
        type: "review:approve",
        message: approved.message,
        payload: { ...payload, actorId: getPlanActor(plan).id },
      });
      result = approved.ok ? { ok: true, output: approved.message } : { ok: false, error: approved.message };
      break;
    }

    case "review:revise": {
      const payload = plan.payload && typeof plan.payload === "object" ? plan.payload : {};
      const revised = reviseReviewItem(String(payload.taskId || ""), String(payload.note || ""));
      appendAuditEvent({
        type: "review:revise",
        message: revised.message,
        summary: String(payload.note || ""),
        payload: { ...payload, actorId: getPlanActor(plan).id },
      });
      result = revised.ok ? { ok: true, output: revised.message } : { ok: false, error: revised.message };
      break;
    }

    case "review:followup": {
      const payload = plan.payload && typeof plan.payload === "object" ? plan.payload : {};
      const followup = createFollowupTask(
        String(payload.taskId || ""),
        String(payload.agentName || ""),
        String(payload.description || ""),
      );
      appendAuditEvent({
        type: "review:followup",
        message: followup.message,
        summary: String(payload.description || ""),
        payload: { ...payload, actorId: getPlanActor(plan).id },
      });
      result = followup.ok ? { ok: true, output: followup.message } : { ok: false, error: followup.message };
      break;
    }

    case "agent:update-config": {
      const payload = plan.payload && typeof plan.payload === "object" ? plan.payload : {};
      const agentName = String(payload.agentName || "");
      const profile = updateAgentProfile(agentName, {
        role: payload.role,
        description: payload.description,
        defaultGoal: payload.defaultGoal,
        systemPrompt: payload.systemPrompt,
        maxStepsPerRun: payload.maxStepsPerRun,
        cooldownSeconds: payload.cooldownSeconds,
        allowShellExecution: payload.allowShellExecution,
        allowFileWrite: payload.allowFileWrite,
        allowPlanning: payload.allowPlanning,
        tags: payload.tags,
      });
      appendAuditEvent({
        type: "agent:update-config",
        message: `Updated agent profile ${agentName}.`,
        payload: { agentName, profile, actorId: getPlanActor(plan).id },
      });
      result = { ok: true, output: `Updated profile for ${agentName}.`, detail: { profile } };
      break;
    }

    case "alert:acknowledge": {
      const payload = plan.payload && typeof plan.payload === "object" ? plan.payload : {};
      const acknowledged = acknowledgeAlert(String(payload.alertId || ""), String(payload.owner || "manager"));
      appendAuditEvent({
        type: "alert:acknowledge",
        message: acknowledged.message,
        payload: { ...payload, actorId: getPlanActor(plan).id },
      });
      result = acknowledged.ok ? { ok: true, output: acknowledged.message } : { ok: false, error: acknowledged.message };
      break;
    }

    case "alert:resolve": {
      const payload = plan.payload && typeof plan.payload === "object" ? plan.payload : {};
      const resolved = resolveAlert(String(payload.alertId || ""), String(payload.note || ""));
      appendAuditEvent({
        type: "alert:resolve",
        message: resolved.message,
        summary: String(payload.note || ""),
        payload: { ...payload, actorId: getPlanActor(plan).id },
      });
      result = resolved.ok ? { ok: true, output: resolved.message } : { ok: false, error: resolved.message };
      break;
    }

    case "alert:note": {
      const payload = plan.payload && typeof plan.payload === "object" ? plan.payload : {};
      const noted = addAlertNote(String(payload.alertId || ""), String(payload.note || ""));
      appendAuditEvent({
        type: "alert:note",
        message: noted.message,
        summary: String(payload.note || ""),
        payload: { ...payload, actorId: getPlanActor(plan).id },
      });
      result = noted.ok ? { ok: true, output: noted.message } : { ok: false, error: noted.message };
      break;
    }

    case "alert:run-checks": {
      const checks = runAlertChecks();
      appendAuditEvent({
        type: "alert:run-checks",
        message: "Ran operational alert checks from the dashboard.",
        payload: { actorId: getPlanActor(plan).id },
      });
      result = { ok: true, output: "Alert checks completed.", detail: { result: checks } };
      break;
    }

    case "policy:update-automation": {
      const payload = plan.payload && typeof plan.payload === "object" ? plan.payload : {};
      const policy = updateAutomationPolicy({
        escalation: payload.escalation || {},
        remediation: payload.remediation || {},
      });
      if (policy.escalation?.autoRunWatcherOnPolicySave) {
        evaluateRules();
      }
      if (policy.escalation?.autoRunAlertsOnPolicySave) {
        runAlertChecks();
      }
      appendAuditEvent({
        type: "policy:update-automation",
        message: "Updated automation policy.",
        payload: { ...policy, actorId: getPlanActor(plan).id },
      });
      result = { ok: true, output: "Updated automation policy.", detail: { policy } };
      break;
    }

    case "agents_list":
      result = formatAgentProfilesBlock(listAgentProfiles());
      break;

    case "agent_status":
      result = formatAgentStatusBlock(plan.payload, getAgentStatus(plan.payload).state);
      break;

    case "schedule_list": {
      const schedules = listSchedules();
      result = schedules.length
        ? schedules.map((schedule) => formatSchedule(schedule)).join("\n\n")
        : "No schedules found.";
      break;
    }

    case "schedule_status":
      result = formatSchedule(getSchedule(plan.payload));
      break;

    case "watcher_status":
      result = formatWatcher(getWatcherStatus());
      break;

    case "schedule_run": {
      const scheduledResult = await runScheduledTick(plan.payload);
      result = [scheduledResult.message, scheduledResult.schedule ? formatSchedule(scheduledResult.schedule) : null]
        .filter(Boolean)
        .join("\n\n");
      break;
    }

    case "watcher_run": {
      const actorMeta = plan.meta && typeof plan.meta === "object" ? plan.meta : {};
      const job = enqueueJob("watcher:run", {}, actorMeta);
      result = `Queued watcher run as ${job.id}.`;
      break;
    }

    case "alerts_run": {
      const actorMeta = plan.meta && typeof plan.meta === "object" ? plan.meta : {};
      const job = enqueueJob("alerts:run", {}, actorMeta);
      result = `Queued alert sweep as ${job.id}.`;
      break;
    }

    case "agent_start": {
      const payload = plan.payload && typeof plan.payload === "object" ? plan.payload : {};
      const agentName = String(payload.agentName || "");
      const goal = String(payload.goal || "");
      const started = await startAgent(agentName, goal);
      result = [started.message, formatAgentStatusBlock(agentName, started.state)].join("\n\n");
      break;
    }

    case "agent_tick": {
      const ticked = await tickAgent(plan.payload);
      result = [ticked.message, ticked.step ? `Step: ${ticked.step}` : null, ticked.result?.summary || null]
        .filter(Boolean)
        .join("\n");
      break;
    }

    case "agent_stop": {
      const stopped = stopAgent(plan.payload);
      result = [stopped.message, formatAgentStatusBlock(plan.payload, stopped.state)].join("\n\n");
      break;
    }

    case "manager_route": {
      const routed = routeManagerTask(plan.payload);
      result = [
        `Routed to ${String(routed.routing?.agentName || "unknown")}.`,
        `Reason: ${String(routed.routing?.delegationReason || "")}`,
        formatTasks([routed.task].filter(Boolean)),
      ]
        .filter(Boolean)
        .join("\n\n");
      break;
    }

    case "review_create": {
      const created = addReviewItemForTask(plan.payload);
      result = created.message;
      break;
    }

    default:
      if (OPERATIONS_ROUTED_ACTIONS.has(String(plan.action || ""))) {
        try {
          const operationsService = loadOperationsActionService();
          const operationResult = await operationsService.executeOperationsAction(
            { action: plan.action, payload: plan.payload || {} },
            getPlanActor(plan),
          );
          result =
            operationResult && typeof operationResult === "object" && typeof operationResult.output === "string"
              ? operationResult.output
              : operationResult;
        } catch (error) {
          result = { ok: false, error: error?.message || `Operations action failed: ${plan.action}` };
        }
        break;
      }

      if (TERMINAL_COLLABORATION_ROUTED_ACTIONS.has(String(plan.action || ""))) {
        try {
          const collaborationService = loadTerminalCollaborationService();
          const collaborationResult = await collaborationService.executeTerminalCollaborationAction(
            { action: plan.action, payload: plan.payload || {} },
            getPlanActor(plan),
          );
          result =
            collaborationResult && typeof collaborationResult === "object" && typeof collaborationResult.output === "string"
              ? collaborationResult.output
              : collaborationResult;
        } catch (error) {
          result = { ok: false, error: error?.message || `Collaboration action failed: ${plan.action}` };
        }
        break;
      }

      if (GOVERNANCE_COMPAT_ROUTED_ACTIONS.has(String(plan.action || ""))) {
        try {
          const governanceCompatService = loadTerminalGovernanceCompatService();
          const governanceResult = await governanceCompatService.executeTerminalGovernanceCompatAction(
            { action: plan.action, payload: plan.payload || {} },
            getPlanActor(plan),
          );
          result =
            governanceResult && typeof governanceResult === "object" && typeof governanceResult.output === "string"
              ? governanceResult.ok
                ? governanceResult.output
                : { ok: false, error: governanceResult.error || `Governance action failed: ${plan.action}` }
              : governanceResult;
        } catch (error) {
          result = { ok: false, error: error?.message || `Governance action failed: ${plan.action}` };
        }
        break;
      }

      if (String(plan.action || "") === "collaboration:digest-generate") {
        try {
          const digestService = loadTerminalDigestService();
          const digest = digestService.createTerminalDigest(getPlanActor(plan), plan.overview || {});
          result = `Generated digest ${digest.id}.`;
        } catch (error) {
          result = { ok: false, error: error?.message || "Digest generation failed." };
        }
        break;
      }

      if (String(plan.action || "") === "collaboration:digest-run-due") {
        const actor = getPlanActor(plan);
        const job = require("./legacyConsoleCompat").queueLegacyDueDigestSweepIfNeeded(actor.workspaceId, {
          actorId: actor.id,
          actorName: actor.name || actor.email,
        });
        result = job ? `Queued digest sweep as ${job.id}.` : "No digest sweep was queued.";
        break;
      }

      if (String(plan.action || "") === "collaboration:update-governance") {
        try {
          const actor = getPlanActor(plan);
          const governanceService = loadPolicyGovernanceService();
          const currentGovernance = await governanceService.getPolicyGovernanceSnapshot();
          if (!require("./permissions").canManageGovernanceInEnvironment(actor.role, currentGovernance)) {
            result = { ok: false, error: "You are not allowed to run governance actions in the current environment." };
            break;
          }
          const nextGovernance = {
            ...currentGovernance,
            ...(plan.payload && typeof plan.payload === "object" ? plan.payload : {}),
          };
          await governanceService.updateGovernanceSettings(nextGovernance);
          result = "Updated collaboration governance.";
        } catch (error) {
          result = { ok: false, error: error?.message || "Governance update failed." };
        }
        break;
      }

      result = `Unknown action: ${plan.action}`;
      break;
  }

  logAction({
    action: plan.action,
    payload: plan.payload,
    source: plan.source || "unknown",
    safeMode: !!modes.safe,
    dryRun: !!modes.dryRun,
    explain: !!modes.explain,
    debug: !!modes.debug,
    resultPreview: String(result).slice(0, 200),
  });

  return result;
}

module.exports = { route };
