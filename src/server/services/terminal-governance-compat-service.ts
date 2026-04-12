import { createRequire } from "node:module";
import type { SessionUser } from "@/src/lib/types";
import { executeOperationsAction } from "@/src/server/services/operations-action-service";
import {
  getPolicyGovernanceSnapshot,
  updateGovernanceSettings,
} from "@/src/server/services/policy-governance-service";

const require = createRequire(import.meta.url);

const {
  loadCollaborationState,
  updateGovernance,
  getDigestWorkspaceState,
  appendDigestWorkspaceEvent,
} = require("../../../services/collaboration");
const { appendAuditEvent } = require("../../../services/auditTrail");

const defaultRuntimeDeps = {
  loadCollaborationState,
  updateGovernance,
  getDigestWorkspaceState,
  appendDigestWorkspaceEvent,
  appendAuditEvent,
};

const runtimeDeps = { ...defaultRuntimeDeps };

const terminalGovernanceCompatActions = new Set([
  "collaboration:apply-approval-policy-recommendation",
  "collaboration:promote-approval-policy-recommendation",
  "collaboration:acknowledge-trust-alert",
  "collaboration:restart-approval-recommendation-observation",
  "collaboration:extend-approval-recommendation-cooldown",
]);

type GovernanceCompatInput = {
  action: string;
  payload?: Record<string, unknown>;
};

type GovernanceCompatResult =
  | { ok: true; output: string }
  | { ok: false; error: string };

function nowIso() {
  return new Date().toISOString();
}

function normalizeGovernanceCollections(governance: Record<string, unknown> | null | undefined) {
  return {
    appliedApprovalPolicies: Array.isArray(governance?.appliedApprovalPolicies)
      ? governance?.appliedApprovalPolicies
      : [],
    approvalRecommendationObservations: Array.isArray(governance?.approvalRecommendationObservations)
      ? governance?.approvalRecommendationObservations
      : [],
    approvalTrustAlertAcks: Array.isArray(governance?.approvalTrustAlertAcks) ? governance?.approvalTrustAlertAcks : [],
  };
}

function recommendationActionLabel(action: string) {
  return action === "collaboration:promote-approval-policy-recommendation" ? "promoted" : "applied";
}

