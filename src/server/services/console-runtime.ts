import { createRequire } from "node:module";
import type { SessionUser } from "@/src/lib/types";
import { buildControlCenterOverview } from "@/src/server/services/control-center-service";
import { getPolicyGovernanceSnapshot } from "@/src/server/services/policy-governance-service";
import { buildTerminalCollaborationSnapshot, buildTerminalOverviewSnapshot } from "@/src/server/services/terminal-overview-service";
import {
  formatTerminalInboxDigest,
  formatTerminalInboxHistory,
  formatTerminalInboxList,
  formatTerminalTrustReport,
} from "@/src/server/services/terminal-collaboration-read-service";
import { canHandleTerminalGovernanceCompatAction } from "@/src/server/services/terminal-governance-compat-service";
import { canHandleTerminalAction, executeTerminalAction } from "@/src/server/services/terminal-action-service";
import { canHandleTerminalCommand, executeTerminalCommand } from "@/src/server/services/terminal-command-service";

const require = createRequire(import.meta.url);

const {
  queueLegacyDueDigestSweepIfNeeded,
  formatLegacyConsoleHelp,
} = require("../../../services/legacyConsoleCompat");
const { canApproveInEnvironment, canManageGovernanceInEnvironment, getEnvironmentPolicy } = require("../../../services/permissions");
const {
  executeControlledPlan,
  executeControlledStructuredPlan,
  recordLearningEvent,
  reviewRequest,
} = require("../../../services/runtimeControl");
const {
  getOperatorRecoverySurface,
  previewOperatorRecoveryAction,
  applyOperatorRecoveryAction,
} = require("../../../services/operatorRecovery");

export type ConsoleActor = Pick<SessionUser, "id" | "workspaceId" | "name" | "email" | "role">;

type TerminalOverview = {
  collaboration?: {
    governance?: Record<string, unknown>;
    permissions?: Record<string, unknown>;
    approvals?: Array<Record<string, unknown>>;
    digestWorkspaceHealth?: Array<Record<string, unknown>>;
    digestEscalations?: Array<Record<string, unknown>>;
    globalOperations?: Record<string, unknown>;
    policyPlaybookAdoption?: Record<string, unknown>;
    incidentApprovalPressure?: Array<Record<string, unknown>>;
    approvalThroughput?: Record<string, unknown>;
    approvalPolicyRecommendations?: Array<Record<string, unknown>>;
    approvalRecommendationObservations?: Array<Record<string, unknown>>;
    approvalTrustDashboard?: Record<string, unknown>;
    approvalTrustEnvironments?: Array<Record<string, unknown>>;
    approvalTrustTrends?: Array<Record<string, unknown>>;
    approvalTrustSignals?: Array<Record<string, unknown>>;
    approvalRecommendationFamilies?: Array<Record<string, unknown>>;
    completedTrustIncidents?: Array<Record<string, unknown>>;
    completedTrustEnvironments?: Array<Record<string, unknown>>;
    environmentTrustRecaps?: Array<Record<string, unknown>>;
    automationFollowups?: Array<Record<string, unknown>>;
    appliedApprovalPolicies?: Array<Record<string, unknown>>;
  };
  [key: string]: unknown;
};

type GovernedStructuredPlan = {
  type: "single";
  action: string;
  payload: unknown;
  originalRequest: string;
  source: "control";
  overview?: TerminalOverview;
  meta?: Record<string, unknown>;
};

