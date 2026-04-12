import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/src/server/db/prisma";
import { AppError } from "@/src/server/api/errors";

const policyPrisma = prisma as any;

export const GOVERNANCE_DEFAULTS = {
  currentEnvironment: "development",
  sensitiveActionsRequireApproval: true,
  demoScenario: {
    id: "control-plane",
    name: "Control Plane Story",
    description: "Production is unhealthy, staging recovered, and labs remains noisy for stabilization demo steps.",
  },
} as const;

export const ENVIRONMENT_POLICY_DEFAULTS = {
  development: {
    minimumRoleForCommands: "operator",
    minimumRoleForApprovals: "approver",
    minimumRoleForGovernance: "admin",
    requireChecklistForResolved: false,
    requiredChecklistForResolved: ["owner_assigned", "followup_created", "summary_generated"],
    requireSummaryShareBeforeArchived: false,
    requireApprovalForResolved: false,
    requireApprovalForArchived: false,
    incidentApprovalReminderMinutes: 30,
    incidentApprovalEscalationMinutes: 60,
    incidentApprovalEscalationTarget: "team",
    incidentApprovalFinalEscalationMinutes: 120,
    incidentApprovalFinalEscalationTarget: "role:admin",
    incidentApprovalCapacityLimit: 3,
    autoPromoteApprovalRecommendations: false,
    autoPromoteRecommendationConfidence: 0.9,
    autoPromoteObservationHours: 24,
    autoPromoteCooldownHours: 72,
    trustDropAction: "notify",
    trustDropFollowupOwner: "Jamie Lead",
    promoteTrustDropToIncident: false,
  },
  staging: {
    minimumRoleForCommands: "operator",
    minimumRoleForApprovals: "approver",
    minimumRoleForGovernance: "admin",
    requireChecklistForResolved: true,
    requiredChecklistForResolved: ["owner_assigned", "followup_created", "summary_generated"],
    requireSummaryShareBeforeArchived: true,
    requireApprovalForResolved: false,
    requireApprovalForArchived: false,
    incidentApprovalReminderMinutes: 10,
    incidentApprovalEscalationMinutes: 20,
    incidentApprovalEscalationTarget: "role:admin",
    incidentApprovalFinalEscalationMinutes: 40,
    incidentApprovalFinalEscalationTarget: "team",
    incidentApprovalCapacityLimit: 2,
    autoPromoteApprovalRecommendations: false,
    autoPromoteRecommendationConfidence: 0.88,
    autoPromoteObservationHours: 24,
    autoPromoteCooldownHours: 72,
    trustDropAction: "digest",
    trustDropFollowupOwner: "Jamie Lead",
    promoteTrustDropToIncident: false,
  },
  production: {
    minimumRoleForCommands: "approver",
    minimumRoleForApprovals: "approver",
    minimumRoleForGovernance: "admin",
    requireChecklistForResolved: true,
    requiredChecklistForResolved: ["owner_assigned", "followup_created", "summary_generated", "shared_handoff"],
    requireSummaryShareBeforeArchived: true,
    requireApprovalForResolved: true,
    requireApprovalForArchived: true,
    incidentApprovalReminderMinutes: 5,
    incidentApprovalEscalationMinutes: 15,
    incidentApprovalEscalationTarget: "role:admin",
    incidentApprovalFinalEscalationMinutes: 30,
    incidentApprovalFinalEscalationTarget: "team",
    incidentApprovalCapacityLimit: 1,
    autoPromoteApprovalRecommendations: false,
    autoPromoteRecommendationConfidence: 0.92,
    autoPromoteObservationHours: 48,
    autoPromoteCooldownHours: 120,
    trustDropAction: "followup",
    trustDropFollowupOwner: "Jamie Lead",
    promoteTrustDropToIncident: true,
  },
} as const;

export const DEFAULT_POLICY_PLAYBOOK_PRESETS = [
  {
    id: "preset-dev",
    name: "Development",
    environment: "development",
    incidentApprovalCapacityLimit: 3,
    trustDropAction: "notify",
    requireApprovalForResolved: false,
    promoteTrustDropToIncident: false,
    description: "Balanced posture for local and internal iteration.",
    isPreset: true,
  },
  {
    id: "preset-prod",
    name: "Production",
    environment: "production",
    incidentApprovalCapacityLimit: 1,
    trustDropAction: "followup",
    requireApprovalForResolved: true,
    promoteTrustDropToIncident: true,
    description: "Stricter approval and escalation posture for customer-facing work.",
    isPreset: true,
  },
] as const;

