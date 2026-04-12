import { createRequire } from "node:module";
import type { SessionUser } from "@/src/lib/types";
import { buildControlCenterOverview } from "@/src/server/services/control-center-service";
import { getPolicyGovernanceSnapshot, updateGovernanceSettings } from "@/src/server/services/policy-governance-service";
import { buildTerminalCollaborationSnapshot, buildTerminalOverviewSnapshot } from "@/src/server/services/terminal-overview-service";
import {
  formatTerminalInboxDigest,
  formatTerminalInboxHistory,
  formatTerminalInboxList,
  formatTerminalTrustReport,
} from "@/src/server/services/terminal-collaboration-read-service";
import {
  canHandleTerminalGovernanceCompatAction,
  executeTerminalGovernanceCompatAction,
} from "@/src/server/services/terminal-governance-compat-service";
import { canHandleTerminalAction, executeTerminalAction } from "@/src/server/services/terminal-action-service";
import { canHandleTerminalCommand, executeTerminalCommand } from "@/src/server/services/terminal-command-service";

const require = createRequire(import.meta.url);

const {
  queueLegacyDueDigestSweepIfNeeded,
  formatLegacyConsoleHelp,
} = require("../../../services/legacyConsoleCompat");
const { canApproveInEnvironment, canManageGovernanceInEnvironment, getEnvironmentPolicy } = require("../../../services/permissions");

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
  body: { command?: string; action?: string; payload?: Record<string, unknown> },
  user: ConsoleActor,
) {
  const trimmedCommand = String(body.command || "").trim();
  if (trimmedCommand && canHandleTerminalCommand(trimmedCommand)) {
    const output = await executeTerminalCommand(trimmedCommand, user as SessionUser);
    return {
      ok: true,
      output,
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
      return { ok: true, output: formatTerminalInboxList(overview), overview };
    }
    if (trimmedCommand === "inbox:digest") {
      return { ok: true, output: formatTerminalInboxDigest(overview), overview };
    }
    if (trimmedCommand === "trust:report") {
      return { ok: true, output: formatTerminalTrustReport(overview), overview };
    }
    return { ok: true, output: formatTerminalInboxHistory(overview), overview };
  }

  if (trimmedCommand && !legacyTerminalFallbackCommands.has(trimmedCommand)) {
    return {
      ok: false,
      error: `Unsupported terminal command: ${trimmedCommand}.`,
      overview: await getTerminalOverview(user),
    };
  }

  if (body.action && terminalOperationsActions.has(body.action)) {
    const { executeOperationsAction } = await import("@/src/server/services/operations-action-service");
    const result = await executeOperationsAction(
      {
        action: body.action,
        payload: body.payload || {},
      },
      user as SessionUser,
    );

    return {
      ok: true,
      output: result.output,
      overview: await getTerminalOverview(user),
    };
  }

  if (body.action && terminalCollaborationActions.has(body.action)) {
    const { executeTerminalCollaborationAction } = await import("@/src/server/services/terminal-collaboration-service");
    const currentOverview = await getTerminalOverview(user);
    const result = await executeTerminalCollaborationAction(
      {
        action: body.action,
        payload: body.payload || {},
      },
      user as SessionUser,
      currentOverview,
    );

    return {
      ok: true,
      output: result.output,
      overview: await getTerminalOverview(user),
    };
  }

  if (body.action && canHandleTerminalAction(body.action)) {
    const result = await executeTerminalAction(
      {
        action: body.action,
        payload: body.payload || {},
      },
      user as SessionUser,
    );

    if (!result.ok) {
      return {
        ok: false,
        error: result.error || "Action failed.",
        detail: result.detail,
        overview: await getTerminalOverview(user),
      };
    }

    return {
      ok: true,
      output: result.output,
      detail: result.detail,
      overview: await getTerminalOverview(user),
    };
  }

  if (body.action && canHandleTerminalGovernanceCompatAction(body.action)) {
    const result = await executeTerminalGovernanceCompatAction(
      {
        action: body.action,
        payload: body.payload || {},
      },
      user as SessionUser,
    );

    if (!result.ok) {
      return {
        ok: false,
        error: result.error,
        overview: await getTerminalOverview(user),
      };
    }

    return {
      ok: true,
      output: result.output,
      overview: await getTerminalOverview(user),
    };
  }

  if (body.action === "collaboration:digest-generate") {
    const { createTerminalDigest } = await import("@/src/server/services/terminal-digest-service");
    const overview = await getTerminalOverview(user);
    const digest = createTerminalDigest(user as SessionUser, overview);
    return {
      ok: true,
      output: `Generated digest ${digest.id}.`,
      overview: await getTerminalOverview(user),
    };
  }

  if (body.action === "collaboration:digest-run-due") {
    const job = queueTerminalDigestSweep(user);
    return {
      ok: true,
      output: job ? `Queued digest sweep as ${job.id}.` : "No digest sweep was queued.",
      overview: await getTerminalOverview(user),
    };
  }

  if (body.action === "collaboration:update-governance") {
    const currentGovernance = await getPolicyGovernanceSnapshot();
    const nextGovernance = {
      ...currentGovernance,
      ...(body.payload || {}),
    };

    if (!canManageGovernanceInEnvironment(user.role, currentGovernance)) {
      const overview = await getTerminalOverview(user);
      return { ok: false, error: "You are not allowed to run governance actions in the current environment.", overview };
    }

    await updateGovernanceSettings(nextGovernance);
    return {
      ok: true,
      output: "Updated collaboration governance.",
      overview: await getTerminalOverview(user),
    };
  }

  if (body.action) {
    return {
      ok: false,
      error: `Unsupported terminal action: ${body.action}.`,
      overview: await getTerminalOverview(user),
    };
  }

  return {
    ok: true,
    output: formatLegacyConsoleHelp(),
    overview: await getTerminalOverview(user),
  };
}

export function queueTerminalDigestSweep(user: ConsoleActor) {
  return queueLegacyDueDigestSweepIfNeeded(user.workspaceId, {
    actorId: user.id,
    actorName: user.name || user.email,
  });
}