function buildAppliedPolicyEntry(
  payload: Record<string, unknown>,
  actor: Pick<SessionUser, "id" | "name" | "email">,
  beforeSnapshot: { capacityLimit: number | null; backupApproverTarget: string | null },
  outcome: { environment: string; automatic?: boolean; capacityLimit?: number | null; backupApproverTarget?: string | null },
) {
  const recommendationId = String(payload.recommendationId || payload.recommendationKind || "approval-policy");
  return {
    id: `approval_policy_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    recommendationId,
    recommendationKind: String(payload.recommendationKind || "policy"),
    environment: outcome.environment,
    target: String(payload.target || "") || null,
    workspaceId: String(payload.workspaceId || "") || null,
    title: String(payload.recommendationTitle || recommendationId || "Approval policy change"),
    appliedAt: nowIso(),
    appliedById: actor.id,
    appliedByName: actor.name || actor.email || "Unknown user",
    appliedAutomatically: Boolean(outcome.automatic),
    effectSummary:
      outcome.backupApproverTarget && payload.workspaceId
        ? `Assigned ${outcome.backupApproverTarget} as the backup approver for ${payload.workspaceId}.`
        : `Set the ${outcome.environment} approval capacity limit to ${outcome.capacityLimit || 1}.`,
    metricsSnapshot: {
      targetPressure: null,
      targetThroughput: null,
      workspaceThroughput: null,
    },
    beforeSnapshot,
    afterSnapshot: {
      capacityLimit: outcome.capacityLimit || null,
      backupApproverTarget: outcome.backupApproverTarget || null,
    },
  };
}

async function acknowledgeTrustAlert(
  payload: Record<string, unknown>,
  actor: Pick<SessionUser, "id" | "name" | "email">,
): Promise<GovernanceCompatResult> {
  const alertId = String(payload.alertId || "").trim();
  if (!alertId) {
    return { ok: false, error: "Trust alert ID is required." };
  }

  const collaboration = runtimeDeps.loadCollaborationState();
  const governance = collaboration.governance || {};
  const current = normalizeGovernanceCollections(governance);
  const nextEntry = {
    alertId,
    acknowledgedAt: nowIso(),
    acknowledgedById: actor.id,
    acknowledgedByName: actor.name || actor.email || "Unknown user",
  };

  runtimeDeps.updateGovernance({
    ...governance,
    approvalTrustAlertAcks: [
      nextEntry,
      ...current.approvalTrustAlertAcks.filter((item: any) => String(item.alertId) !== alertId),
    ].slice(0, 100),
  });

  runtimeDeps.appendAuditEvent({
    type: "collaboration:acknowledge-trust-alert",
    message: `Acknowledged trust alert ${alertId}.`,
    payload: { ...payload, actorId: actor.id },
  });

  return { ok: true, output: `Acknowledged trust alert ${alertId}.` };
}

async function restartRecommendationObservation(
  payload: Record<string, unknown>,
  actor: Pick<SessionUser, "id" | "name" | "email">,
): Promise<GovernanceCompatResult> {
  const recommendationId = String(payload.recommendationId || "").trim();
  if (!recommendationId) {
    return { ok: false, error: "Recommendation ID is required." };
  }

  const collaboration = runtimeDeps.loadCollaborationState();
  const governance = collaboration.governance || {};
  const current = normalizeGovernanceCollections(governance);
  const stamp = nowIso();
  let found = false;
  const next = current.approvalRecommendationObservations.map((item: any) => {
    if (String(item.recommendationId) !== recommendationId) {
      return item;
    }
    found = true;
    return {
      ...item,
      firstObservedAt: stamp,
      eligibleSinceAt: stamp,
      lastObservedAt: stamp,
      cooldownUntil: null,
      status: "observing",
    };
  });

  if (!found) {
    return { ok: false, error: `Recommendation observation not found: ${recommendationId}.` };
  }

  runtimeDeps.updateGovernance({
    ...governance,
    approvalRecommendationObservations: next,
    approvalTrustAlertAcks: current.approvalTrustAlertAcks.filter(
      (item: any) => !String(item.alertId || "").includes(recommendationId),
    ),
  });

  runtimeDeps.appendAuditEvent({
    type: "collaboration:restart-approval-recommendation-observation",
    message: `Restarted observation for ${recommendationId}.`,
    payload: { ...payload, actorId: actor.id },
  });

  return { ok: true, output: `Restarted observation for ${recommendationId}.` };
}

async function extendRecommendationCooldown(
  payload: Record<string, unknown>,
  actor: Pick<SessionUser, "id" | "name" | "email">,
): Promise<GovernanceCompatResult> {
  const recommendationId = String(payload.recommendationId || "").trim();
  const hours = Math.max(1, Number(payload.hours || 24));
  if (!recommendationId) {
    return { ok: false, error: "Recommendation ID is required." };
  }

  const collaboration = runtimeDeps.loadCollaborationState();
  const governance = collaboration.governance || {};
  const current = normalizeGovernanceCollections(governance);
  const observedAt = nowIso();
  const cooldownUntil = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
  let found = false;
  const next = current.approvalRecommendationObservations.map((item: any) => {
    if (String(item.recommendationId) !== recommendationId) {
      return item;
    }
    found = true;
    return {
      ...item,
      cooldownUntil,
      lastObservedAt: observedAt,
      status: "cooldown",
    };
  });

  if (!found) {
    return { ok: false, error: `Recommendation observation not found: ${recommendationId}.` };
  }

  runtimeDeps.updateGovernance({
    ...governance,
    approvalRecommendationObservations: next,
    approvalTrustAlertAcks: current.approvalTrustAlertAcks.filter(
      (item: any) => !String(item.alertId || "").includes(recommendationId),
    ),
  });

  runtimeDeps.appendAuditEvent({
    type: "collaboration:extend-approval-recommendation-cooldown",
    message: `Extended cooldown for ${recommendationId}.`,
    payload: { ...payload, actorId: actor.id },
  });

  return { ok: true, output: `Extended cooldown for ${recommendationId} by ${hours} hours.` };
}

async function applyApprovalPolicyRecommendation(
  action: string,
  payload: Record<string, unknown>,
  actor: Pick<SessionUser, "id" | "workspaceId" | "name" | "email" | "role">,
): Promise<GovernanceCompatResult> {
  const persistPromotion = action === "collaboration:promote-approval-policy-recommendation";
  const recommendationKind = String(payload.recommendationKind || "").trim();
  const recommendationId = String(payload.recommendationId || recommendationKind || "approval-policy");
  const workspaceId = String(payload.workspaceId || "").trim();
  const environment = String(payload.environment || "").trim();
  const governance = await getPolicyGovernanceSnapshot();
  const currentEnvironment = environment || governance.currentEnvironment || "development";
  const environmentPolicy = {
    ...(governance.environmentPolicies?.[currentEnvironment] || {}),
  } as Record<string, unknown>;
  const beforeSnapshot = {
    capacityLimit: Math.max(1, Number(environmentPolicy.incidentApprovalCapacityLimit || 1)),
    backupApproverTarget:
      workspaceId ? String(runtimeDeps.getDigestWorkspaceState(workspaceId).backupApproverTarget || "") || null : null,
  };

  if (recommendationKind === "workspace" && workspaceId) {
    const backupApproverTarget = String(payload.suggestedBackupApproverTarget || "").trim();
    if (!backupApproverTarget) {
      return { ok: false, error: "A backup approver target is required for workspace recommendations." };
    }

    await executeOperationsAction(
      {
        action: "collaboration:automation-assign-backup-approver",
        payload: { workspaceId, backupApproverTarget },
      },
      actor,
    );

    runtimeDeps.appendDigestWorkspaceEvent(workspaceId, {
      type: persistPromotion ? "approval-policy-promoted" : "approval-policy-recommendation-applied",
      message: `${persistPromotion ? "Promoted" : "Applied"} policy recommendation ${recommendationId}.`,
      actorId: actor.id,
      actorName: actor.name || actor.email || "Unknown user",
      note: `Assigned ${backupApproverTarget} as the backup approver.`,
    });

    if (persistPromotion) {
      const collaboration = runtimeDeps.loadCollaborationState();
      const current = normalizeGovernanceCollections(collaboration.governance || {});
      runtimeDeps.updateGovernance({
        ...(collaboration.governance || {}),
        appliedApprovalPolicies: [
          buildAppliedPolicyEntry(payload, actor, beforeSnapshot, {
            environment: currentEnvironment,
            backupApproverTarget,
          }),
          ...current.appliedApprovalPolicies,
        ].slice(0, 20),
      });
    }

    runtimeDeps.appendAuditEvent({
      type: action,
      message: `${recommendationActionLabel(action)} workspace approval recommendation for ${workspaceId}.`,
      payload: { recommendationId, recommendationKind, workspaceId, backupApproverTarget, actorId: actor.id, beforeSnapshot },
    });

    return { ok: true, output: `Assigned ${backupApproverTarget} as the backup approver for ${workspaceId}.` };
  }

  const suggestedCapacityLimit = Math.max(
    1,
    Number(payload.suggestedCapacityLimit || environmentPolicy.incidentApprovalCapacityLimit || 1),
  );

  const nextGovernance = {
    ...governance,
    environmentPolicies: {
      ...(governance.environmentPolicies || {}),
      [currentEnvironment]: {
        ...(governance.environmentPolicies?.[currentEnvironment] || {}),
        incidentApprovalCapacityLimit: suggestedCapacityLimit,
      },
    },
  };
  await updateGovernanceSettings(nextGovernance);

  if (persistPromotion) {
    const collaboration = runtimeDeps.loadCollaborationState();
    const current = normalizeGovernanceCollections(collaboration.governance || {});
    runtimeDeps.updateGovernance({
      ...(collaboration.governance || {}),
      appliedApprovalPolicies: [
        buildAppliedPolicyEntry(payload, actor, beforeSnapshot, {
          environment: currentEnvironment,
          capacityLimit: suggestedCapacityLimit,
        }),
        ...current.appliedApprovalPolicies,
      ].slice(0, 20),
    });
  }

  if (workspaceId) {
    runtimeDeps.appendDigestWorkspaceEvent(workspaceId, {
      type: persistPromotion ? "approval-policy-promoted" : "approval-policy-recommendation-applied",
      message: `${persistPromotion ? "Promoted" : "Applied"} policy recommendation ${recommendationId}.`,
      actorId: actor.id,
      actorName: actor.name || actor.email || "Unknown user",
      note: `Set ${currentEnvironment} approval capacity limit to ${suggestedCapacityLimit}.`,
    });
  }

  runtimeDeps.appendAuditEvent({
    type: action,
    message: `${recommendationActionLabel(action)} approval policy recommendation.`,
    payload: {
      recommendationId,
      recommendationKind,
      environment: currentEnvironment,
      workspaceId: workspaceId || null,
      target: String(payload.target || "") || null,
      suggestedCapacityLimit,
      actorId: actor.id,
      beforeSnapshot,
    },
  });

  return { ok: true, output: `Set the ${currentEnvironment} approval capacity limit to ${suggestedCapacityLimit}.` };
}

export function canHandleTerminalGovernanceCompatAction(action: string) {
  return terminalGovernanceCompatActions.has(action);
}

export function __setTerminalGovernanceCompatDepsForTest(overrides: Partial<typeof defaultRuntimeDeps>) {
  Object.assign(runtimeDeps, overrides);
}

export function __resetTerminalGovernanceCompatDepsForTest() {
  Object.assign(runtimeDeps, defaultRuntimeDeps);
}

export async function executeTerminalGovernanceCompatAction(
  input: GovernanceCompatInput,
  actor: Pick<SessionUser, "id" | "workspaceId" | "name" | "email" | "role">,
): Promise<GovernanceCompatResult> {
  const payload = input.payload || {};

  if (input.action === "collaboration:acknowledge-trust-alert") {
    return acknowledgeTrustAlert(payload, actor);
  }

  if (input.action === "collaboration:restart-approval-recommendation-observation") {
    return restartRecommendationObservation(payload, actor);
  }

  if (input.action === "collaboration:extend-approval-recommendation-cooldown") {
    return extendRecommendationCooldown(payload, actor);
  }

  if (
    input.action === "collaboration:apply-approval-policy-recommendation" ||
    input.action === "collaboration:promote-approval-policy-recommendation"
  ) {
    return applyApprovalPolicyRecommendation(input.action, payload, actor);
  }

  return { ok: false, error: `Unsupported governance compatibility action: ${input.action}.` };
}