type EnvironmentKey = keyof typeof ENVIRONMENT_POLICY_DEFAULTS;

function toEnvironment(value: string | null | undefined): EnvironmentKey {
  if (value === "production" || value === "staging") {
    return value;
  }
  return "development";
}

function overrideToObject(override: Record<string, unknown> | null | undefined) {
  if (!override) return null;
  return {
    environment: override.environment,
    incidentApprovalCapacityLimit: override.incidentApprovalCapacityLimit,
    incidentApprovalReminderMinutes: override.incidentApprovalReminderMinutes,
    trustDropAction: override.trustDropAction,
    trustDropFollowupOwner: override.trustDropFollowupOwner,
    requireApprovalForResolved: override.requireApprovalForResolved,
    requireApprovalForArchived: override.requireApprovalForArchived,
    promoteTrustDropToIncident: override.promoteTrustDropToIncident,
    sourceType: override.sourceType,
    sourcePlaybookId: override.sourcePlaybookId,
    updatedById: override.updatedById,
    updatedByName: override.updatedByName,
  };
}

function sanitizeOverride(input: Record<string, unknown>) {
  return {
    environment: typeof input.environment === "string" ? toEnvironment(input.environment) : null,
    incidentApprovalCapacityLimit:
      typeof input.incidentApprovalCapacityLimit === "number" ? input.incidentApprovalCapacityLimit : null,
    incidentApprovalReminderMinutes:
      typeof input.incidentApprovalReminderMinutes === "number" ? input.incidentApprovalReminderMinutes : null,
    trustDropAction: typeof input.trustDropAction === "string" ? input.trustDropAction : null,
    trustDropFollowupOwner: typeof input.trustDropFollowupOwner === "string" ? input.trustDropFollowupOwner : null,
    requireApprovalForResolved:
      typeof input.requireApprovalForResolved === "boolean" ? input.requireApprovalForResolved : null,
    requireApprovalForArchived:
      typeof input.requireApprovalForArchived === "boolean" ? input.requireApprovalForArchived : null,
    promoteTrustDropToIncident:
      typeof input.promoteTrustDropToIncident === "boolean" ? input.promoteTrustDropToIncident : null,
  };
}

function cleanedData<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== null && item !== undefined)) as T;
}

export async function ensurePolicyGovernanceState() {
  await policyPrisma.platformGovernanceSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      currentEnvironment: GOVERNANCE_DEFAULTS.currentEnvironment,
      sensitiveActionsRequireApproval: GOVERNANCE_DEFAULTS.sensitiveActionsRequireApproval,
      demoScenarioId: GOVERNANCE_DEFAULTS.demoScenario.id,
      demoScenarioName: GOVERNANCE_DEFAULTS.demoScenario.name,
      demoScenarioDescription: GOVERNANCE_DEFAULTS.demoScenario.description,
    },
    update: {},
  });

  await Promise.all(
    (Object.entries(ENVIRONMENT_POLICY_DEFAULTS) as Array<[EnvironmentKey, (typeof ENVIRONMENT_POLICY_DEFAULTS)[EnvironmentKey]]>).map(
      ([environment, defaults]) =>
        policyPrisma.environmentPolicy.upsert({
          where: { environment },
          create: { environment, ...defaults },
          update: {},
        }),
    ),
  );

  await policyPrisma.policyPlaybook.createMany({
    data: DEFAULT_POLICY_PLAYBOOK_PRESETS.map((preset) => ({ ...preset })),
    skipDuplicates: true,
  });
}