const terminalOperationsActions = new Set([
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

const terminalCollaborationActions = new Set([
  "collaboration:share-session",
  "collaboration:create-handoff",
  "collaboration:close-handoff",
  "collaboration:inbox-mark-read",
  "collaboration:inbox-acknowledge",
  "collaboration:digest-preferences",
]);

const legacyTerminalFallbackCommands = new Set(["help"]);
const plannerGovernedTerminalCommands = new Set(["plugins", "whyblocked", "diagnose"]);
const plannerGovernedTerminalCommandPatterns = [
  /^run\s+plugin\s+\S+(?:\s+[\s\S]+)?$/i,
  /^write\s+.+?\s*:\s*[\s\S]+$/i,
  /^append\s+.+?\s*:\s*[\s\S]+$/i,
  /^summarize\s+.+?\s+and\s+save\s+to\s+.+$/i,
  /^list\s+files\s+and\s+save\s+to\s+.+$/i,
  /^diagnose\s+.+$/i,
  /^list\s+files$/i,
  /^show\s+files$/i,
  /^what\s+files(?:\s+.*)?$/i,
  /^read\s+.+$/i,
  /^read\s+.+?\s+and\s+summarize(?:\s+it)?$/i,
  /^summarize\s+.+$/i,
];

function canUsePlannerGovernedTerminalPath(command: string) {
  const normalized = String(command || "").trim();
  return (
    plannerGovernedTerminalCommands.has(normalized) ||
    plannerGovernedTerminalCommandPatterns.some((pattern) => pattern.test(normalized))
  );
}

function getPlannerGovernedActionCommand(action: string, payload: Record<string, unknown> = {}) {
  if (action !== "plugin:run") {
    return null;
  }

  const pluginName = String(payload.name || "").trim();
  if (!pluginName) {
    return null;
  }

  const pluginArg = String(payload.pluginArg || "").trim();
  return pluginArg ? `run plugin ${pluginName} ${pluginArg}` : `run plugin ${pluginName}`;
}

function getGovernedStructuredActionPlan(
  action: string,
  payload: Record<string, unknown> = {},
): GovernedStructuredPlan | null {
  if (action === "workflow:create-task") {
    return {
      type: "single",
      action,
      payload: {
        agentName: String(payload.agentName || ""),
        description: String(payload.description || ""),
        priority: Number(payload.priority || 3),
      },
      originalRequest: action,
      source: "control",
    };
  }

  if (action === "workflow:route-task") {
    return {
      type: "single",
      action,
      payload: { description: String(payload.description || "") },
      originalRequest: action,
      source: "control",
    };
  }

  if (action === "job:detail") {
    return {
      type: "single",
      action,
      payload: { jobId: String(payload.jobId || "") },
      originalRequest: action,
      source: "control",
    };
  }

  if (action === "job:cancel" || action === "job:retry") {
    return {
      type: "single",
      action,
      payload: { jobId: String(payload.jobId || "") },
      originalRequest: action,
      source: "control",
    };
  }

  if (action === "watcher:start") {
    return {
      type: "single",
      action,
      payload: { intervalSeconds: Number(payload.intervalSeconds || 5) },
      originalRequest: action,
      source: "control",
    };
  }

  if (action === "watcher:stop") {
    return {
      type: "single",
      action,
      payload: { reason: String(payload.reason || "stopped_by_user") },
      originalRequest: action,
      source: "control",
    };
  }

  if (action === "watcher:rule-upsert") {
    return {
      type: "single",
      action,
      payload: { ...payload, name: String(payload.name || "") },
      originalRequest: action,
      source: "control",
    };
  }

  if (action === "watcher:rule-delete") {
    return {
      type: "single",
      action,
      payload: { name: String(payload.name || "") },
      originalRequest: action,
      source: "control",
    };
  }

  if (action === "review:create") {
    return {
      type: "single",
      action,
      payload: { taskId: String(payload.taskId || "") },
      originalRequest: action,
      source: "control",
    };
  }

  if (action === "review:approve") {
    return {
      type: "single",
      action,
      payload: { taskId: String(payload.taskId || "") },
      originalRequest: action,
      source: "control",
    };
  }

  if (action === "review:revise") {
    return {
      type: "single",
      action,
      payload: {
        taskId: String(payload.taskId || ""),
        note: String(payload.note || ""),
      },
      originalRequest: action,
      source: "control",
    };
  }

  if (action === "review:followup") {
    return {
      type: "single",
      action,
      payload: {
        taskId: String(payload.taskId || ""),
        agentName: String(payload.agentName || ""),
        description: String(payload.description || ""),
      },
      originalRequest: action,
      source: "control",
    };
  }

  if (action === "policy:update-thresholds") {
    return {
      type: "single",
      action,
      payload: { ...payload },
      originalRequest: action,
      source: "control",
    };
  }

  if (action === "policy:update-automation") {
    return {
      type: "single",
      action,
      payload: { ...payload },
      originalRequest: action,
      source: "control",
    };
  }

  if (action === "agent:update-config") {
    return {
      type: "single",
      action,
      payload: { ...payload, agentName: String(payload.agentName || "") },
      originalRequest: action,
      source: "control",
    };
  }

  if (action === "alert:acknowledge") {
    return {
      type: "single",
      action,
      payload: {
        alertId: String(payload.alertId || ""),
        owner: String(payload.owner || "manager"),
      },
      originalRequest: action,
      source: "control",
    };
  }

  if (action === "alert:resolve" || action === "alert:note") {
    return {
      type: "single",
      action,
      payload: {
        alertId: String(payload.alertId || ""),
        note: String(payload.note || ""),
      },
      originalRequest: action,
      source: "control",
    };
  }

  if (action === "alert:run-checks") {
    return {
      type: "single",
      action,
      payload: {},
      originalRequest: action,
      source: "control",
    };
  }

  if (
    action === "collaboration:digest-generate" ||
    action === "collaboration:digest-run-due" ||
    action === "collaboration:update-governance" ||
    canHandleTerminalGovernanceCompatAction(action)
  ) {
    return {
      type: "single",
      action,
      payload: { ...payload },
      originalRequest: action,
      source: "control",
    };
  }

  if (terminalOperationsActions.has(action) || terminalCollaborationActions.has(action)) {
    return {
      type: "single",
      action,
      payload: { ...payload },
      originalRequest: action,
      source: "control",
    };
  }

  return null;
}

function getGovernedStructuredCommandPlan(command: string) {
  const trimmed = String(command || "").trim();

  if (trimmed === "agents:list") {
    return { type: "single", action: "agents_list", payload: ".", originalRequest: trimmed, source: "control" };
  }
  if (trimmed === "brief:list") {
    return { type: "single", action: "brief_list", payload: ".", originalRequest: trimmed, source: "control" };
  }
  if (trimmed.startsWith("brief:create ")) {
    const remainder = trimmed.replace("brief:create ", "").trim();
    const parts = remainder.split("|").map((item) => item.trim());
    if (parts.length < 2 || !parts[0] || !parts[1]) {
      throw new Error("Use brief:create <title> | <question>");
    }
    return {
      type: "single",
      action: "brief_create",
      payload: { title: parts[0], question: parts[1] },
      originalRequest: trimmed,
      source: "control",
    };
  }
  if (trimmed.startsWith("brief:route ")) {
    return {
      type: "single",
      action: "brief_route",
      payload: trimmed.replace("brief:route ", "").trim(),
      originalRequest: trimmed,
      source: "control",
    };
  }
  if (trimmed === "report:list") {
    return { type: "single", action: "report_list", payload: ".", originalRequest: trimmed, source: "control" };
  }
  if (trimmed.startsWith("report:create ")) {
    const remainder = trimmed.replace("report:create ", "").trim();
    const parts = remainder.split("|").map((item) => item.trim());
    if (parts.length < 2 || !parts[0] || !parts[1]) {
      throw new Error("Use report:create <briefId> | <title>");
    }
    return {
      type: "single",
      action: "report_create",
      payload: { briefId: parts[0], title: parts[1] },
      originalRequest: trimmed,
      source: "control",
    };
  }
  if (trimmed.startsWith("report:publish ")) {
    return {
      type: "single",
      action: "report_publish",
      payload: trimmed.replace("report:publish ", "").trim(),
      originalRequest: trimmed,
      source: "control",
    };
  }
  if (trimmed.startsWith("agent:status ")) {
    return {
      type: "single",
      action: "agent_status",
      payload: trimmed.replace("agent:status ", "").trim(),
      originalRequest: trimmed,
      source: "control",
    };
  }
  if (trimmed.startsWith("agent:start ")) {
    const remainder = trimmed.replace("agent:start ", "").trim();
    const firstSpace = remainder.indexOf(" ");
    const agentName = firstSpace === -1 ? remainder : remainder.slice(0, firstSpace).trim();
    const goal = firstSpace === -1 ? "" : remainder.slice(firstSpace + 1).trim();
    return {
      type: "single",
      action: "agent_start",
      payload: { agentName, goal },
      originalRequest: trimmed,
      source: "control",
    };
  }
  if (trimmed.startsWith("agent:tick ")) {
    return {
      type: "single",
      action: "agent_tick",
      payload: trimmed.replace("agent:tick ", "").trim(),
      originalRequest: trimmed,
      source: "control",
    };
  }
  if (trimmed.startsWith("agent:stop ")) {
    return {
      type: "single",
      action: "agent_stop",
      payload: trimmed.replace("agent:stop ", "").trim(),
      originalRequest: trimmed,
      source: "control",
    };
  }
  if (trimmed === "dashboard:system") {
    return { type: "single", action: "dashboard_system", payload: ".", originalRequest: trimmed, source: "control" };
  }
  if (trimmed === "dashboard:health") {
    return { type: "single", action: "dashboard_health", payload: ".", originalRequest: trimmed, source: "control" };
  }
  if (trimmed === "dashboard:workload") {
    return { type: "single", action: "dashboard_workload", payload: ".", originalRequest: trimmed, source: "control" };
  }
  if (trimmed.startsWith("dashboard:agent ")) {
    return {
      type: "single",
      action: "dashboard_agent",
      payload: trimmed.replace("dashboard:agent ", "").trim(),
      originalRequest: trimmed,
      source: "control",
    };
  }
  if (trimmed === "queue:list") {
    return { type: "single", action: "queue_list", payload: ".", originalRequest: trimmed, source: "control" };
  }
  if (trimmed.startsWith("queue:next ")) {
    return {
      type: "single",
      action: "queue_next",
      payload: trimmed.replace("queue:next ", "").trim(),
      originalRequest: trimmed,
      source: "control",
    };
  }
  if (trimmed === "alerts:list") {
    return { type: "single", action: "alerts_list", payload: ".", originalRequest: trimmed, source: "control" };
  }
  if (trimmed === "alerts:active") {
    return { type: "single", action: "alerts_active", payload: ".", originalRequest: trimmed, source: "control" };
  }
  if (trimmed === "ownership:signals") {
    return { type: "single", action: "ownership_signals", payload: "workspace", originalRequest: trimmed, source: "control" };
  }
  if (trimmed === "digest:health") {
    return { type: "single", action: "digest_health", payload: ".", originalRequest: trimmed, source: "control" };
  }
  if (trimmed === "schedule:list") {
    return { type: "single", action: "schedule_list", payload: ".", originalRequest: trimmed, source: "control" };
  }
  if (trimmed.startsWith("schedule:status ")) {
    return {
      type: "single",
      action: "schedule_status",
      payload: trimmed.replace("schedule:status ", "").trim(),
      originalRequest: trimmed,
      source: "control",
    };
  }
  if (trimmed.startsWith("schedule:run ")) {
    return {
      type: "single",
      action: "schedule_run",
      payload: trimmed.replace("schedule:run ", "").trim(),
      originalRequest: trimmed,
      source: "control",
    };
  }
  if (trimmed === "watcher:status") {
    return { type: "single", action: "watcher_status", payload: ".", originalRequest: trimmed, source: "control" };
  }
  if (trimmed.startsWith("manager:route ")) {
    return {
      type: "single",
      action: "manager_route",
      payload: trimmed.replace("manager:route ", "").trim(),
      originalRequest: trimmed,
      source: "control",
    };
  }
  if (trimmed.startsWith("review:create ")) {
    return {
      type: "single",
      action: "review_create",
      payload: trimmed.replace("review:create ", "").trim(),
      originalRequest: trimmed,
      source: "control",
    };
  }
  if (trimmed === "review:list") {
    return { type: "single", action: "review_list", payload: ".", originalRequest: trimmed, source: "control" };
  }
  if (trimmed === "watcher:run") {
    return {
      type: "single",
      action: "watcher_run",
      payload: ".",
      meta: {},
      originalRequest: trimmed,
      source: "control",
    };
  }
  if (trimmed === "alerts:run") {
    return {
      type: "single",
      action: "alerts_run",
      payload: ".",
      meta: {},
      originalRequest: trimmed,
      source: "control",
    };
  }

  return null;
}

const executableReviewedStatuses = new Set(["approved", "downgraded", "rewritten", "split"]);

function buildLearningObservation(
  user: ConsoleActor,
  request: { command?: string; action?: string; confirmed?: boolean; sessionId?: string },
  control: {
    decision?: Record<string, unknown> | null;
    review?: Record<string, unknown> | null;
    plan?: Record<string, unknown> | null;
  } | null,
  outcome: string,
) {
  const decision = control?.decision || {};
  const review = control?.review || {};
  const recommendation = (review?.recommendation as Record<string, unknown> | undefined) || {};
  const attentionPoints = Array.isArray(review?.attentionPoints) ? (review.attentionPoints as Array<Record<string, unknown>>) : [];
  const confidence = typeof recommendation.confidenceScore === "number"
    ? recommendation.confidenceScore
    : typeof decision?.riskScore === "number"
      ? Math.max(0, Math.min(1, 1 - Number(decision.riskScore) / 100))
      : 0.25;

  return {
    actorId: user.id,
    actorRole: user.role,
    sessionId: request.sessionId || null,
    eventType: "review_observation",
    requestKey: String(request.command || request.action || ""),
    recommendationId: String(recommendation.id || review?.reviewMode || "review_observation"),
    reviewMode: String(review?.reviewMode || decision?.reviewMode || "minimal"),
    riskLevel:
      typeof decision?.riskScore === "number"
        ? Number(decision.riskScore) >= 70
          ? "high"
          : Number(decision.riskScore) >= 35
            ? "medium"
            : "low"
        : "low",
    deltaPresent: Boolean((review?.deltaAnalysis as Record<string, unknown> | undefined)?.changed),
    attentionSignals: attentionPoints.map((item) => String(item.reasonCode || item.title || "attention")),
    outcome,
    evidenceComplete:
      String(recommendation.reasonCode || "") !== "EVIDENCE_INCOMPLETE" &&
      attentionPoints.every((item) => String(item.reasonCode || "") !== "EVIDENCE_INCOMPLETE"),
    reasonCode: String(recommendation.reasonCode || "EVIDENCE_INCOMPLETE"),
    recommendationConfidence: Number(confidence),
    recommendationPriority: String(recommendation.priority || "low"),
  };
}

function emitLearningObservation(
  user: ConsoleActor,
  request: { command?: string; action?: string; confirmed?: boolean; sessionId?: string },
  control: {
    control?: { decision?: Record<string, unknown> | null } | null;
    review?: Record<string, unknown> | null;
    plan?: Record<string, unknown> | null;
  } | null,
  outcome: string,
) {
  if (!control?.control?.decision && !control?.review) {
    return;
  }
  recordLearningEvent(
    buildLearningObservation(
      user,
      request,
      {
        decision: control.control?.decision || null,
        review: control.review || null,
        plan: control.plan || null,
      },
      outcome,
    ),
  );
}

function getExecutableReviewedActionPlan(control: {
  plan?: Record<string, unknown> | null;
  decision?: { decision?: string | null } | null;
}) {
  const plan = control?.plan;
  if (!plan || typeof plan !== "object") {
    return { ok: false, error: "Routing blocked because the plan is missing." };
  }

  const reviewStatus = String(plan.reviewStatus || "").trim();
  if (!reviewStatus) {
    return { ok: false, error: "Routing blocked because the plan is missing a valid reviewStatus." };
  }

  if (!executableReviewedStatuses.has(reviewStatus)) {
    return { ok: false, error: `Routing blocked because reviewStatus is ${reviewStatus}.` };
  }

  if (plan.currentStageExecutable === false) {
    return { ok: false, error: "Routing blocked because the reviewed plan is not executable in the current stage." };
  }

  const executionMode = String(plan.finalMode || control?.decision?.decision || "blocked");
  if (executionMode !== "auto_execute" || String(control?.decision?.decision || "blocked") !== "auto_execute") {
    return { ok: false, error: "Routing blocked because control approval is required before dispatch." };
  }

  return { ok: true, plan };
}

function buildTerminalApprovalList(controlCenterOverview: Awaited<ReturnType<typeof buildControlCenterOverview>>) {
  return controlCenterOverview.collaboration.digestWorkspaceHealth
    .flatMap((workspace) =>
      (workspace.incidentApprovalHistory || []).map((approval) => ({
        id: approval.id,
        label: approval.label || `Approve ${approval.requestedStatus} for ${workspace.workspaceName}`,
        action: "collaboration:automation-set-status",
        status: approval.status,
        requestedByName: approval.requestedByName,
        requestedStatus: approval.requestedStatus,
        workspaceId: workspace.workspaceId,
        workspaceName: workspace.workspaceName,
        approverTarget: approval.approverTarget,
        approvedByName: approval.approvedByName,
        rejectedByName: approval.rejectedByName,
        resolvedAt: approval.resolvedAt,
        createdAt: approval.createdAt,
      })),
    )
    .sort((left, right) => {
      if (left.status === right.status) {
        return new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime();
      }
      return left.status === "pending" ? -1 : 1;
    });
}

function mergeTerminalGovernance(
  overview: TerminalOverview,
  controlCenterOverview: Awaited<ReturnType<typeof buildControlCenterOverview>>,
  governance: Awaited<ReturnType<typeof getPolicyGovernanceSnapshot>>,
  user: ConsoleActor,
) {
  const policy = getEnvironmentPolicy(governance, user.workspaceId);
  const controlCollaboration = controlCenterOverview.collaboration;

  return {
    ...overview,
    collaboration: {
      ...(overview.collaboration || {}),
      digestWorkspaceHealth: controlCollaboration.digestWorkspaceHealth,
      digestEscalations: controlCollaboration.digestEscalations,
      approvals: buildTerminalApprovalList(controlCenterOverview),
      globalOperations: controlCollaboration.globalOperations,
      policyPlaybookAdoption: controlCollaboration.policyPlaybookAdoption,
      incidentApprovalPressure: controlCollaboration.incidentApprovalPressure,
      approvalThroughput: controlCollaboration.approvalThroughput,
      approvalPolicyRecommendations: controlCollaboration.approvalPolicyRecommendations,
      approvalRecommendationObservations: controlCollaboration.approvalRecommendationObservations,
      approvalTrustDashboard: controlCollaboration.approvalTrustDashboard,
      approvalTrustEnvironments: controlCollaboration.approvalTrustEnvironments,
      approvalTrustTrends: controlCollaboration.approvalTrustTrends,
      approvalTrustSignals: controlCollaboration.approvalTrustSignals,
      approvalRecommendationFamilies: controlCollaboration.approvalRecommendationFamilies,
      completedTrustIncidents: controlCollaboration.completedTrustIncidents,
      completedTrustEnvironments: controlCollaboration.completedTrustEnvironments,
      environmentTrustRecaps: controlCollaboration.environmentTrustRecaps,
      automationFollowups: controlCollaboration.automationFollowups,
      appliedApprovalPolicies: controlCollaboration.appliedApprovalPolicies,
      governance: {
        ...(overview.collaboration?.governance || {}),
        currentEnvironment: governance.currentEnvironment,
        sensitiveActionsRequireApproval: Boolean(governance.sensitiveActionsRequireApproval),
        environmentPolicies: governance.environmentPolicies || {},
        workspacePolicyOverrides: governance.workspacePolicyOverrides || {},
        workspacePolicyPlaybooks: governance.workspacePolicyPlaybooks || [],
        workspacePolicyPlaybookRollouts: governance.workspacePolicyPlaybookRollouts || [],
        defaultPolicyPlaybookPresets: governance.defaultPolicyPlaybookPresets || [],
        demoScenario: governance.demoScenario || null,
      },
      permissions: {
        ...(overview.collaboration?.permissions || {}),
        canApprove: Boolean(canApproveInEnvironment(user.role, governance, user.workspaceId)),
        canManageGovernance: Boolean(canManageGovernanceInEnvironment(user.role, governance)),
        currentEnvironment: governance.currentEnvironment,
        minimumRoleForCommands: String(policy.minimumRoleForCommands || "operator"),
        minimumRoleForApprovals: String(policy.minimumRoleForApprovals || "approver"),
        minimumRoleForGovernance: String(policy.minimumRoleForGovernance || "admin"),
      },
    },
  };
}

export function createConsoleActor(user: ConsoleActor) {
  return {
    userId: user.id,
    workspaceId: user.workspaceId,
    userName: user.name || user.email,
    userRole: user.role,
  };
}

export async function getTerminalOverview(user: ConsoleActor): Promise<TerminalOverview> {
  const [governance, controlCenterOverview] = await Promise.all([
    getPolicyGovernanceSnapshot(),
    buildControlCenterOverview(user as SessionUser),
  ]);
  const terminalSnapshot = await buildTerminalOverviewSnapshot(user.workspaceId, controlCenterOverview);
  const mergedOverview = mergeTerminalGovernance(
    {
      ...terminalSnapshot,
      collaboration: {},
    },
    controlCenterOverview,
    governance,
    user,
  );
  const collaborationSnapshot = buildTerminalCollaborationSnapshot({
    user,
    governance,
    ownershipSignals: Array.isArray((mergedOverview as Record<string, unknown>).ownershipSignals)
      ? ((mergedOverview as Record<string, unknown>).ownershipSignals as Array<Record<string, unknown>>)
      : [],
    digestEscalations: Array.isArray(mergedOverview.collaboration?.digestEscalations)
      ? (mergedOverview.collaboration.digestEscalations as Array<Record<string, unknown>>)
      : [],
    trustSignals: Array.isArray(mergedOverview.collaboration?.approvalTrustSignals)
      ? (mergedOverview.collaboration.approvalTrustSignals as Array<Record<string, unknown>>)
      : [],
    approvals: Array.isArray(mergedOverview.collaboration?.approvals)
      ? (mergedOverview.collaboration.approvals as Array<Record<string, unknown>>)
      : [],
  });

  return {
    ...mergedOverview,
    collaboration: {
      ...(mergedOverview.collaboration || {}),
      ...collaborationSnapshot,
    },
  };
}

export async function executeTerminalRequest(
  body: {
    command?: string;
    action?: string;
    payload?: Record<string, unknown>;
    confirmed?: boolean;
    sessionId?: string;
    operatorOverride?: Record<string, unknown>;
  },
  user: ConsoleActor,
) {
  const trimmedCommand = String(body.command || "").trim();
  const action = String(body.action || "").trim();
  const actionPayload = body.payload || {};
  const confirmed = Boolean(body.confirmed);
  const operatorOverride = body.operatorOverride;
  const hasSupportedCommand =
    Boolean(trimmedCommand) &&
    (canHandleTerminalCommand(trimmedCommand) ||
      canUsePlannerGovernedTerminalPath(trimmedCommand) ||
      trimmedCommand === "inbox:list" ||
      trimmedCommand === "inbox:digest" ||
      trimmedCommand === "inbox:history" ||
      trimmedCommand === "trust:report" ||
      legacyTerminalFallbackCommands.has(trimmedCommand));
  const hasSupportedAction =
    Boolean(body.action) &&
    (terminalOperationsActions.has(String(body.action)) ||
      terminalCollaborationActions.has(String(body.action)) ||
      canHandleTerminalAction(String(body.action)) ||
      canHandleTerminalGovernanceCompatAction(String(body.action)) ||
      body.action === "collaboration:digest-generate" ||
      body.action === "collaboration:digest-run-due" ||
      body.action === "collaboration:update-governance");

  if (trimmedCommand && !hasSupportedCommand) {
    return {
      ok: false,
      error: `Unsupported terminal command: ${trimmedCommand}.`,
      overview: await getTerminalOverview(user),
    };
  }

  if (body.action && !hasSupportedAction) {
    return {
      ok: false,
      error: `Unsupported terminal action: ${body.action}.`,
      overview: await getTerminalOverview(user),
    };
  }

  const plannerGovernedActionCommand = action ? getPlannerGovernedActionCommand(action, actionPayload) : null;
  if (plannerGovernedActionCommand) {
    const controlled = await executeControlledPlan(plannerGovernedActionCommand, {
      actor: user,
      identitySource: "human",
      modes: { confirmed, operatorOverride },
    });
    const control = controlled.control || null;
    const review = controlled.review || null;
    const controlMode = String(control?.decision?.decision || "blocked");

    if (controlMode === "blocked") {
      emitLearningObservation(user, body, controlled, "blocked");
      return {
        ok: false,
        error: control?.decision?.explanation || "Request blocked by control review.",
        control,
        review,
        overview: await getTerminalOverview(user),
      };
    }

    if (controlMode === "simulate") {
      emitLearningObservation(user, body, controlled, "simulated");
      return {
        ok: true,
        output: control?.decision?.explanation || "Execution simulated.",
        control,
        review,
        plan: controlled.plan,
        overview: await getTerminalOverview(user),
      };
    }

    if (controlMode === "confirm_required") {
      emitLearningObservation(user, body, controlled, confirmed ? "confirmed" : "review_presented");
      return {
        ok: false,
        error: control?.decision?.explanation || "Confirmation required before execution.",
        control,
        review,
        plan: controlled.plan,
        requiresConfirmation: true,
        overview: await getTerminalOverview(user),
      };
    }

    emitLearningObservation(user, body, controlled, "executed");
    return {
      ok: true,
      output: controlled.result,
      control,
      review,
      plan: controlled.plan,
      overview: await getTerminalOverview(user),
    };
  }

  const governedStructuredActionPlan = action ? getGovernedStructuredActionPlan(action, actionPayload) : null;
  if (governedStructuredActionPlan) {
    if (governedStructuredActionPlan.action === "collaboration:digest-generate") {
      governedStructuredActionPlan.overview = await getTerminalOverview(user);
    }
    governedStructuredActionPlan.meta = {
      userId: user.id,
      workspaceId: user.workspaceId,
      userName: user.name || user.email,
      userEmail: user.email,
      userRole: user.role,
    };

    const controlled = await executeControlledStructuredPlan(governedStructuredActionPlan, {
      actor: user,
      identitySource: "human",
      modes: { confirmed, operatorOverride },
    });
    const control = controlled.control || null;
    const review = controlled.review || null;
    const controlMode = String(control?.decision?.decision || "blocked");

    if (controlMode === "blocked") {
      emitLearningObservation(user, body, controlled, "blocked");
      return {
        ok: false,
        error: control?.decision?.explanation || "Request blocked by control review.",
        control,
        review,
        overview: await getTerminalOverview(user),
      };
    }

    if (controlMode === "simulate") {
      emitLearningObservation(user, body, controlled, "simulated");
      return {
        ok: true,
        output: control?.decision?.explanation || "Execution simulated.",
        control,
        review,
        plan: controlled.plan,
        overview: await getTerminalOverview(user),
      };
    }

    if (controlMode === "confirm_required") {
      emitLearningObservation(user, body, controlled, confirmed ? "confirmed" : "review_presented");
      return {
        ok: false,
        error: control?.decision?.explanation || "Confirmation required before execution.",
        control,
        review,
        plan: controlled.plan,
        requiresConfirmation: true,
        overview: await getTerminalOverview(user),
      };
    }

    const actionResult =
      controlled.result && typeof controlled.result === "object"
        ? (controlled.result as { ok?: boolean; output?: string; error?: string; detail?: Record<string, unknown> })
        : null;

    if (actionResult && actionResult.ok === false) {
      emitLearningObservation(user, body, controlled, "failed");
      return {
        ok: false,
        error: actionResult.error || "Action failed.",
        detail: actionResult.detail,
        control,
        review,
        plan: controlled.plan,
        overview: await getTerminalOverview(user),
      };
    }

    emitLearningObservation(user, body, controlled, "executed");
    return {
      ok: true,
      output: actionResult?.output || controlled.result,
      detail: actionResult?.detail,
      control,
      review,
      plan: controlled.plan,
      overview: await getTerminalOverview(user),
    };
  }

  const governedStructuredCommandPlan = trimmedCommand ? getGovernedStructuredCommandPlan(trimmedCommand) : null;
  if (governedStructuredCommandPlan) {
    if (governedStructuredCommandPlan.action === "ownership_signals") {
      governedStructuredCommandPlan.payload = user.workspaceId;
    }
    if (
      ["brief_list", "brief_create", "brief_route", "report_list", "report_create", "report_publish"].includes(
        governedStructuredCommandPlan.action,
      )
    ) {
      governedStructuredCommandPlan.meta = {
        userId: user.id,
        workspaceId: user.workspaceId,
        userName: user.name || user.email,
        userEmail: user.email,
        userRole: user.role,
      };
    }
    if (governedStructuredCommandPlan.action === "watcher_run" || governedStructuredCommandPlan.action === "alerts_run") {
      governedStructuredCommandPlan.meta = {
        userId: user.id,
        workspaceId: user.workspaceId,
        userName: user.name || user.email,
        userRole: user.role,
      };
    }

    const controlled = await executeControlledStructuredPlan(governedStructuredCommandPlan, {
      actor: user,
      identitySource: "human",
      modes: { confirmed, operatorOverride },
    });
    const control = controlled.control || null;
    const review = controlled.review || null;
    const controlMode = String(control?.decision?.decision || "blocked");

    if (controlMode === "blocked") {
      emitLearningObservation(user, body, controlled, "blocked");
      return {
        ok: false,
        error: control?.decision?.explanation || "Request blocked by control review.",
        control,
        review,
        overview: await getTerminalOverview(user),
      };
    }

    if (controlMode === "simulate") {
      emitLearningObservation(user, body, controlled, "simulated");
      return {
        ok: true,
        output: control?.decision?.explanation || "Execution simulated.",
        control,
        review,
        plan: controlled.plan,
        overview: await getTerminalOverview(user),
      };
    }

    if (controlMode === "confirm_required") {
      emitLearningObservation(user, body, controlled, confirmed ? "confirmed" : "review_presented");
      return {
        ok: false,
        error: control?.decision?.explanation || "Confirmation required before execution.",
        control,
        review,
        plan: controlled.plan,
        requiresConfirmation: true,
        overview: await getTerminalOverview(user),
      };
    }

    emitLearningObservation(user, body, controlled, "executed");
    return {
      ok: true,
      output: controlled.result,
      control,
      review,
      plan: controlled.plan,
      overview: await getTerminalOverview(user),
    };
  }

  if (trimmedCommand && canUsePlannerGovernedTerminalPath(trimmedCommand)) {
    const controlled = await executeControlledPlan(trimmedCommand, {
      actor: user,
      identitySource: "human",
      modes: { confirmed, operatorOverride },
    });
    const control = controlled.control || null;
    const review = controlled.review || null;
    const controlMode = String(control?.decision?.decision || "blocked");

    if (controlMode === "blocked") {
      emitLearningObservation(user, body, controlled, "blocked");
      return {
        ok: false,
        error: control?.decision?.explanation || "Request blocked by control review.",
        control,
        review,
        overview: await getTerminalOverview(user),
      };
    }

    if (controlMode === "simulate") {
      emitLearningObservation(user, body, controlled, "simulated");
      return {
        ok: true,
        output: control?.decision?.explanation || "Execution simulated.",
        control,
        review,
        plan: controlled.plan,
        overview: await getTerminalOverview(user),
      };
    }

    if (controlMode === "confirm_required") {
      emitLearningObservation(user, body, controlled, confirmed ? "confirmed" : "review_presented");
      return {
        ok: false,
        error: control?.decision?.explanation || "Confirmation required before execution.",
        control,
        review,
        plan: controlled.plan,
        requiresConfirmation: true,
        overview: await getTerminalOverview(user),
      };
    }

    emitLearningObservation(user, body, controlled, "executed");
    return {
      ok: true,
      output: controlled.result,
      control,
      review,
      plan: controlled.plan,
      overview: await getTerminalOverview(user),
    };
  }

  if (
    trimmedCommand === "inbox:list" ||
    trimmedCommand === "inbox:digest" ||
    trimmedCommand === "inbox:history" ||
    trimmedCommand === "trust:report"
  ) {
    const overview = await getTerminalOverview(user);
    if (trimmedCommand === "inbox:list") {
      return { ok: true, output: formatTerminalInboxList(overview), control: null, overview };
    }
    if (trimmedCommand === "inbox:digest") {
      return { ok: true, output: formatTerminalInboxDigest(overview), control: null, overview };
    }
    if (trimmedCommand === "trust:report") {
      return { ok: true, output: formatTerminalTrustReport(overview), control: null, overview };
    }
    return { ok: true, output: formatTerminalInboxHistory(overview), control: null, overview };
  }

  if (legacyTerminalFallbackCommands.has(trimmedCommand)) {
    return {
      ok: true,
      output: formatLegacyConsoleHelp(),
      control: null,
      overview: await getTerminalOverview(user),
    };
  }

  const control = await reviewRequest(body, user, {
    identitySource: "human",
    workspaceId: user.workspaceId,
    modes: { confirmed, operatorOverride },
  });
  const controlMode = String(control.decision?.decision || "blocked");

  if (controlMode === "blocked") {
    emitLearningObservation(user, body, { control, review: control.review, plan: control.plan }, "blocked");
    return {
      ok: false,
      error: control.decision.explanation,
      control,
      review: control.review,
      overview: await getTerminalOverview(user),
    };
  }

  if (controlMode === "simulate") {
    emitLearningObservation(user, body, { control, review: control.review, plan: control.plan }, "simulated");
    return {
      ok: true,
      output: control.decision.explanation,
      control,
      review: control.review,
      plan: control.plan,
      overview: await getTerminalOverview(user),
    };
  }

  if (controlMode === "confirm_required") {
    emitLearningObservation(user, body, { control, review: control.review, plan: control.plan }, confirmed ? "confirmed" : "review_presented");
    return {
      ok: false,
      error: control.decision.explanation,
      control,
      review: control.review,
      plan: control.plan,
      requiresConfirmation: true,
      overview: await getTerminalOverview(user),
    };
  }

  const reviewedActionPlanStatus = body.action ? getExecutableReviewedActionPlan(control) : null;
  if (body.action && reviewedActionPlanStatus && !reviewedActionPlanStatus.ok) {
    emitLearningObservation(user, body, { control, review: control.review, plan: control.plan }, "blocked");
    return {
      ok: false,
      error: reviewedActionPlanStatus.error,
      control,
      review: control.review,
      plan: control.plan,
      overview: await getTerminalOverview(user),
    };
  }

  const reviewedActionPlan = reviewedActionPlanStatus && reviewedActionPlanStatus.ok ? reviewedActionPlanStatus.plan : null;
  const reviewedAction = reviewedActionPlan ? String(reviewedActionPlan.action || "") : "";
  const reviewedPayload =
    reviewedActionPlan && reviewedActionPlan.payload && typeof reviewedActionPlan.payload === "object"
      ? (reviewedActionPlan.payload as Record<string, unknown>)
      : {};

  if (trimmedCommand && canHandleTerminalCommand(trimmedCommand)) {
    const output = await executeTerminalCommand(trimmedCommand, user as SessionUser);
    return {
      ok: true,
      output,
      control,
      overview: await getTerminalOverview(user),
    };
  }

  if (
    trimmedCommand === "inbox:list" ||
    trimmedCommand === "inbox:digest" ||
    trimmedCommand === "inbox:history" ||
    trimmedCommand === "trust:report"
  ) {
    const overview = await getTerminalOverview(user);
    if (trimmedCommand === "inbox:list") {
      return { ok: true, output: formatTerminalInboxList(overview), control, overview };
    }
    if (trimmedCommand === "inbox:digest") {
      return { ok: true, output: formatTerminalInboxDigest(overview), control, overview };
    }
    if (trimmedCommand === "trust:report") {
      return { ok: true, output: formatTerminalTrustReport(overview), control, overview };
    }
    return { ok: true, output: formatTerminalInboxHistory(overview), control, overview };
  }

  if (reviewedAction && canHandleTerminalAction(reviewedAction)) {
    const result = await executeTerminalAction(
      {
        action: reviewedAction,
        payload: reviewedPayload,
      },
      user as SessionUser,
    );

    if (!result.ok) {
      emitLearningObservation(user, body, { control, review: control.review, plan: control.plan }, "failed");
      return {
        ok: false,
        error: result.error || "Action failed.",
        detail: result.detail,
        control,
        review: control.review,
        overview: await getTerminalOverview(user),
      };
    }

    emitLearningObservation(user, body, { control, review: control.review, plan: control.plan }, "executed");
    return {
      ok: true,
      output: result.output,
      detail: result.detail,
      control,
      review: control.review,
      overview: await getTerminalOverview(user),
    };
  }

  emitLearningObservation(user, body, { control, review: control.review, plan: control.plan }, "executed");
  return {
    ok: true,
    output: formatLegacyConsoleHelp(),
    control,
    review: control.review,
    overview: await getTerminalOverview(user),
  };
}

export async function getTerminalOperatorRecoverySurface(planId: string, user: ConsoleActor) {
  const result = getOperatorRecoverySurface(planId);
  return {
    ...result,
    overview: await getTerminalOverview(user),
  };
}

export async function previewTerminalOperatorRecoveryAction(
  planId: string,
  action: string,
  payload: Record<string, unknown>,
  user: ConsoleActor,
) {
  const result = previewOperatorRecoveryAction(planId, action, {
    ...payload,
    operatorId: user.id,
  });
  return {
    ...result,
    overview: await getTerminalOverview(user),
  };
}

export async function applyTerminalOperatorRecoveryAction(
  planId: string,
  action: string,
  payload: Record<string, unknown>,
  user: ConsoleActor,
) {
  const result = await applyOperatorRecoveryAction(planId, action, {
    ...payload,
    operatorId: user.id,
  });
  return {
    ...result,
    overview: await getTerminalOverview(user),
  };
}

export function queueTerminalDigestSweep(user: ConsoleActor) {
  return queueLegacyDueDigestSweepIfNeeded(user.workspaceId, {
    actorId: user.id,
    actorName: user.name || user.email,
  });
}