export async function getPolicyGovernanceSnapshot() {
  await ensurePolicyGovernanceState();

  const [settings, environmentPolicies, workspaceOverrides, playbooks, rollouts] = await Promise.all([
    policyPrisma.platformGovernanceSettings.findUnique({ where: { id: "default" } }),
    policyPrisma.environmentPolicy.findMany({ orderBy: { environment: "asc" } }),
    policyPrisma.workspacePolicyOverride.findMany({
      include: { sourcePlaybook: true, workspace: { select: { name: true } } },
    }),
    policyPrisma.policyPlaybook.findMany({ orderBy: [{ isPreset: "desc" }, { environment: "asc" }, { name: "asc" }] }),
    policyPrisma.policyPlaybookRollout.findMany({
      include: {
        playbook: true,
        workspaces: {
          orderBy: { workspaceName: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return {
    currentEnvironment: toEnvironment(settings?.currentEnvironment),
    sensitiveActionsRequireApproval: Boolean(settings?.sensitiveActionsRequireApproval),
    demoScenario:
      settings?.demoScenarioId && settings?.demoScenarioName
        ? {
            id: settings.demoScenarioId,
            name: settings.demoScenarioName,
            description: settings.demoScenarioDescription || "",
          }
        : null,
    environmentPolicies: Object.fromEntries(
      environmentPolicies.map((policy: any) => [
        policy.environment,
        {
          minimumRoleForCommands: policy.minimumRoleForCommands,
          minimumRoleForApprovals: policy.minimumRoleForApprovals,
          minimumRoleForGovernance: policy.minimumRoleForGovernance,
          requireChecklistForResolved: policy.requireChecklistForResolved,
          requiredChecklistForResolved: policy.requiredChecklistForResolved,
          requireSummaryShareBeforeArchived: policy.requireSummaryShareBeforeArchived,
          requireApprovalForResolved: policy.requireApprovalForResolved,
          requireApprovalForArchived: policy.requireApprovalForArchived,
          incidentApprovalReminderMinutes: policy.incidentApprovalReminderMinutes,
          incidentApprovalEscalationMinutes: policy.incidentApprovalEscalationMinutes,
          incidentApprovalEscalationTarget: policy.incidentApprovalEscalationTarget,
          incidentApprovalFinalEscalationMinutes: policy.incidentApprovalFinalEscalationMinutes,
          incidentApprovalFinalEscalationTarget: policy.incidentApprovalFinalEscalationTarget,
          incidentApprovalCapacityLimit: policy.incidentApprovalCapacityLimit,
          autoPromoteApprovalRecommendations: policy.autoPromoteApprovalRecommendations,
          autoPromoteRecommendationConfidence: policy.autoPromoteRecommendationConfidence,
          autoPromoteObservationHours: policy.autoPromoteObservationHours,
          autoPromoteCooldownHours: policy.autoPromoteCooldownHours,
          trustDropAction: policy.trustDropAction,
          trustDropFollowupOwner: policy.trustDropFollowupOwner,
          promoteTrustDropToIncident: policy.promoteTrustDropToIncident,
        },
      ]),
    ),
    workspacePolicyOverrides: Object.fromEntries(
      workspaceOverrides.map((override: any) => [override.workspaceId, cleanedData(overrideToObject(override) || {})]),
    ),
    workspacePolicyOverrideRows: workspaceOverrides,
    workspacePolicyPlaybooks: playbooks.filter((playbook: any) => !playbook.isPreset).map((playbook: any) => ({
      id: playbook.id,
      name: playbook.name,
      environment: playbook.environment,
      incidentApprovalCapacityLimit: playbook.incidentApprovalCapacityLimit,
      trustDropAction: playbook.trustDropAction,
      requireApprovalForResolved: playbook.requireApprovalForResolved,
      promoteTrustDropToIncident: playbook.promoteTrustDropToIncident,
      description: playbook.description,
    })),
    defaultPolicyPlaybookPresets: playbooks.filter((playbook: any) => playbook.isPreset).map((playbook: any) => ({
      id: playbook.id,
      name: playbook.name,
      environment: playbook.environment,
      incidentApprovalCapacityLimit: playbook.incidentApprovalCapacityLimit,
      trustDropAction: playbook.trustDropAction,
      requireApprovalForResolved: playbook.requireApprovalForResolved,
      promoteTrustDropToIncident: playbook.promoteTrustDropToIncident,
      description: playbook.description,
    })),
    workspacePolicyPlaybookRollouts: rollouts.map((rollout: any) => ({
      id: rollout.id,
      playbookId: rollout.playbookId,
      playbookName: rollout.playbook.name,
      environment: rollout.environment,
      workspaceCount: rollout.workspaceCount,
      workspaceIds: rollout.workspaces.map((item: any) => item.workspaceId),
      workspaceNames: rollout.workspaces.map((item: any) => item.workspaceName),
      appliedAt: rollout.createdAt.toISOString(),
      appliedById: rollout.appliedById,
      appliedByName: rollout.appliedByName,
      rolledBackAt: rollout.rolledBackAt?.toISOString() ?? null,
    })),
  };
}

export async function updateGovernanceSettings(governance: Record<string, unknown>) {
  await ensurePolicyGovernanceState();

  const currentEnvironment = toEnvironment(typeof governance.currentEnvironment === "string" ? governance.currentEnvironment : undefined);
  const sensitiveActionsRequireApproval = Boolean(governance.sensitiveActionsRequireApproval);
  const environmentPoliciesInput =
    governance.environmentPolicies && typeof governance.environmentPolicies === "object"
      ? (governance.environmentPolicies as Record<string, Record<string, unknown>>)
      : {};

  await policyPrisma.$transaction(async (tx: any) => {
    await tx.platformGovernanceSettings.update({
      where: { id: "default" },
      data: {
        currentEnvironment,
        sensitiveActionsRequireApproval,
      },
    });

    for (const environment of Object.keys(ENVIRONMENT_POLICY_DEFAULTS) as EnvironmentKey[]) {
      const defaults = ENVIRONMENT_POLICY_DEFAULTS[environment];
      const next = environmentPoliciesInput[environment] || {};
      await tx.environmentPolicy.upsert({
        where: { environment },
        create: {
          environment,
          ...defaults,
          ...cleanedData({
            minimumRoleForCommands: typeof next.minimumRoleForCommands === "string" ? next.minimumRoleForCommands : undefined,
            minimumRoleForApprovals: typeof next.minimumRoleForApprovals === "string" ? next.minimumRoleForApprovals : undefined,
            minimumRoleForGovernance: typeof next.minimumRoleForGovernance === "string" ? next.minimumRoleForGovernance : undefined,
            requireChecklistForResolved:
              typeof next.requireChecklistForResolved === "boolean" ? next.requireChecklistForResolved : undefined,
            requiredChecklistForResolved:
              Array.isArray(next.requiredChecklistForResolved) ? next.requiredChecklistForResolved.filter((item): item is string => typeof item === "string") : undefined,
            requireSummaryShareBeforeArchived:
              typeof next.requireSummaryShareBeforeArchived === "boolean" ? next.requireSummaryShareBeforeArchived : undefined,
            requireApprovalForResolved:
              typeof next.requireApprovalForResolved === "boolean" ? next.requireApprovalForResolved : undefined,
            requireApprovalForArchived:
              typeof next.requireApprovalForArchived === "boolean" ? next.requireApprovalForArchived : undefined,
            incidentApprovalReminderMinutes:
              typeof next.incidentApprovalReminderMinutes === "number" ? next.incidentApprovalReminderMinutes : undefined,
            incidentApprovalEscalationMinutes:
              typeof next.incidentApprovalEscalationMinutes === "number" ? next.incidentApprovalEscalationMinutes : undefined,
            incidentApprovalEscalationTarget:
              typeof next.incidentApprovalEscalationTarget === "string" ? next.incidentApprovalEscalationTarget : undefined,
            incidentApprovalFinalEscalationMinutes:
              typeof next.incidentApprovalFinalEscalationMinutes === "number" ? next.incidentApprovalFinalEscalationMinutes : undefined,
            incidentApprovalFinalEscalationTarget:
              typeof next.incidentApprovalFinalEscalationTarget === "string" ? next.incidentApprovalFinalEscalationTarget : undefined,
            incidentApprovalCapacityLimit:
              typeof next.incidentApprovalCapacityLimit === "number" ? next.incidentApprovalCapacityLimit : undefined,
            autoPromoteApprovalRecommendations:
              typeof next.autoPromoteApprovalRecommendations === "boolean" ? next.autoPromoteApprovalRecommendations : undefined,
            autoPromoteRecommendationConfidence:
              typeof next.autoPromoteRecommendationConfidence === "number" ? next.autoPromoteRecommendationConfidence : undefined,
            autoPromoteObservationHours:
              typeof next.autoPromoteObservationHours === "number" ? next.autoPromoteObservationHours : undefined,
            autoPromoteCooldownHours:
              typeof next.autoPromoteCooldownHours === "number" ? next.autoPromoteCooldownHours : undefined,
            trustDropAction: typeof next.trustDropAction === "string" ? next.trustDropAction : undefined,
            trustDropFollowupOwner:
              typeof next.trustDropFollowupOwner === "string" ? next.trustDropFollowupOwner : undefined,
            promoteTrustDropToIncident:
              typeof next.promoteTrustDropToIncident === "boolean" ? next.promoteTrustDropToIncident : undefined,
          }),
        },
        update: cleanedData({
          minimumRoleForCommands: typeof next.minimumRoleForCommands === "string" ? next.minimumRoleForCommands : undefined,
          minimumRoleForApprovals: typeof next.minimumRoleForApprovals === "string" ? next.minimumRoleForApprovals : undefined,
          minimumRoleForGovernance: typeof next.minimumRoleForGovernance === "string" ? next.minimumRoleForGovernance : undefined,
          requireChecklistForResolved:
            typeof next.requireChecklistForResolved === "boolean" ? next.requireChecklistForResolved : undefined,
          requiredChecklistForResolved:
            Array.isArray(next.requiredChecklistForResolved) ? next.requiredChecklistForResolved.filter((item): item is string => typeof item === "string") : undefined,
          requireSummaryShareBeforeArchived:
            typeof next.requireSummaryShareBeforeArchived === "boolean" ? next.requireSummaryShareBeforeArchived : undefined,
          requireApprovalForResolved:
            typeof next.requireApprovalForResolved === "boolean" ? next.requireApprovalForResolved : undefined,
          requireApprovalForArchived:
            typeof next.requireApprovalForArchived === "boolean" ? next.requireApprovalForArchived : undefined,
          incidentApprovalReminderMinutes:
            typeof next.incidentApprovalReminderMinutes === "number" ? next.incidentApprovalReminderMinutes : undefined,
          incidentApprovalEscalationMinutes:
            typeof next.incidentApprovalEscalationMinutes === "number" ? next.incidentApprovalEscalationMinutes : undefined,
          incidentApprovalEscalationTarget:
            typeof next.incidentApprovalEscalationTarget === "string" ? next.incidentApprovalEscalationTarget : undefined,
          incidentApprovalFinalEscalationMinutes:
            typeof next.incidentApprovalFinalEscalationMinutes === "number" ? next.incidentApprovalFinalEscalationMinutes : undefined,
          incidentApprovalFinalEscalationTarget:
            typeof next.incidentApprovalFinalEscalationTarget === "string" ? next.incidentApprovalFinalEscalationTarget : undefined,
          incidentApprovalCapacityLimit:
            typeof next.incidentApprovalCapacityLimit === "number" ? next.incidentApprovalCapacityLimit : undefined,
          autoPromoteApprovalRecommendations:
            typeof next.autoPromoteApprovalRecommendations === "boolean" ? next.autoPromoteApprovalRecommendations : undefined,
          autoPromoteRecommendationConfidence:
            typeof next.autoPromoteRecommendationConfidence === "number" ? next.autoPromoteRecommendationConfidence : undefined,
          autoPromoteObservationHours:
            typeof next.autoPromoteObservationHours === "number" ? next.autoPromoteObservationHours : undefined,
          autoPromoteCooldownHours:
            typeof next.autoPromoteCooldownHours === "number" ? next.autoPromoteCooldownHours : undefined,
          trustDropAction: typeof next.trustDropAction === "string" ? next.trustDropAction : undefined,
          trustDropFollowupOwner:
            typeof next.trustDropFollowupOwner === "string" ? next.trustDropFollowupOwner : undefined,
          promoteTrustDropToIncident:
            typeof next.promoteTrustDropToIncident === "boolean" ? next.promoteTrustDropToIncident : undefined,
        }),
      });
    }
  });

  return getPolicyGovernanceSnapshot();
}

export async function saveWorkspacePolicyOverride(
  workspaceId: string,
  policyOverride?: Record<string, unknown>,
  reset?: boolean,
  actor?: { id?: string | null; name?: string | null; email?: string | null } | null,
) {
  await ensurePolicyGovernanceState();

  if (reset) {
    await policyPrisma.workspacePolicyOverride.deleteMany({ where: { workspaceId } });
    return getPolicyGovernanceSnapshot();
  }

  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId }, select: { id: true } });
  if (!workspace) {
    throw new AppError(404, "workspace_not_found", "Workspace not found.");
  }

  const next = sanitizeOverride(policyOverride || {});
  await policyPrisma.workspacePolicyOverride.upsert({
    where: { workspaceId },
    create: {
      workspaceId,
      ...cleanedData(next),
      sourceType: "manual",
      updatedById: actor?.id || null,
      updatedByName: actor?.name || actor?.email || null,
    },
    update: {
      ...cleanedData(next),
      sourceType: "manual",
      sourcePlaybookId: null,
      updatedById: actor?.id || null,
      updatedByName: actor?.name || actor?.email || null,
    },
  });
  return getPolicyGovernanceSnapshot();
}

export async function savePolicyPlaybook(
  playbook: {
    id?: string;
    name: string;
    environment: string;
    incidentApprovalCapacityLimit: number;
    trustDropAction: string;
    requireApprovalForResolved: boolean;
    promoteTrustDropToIncident: boolean;
  },
  actor?: { id?: string | null; name?: string | null; email?: string | null } | null,
) {
  await ensurePolicyGovernanceState();
  const id = playbook.id || `playbook_${randomUUID()}`;
  const data = {
    id,
    name: playbook.name.trim(),
    environment: toEnvironment(playbook.environment),
    incidentApprovalCapacityLimit: playbook.incidentApprovalCapacityLimit,
    trustDropAction: playbook.trustDropAction,
    requireApprovalForResolved: playbook.requireApprovalForResolved,
    promoteTrustDropToIncident: playbook.promoteTrustDropToIncident,
    isPreset: false,
    createdById: actor?.id || null,
    createdByName: actor?.name || actor?.email || null,
  };

  await policyPrisma.policyPlaybook.upsert({
    where: { id },
    create: data,
    update: {
      name: data.name,
      environment: data.environment,
      incidentApprovalCapacityLimit: data.incidentApprovalCapacityLimit,
      trustDropAction: data.trustDropAction,
      requireApprovalForResolved: data.requireApprovalForResolved,
      promoteTrustDropToIncident: data.promoteTrustDropToIncident,
      createdById: data.createdById,
      createdByName: data.createdByName,
    },
  });

  return getPolicyGovernanceSnapshot();
}

export async function deletePolicyPlaybook(playbookId: string) {
  await ensurePolicyGovernanceState();
  const playbook = await policyPrisma.policyPlaybook.findUnique({ where: { id: playbookId } });
  if (!playbook || playbook.isPreset) {
    throw new AppError(404, "policy_playbook_not_found", "Policy playbook not found.");
  }
  await policyPrisma.policyPlaybook.delete({ where: { id: playbookId } });
  return getPolicyGovernanceSnapshot();
}

export async function applyPolicyOverrideToWorkspaces(input: {
  workspaceIds: string[];
  override: Record<string, unknown>;
  actor?: { id?: string | null; name?: string | null; email?: string | null } | null;
}) {
  await Promise.all(
    input.workspaceIds.map((workspaceId) =>
      saveWorkspacePolicyOverride(workspaceId, input.override, false, input.actor),
    ),
  );
  return getPolicyGovernanceSnapshot();
}

export async function resetPolicyOverrideForWorkspaces(workspaceIds: string[]) {
  await policyPrisma.workspacePolicyOverride.deleteMany({ where: { workspaceId: { in: workspaceIds } } });
  return getPolicyGovernanceSnapshot();
}

export async function applyPolicyPlaybookToWorkspaces(input: {
  playbookId: string;
  workspaceIds: string[];
  actor?: { id?: string | null; name?: string | null; email?: string | null } | null;
}) {
  await ensurePolicyGovernanceState();
  const playbook = await policyPrisma.policyPlaybook.findUnique({ where: { id: input.playbookId } });
  if (!playbook) {
    throw new AppError(404, "policy_playbook_not_found", "Policy playbook not found.");
  }

  const workspaces = await (prisma as any).workspace.findMany({
    where: { id: { in: input.workspaceIds } },
    include: { policyOverride: true },
  });
  if (!workspaces.length) {
    return getPolicyGovernanceSnapshot();
  }

  const rollout = await policyPrisma.policyPlaybookRollout.create({
    data: {
      playbookId: playbook.id,
      environment: playbook.environment,
      workspaceCount: workspaces.length,
      appliedById: input.actor?.id || null,
      appliedByName: input.actor?.name || input.actor?.email || null,
    },
  });

  await policyPrisma.$transaction(async (tx: any) => {
    for (const workspace of workspaces) {
      const beforeOverride = overrideToObject(workspace.policyOverride);
      const afterOverride = cleanedData({
        environment: playbook.environment,
        incidentApprovalCapacityLimit: playbook.incidentApprovalCapacityLimit,
        trustDropAction: playbook.trustDropAction,
        requireApprovalForResolved: playbook.requireApprovalForResolved,
        promoteTrustDropToIncident: playbook.promoteTrustDropToIncident,
        sourceType: playbook.isPreset ? "preset" : "playbook",
        sourcePlaybookId: playbook.id,
        updatedById: input.actor?.id || null,
        updatedByName: input.actor?.name || input.actor?.email || null,
      });

      await tx.workspacePolicyOverride.upsert({
        where: { workspaceId: workspace.id },
        create: {
          workspaceId: workspace.id,
          ...afterOverride,
        },
        update: afterOverride,
      });

      await tx.policyPlaybookRolloutWorkspace.create({
        data: {
          rolloutId: rollout.id,
          workspaceId: workspace.id,
          workspaceName: workspace.name,
          beforeOverride: beforeOverride as Prisma.InputJsonValue | undefined,
          afterOverride: afterOverride as Prisma.InputJsonValue,
        },
      });
    }
  });

  return getPolicyGovernanceSnapshot();
}

export async function rollbackPolicyPlaybookRollout(rolloutId: string) {
  await ensurePolicyGovernanceState();
  const rollout = await policyPrisma.policyPlaybookRollout.findUnique({
    where: { id: rolloutId },
    include: { workspaces: true },
  });
  if (!rollout) {
    throw new AppError(404, "policy_rollout_not_found", "Policy rollout not found.");
  }

  await policyPrisma.$transaction(async (tx: any) => {
    for (const item of rollout.workspaces) {
      const before = item.beforeOverride && typeof item.beforeOverride === "object"
        ? (item.beforeOverride as Record<string, unknown>)
        : null;

      if (!before || Object.keys(before).length === 0) {
        await tx.workspacePolicyOverride.deleteMany({ where: { workspaceId: item.workspaceId } });
        continue;
      }

      await tx.workspacePolicyOverride.upsert({
        where: { workspaceId: item.workspaceId },
        create: {
          workspaceId: item.workspaceId,
          ...cleanedData(sanitizeOverride(before)),
          sourceType: typeof before.sourceType === "string" ? before.sourceType : null,
          sourcePlaybookId: typeof before.sourcePlaybookId === "string" ? before.sourcePlaybookId : null,
          updatedById: typeof before.updatedById === "string" ? before.updatedById : null,
          updatedByName: typeof before.updatedByName === "string" ? before.updatedByName : null,
        },
        update: {
          ...cleanedData(sanitizeOverride(before)),
          sourceType: typeof before.sourceType === "string" ? before.sourceType : null,
          sourcePlaybookId: typeof before.sourcePlaybookId === "string" ? before.sourcePlaybookId : null,
          updatedById: typeof before.updatedById === "string" ? before.updatedById : null,
          updatedByName: typeof before.updatedByName === "string" ? before.updatedByName : null,
        },
      });
    }

    await tx.policyPlaybookRollout.update({
      where: { id: rolloutId },
      data: { rolledBackAt: new Date() },
    });
  });

  return getPolicyGovernanceSnapshot();
}
