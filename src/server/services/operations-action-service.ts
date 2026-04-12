import { z } from "zod";
import { prisma } from "@/src/server/db/prisma";
import { AppError } from "@/src/server/api/errors";
import {
  applyPolicyOverrideToWorkspaces,
  applyPolicyPlaybookToWorkspaces,
  deletePolicyPlaybook,
  getPolicyGovernanceSnapshot,
  resetPolicyOverrideForWorkspaces,
  rollbackPolicyPlaybookRollout,
  savePolicyPlaybook,
} from "@/src/server/services/policy-governance-service";
import {
  SUPPORTED_INCIDENT_STATUSES,
  buildDefaultChecklist,
  ensureWorkspaceOperationsState,
  recordWorkspaceOperationActivity,
  updateWorkspaceChecklistItem,
} from "@/src/server/services/workspace-operations-state-service";
import type { SessionUser } from "@/src/lib/types";

const statusFilterSchema = z.array(z.enum(["error", "stalled", "healthy", "resolved", "archived"])).min(1);
const workspaceIdSchema = z.string().min(1);
const targetSchema = z.string().trim().min(1);

const actionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("approval:approve"),
    payload: z.object({ approvalId: z.string().min(1) }),
  }),
  z.object({
    action: z.literal("approval:reject"),
    payload: z.object({ approvalId: z.string().min(1), note: z.string().optional() }),
  }),
  z.object({
    action: z.literal("approval:reassign-target"),
    payload: z.object({ approvalId: z.string().min(1), approverTarget: targetSchema }),
  }),
  z.object({
    action: z.literal("approval:take-over"),
    payload: z.object({ approvalId: z.string().min(1) }),
  }),
  z.object({
    action: z.literal("approval:bulk-reassign-target"),
    payload: z.object({ currentTarget: targetSchema, approverTarget: targetSchema }),
  }),
  z.object({
    action: z.literal("approval:bulk-take-over"),
    payload: z.object({ currentTarget: targetSchema }),
  }),
  z.object({
    action: z.literal("collaboration:automation-assign"),
    payload: z.object({ workspaceId: workspaceIdSchema, owner: z.string().optional().default("") }),
  }),
  z.object({
    action: z.literal("workspace:assign-owner"),
    payload: z.object({ workspaceId: workspaceIdSchema, owner: z.string().optional().default("") }),
  }),
  z.object({
    action: z.literal("collaboration:automation-assign-approver"),
    payload: z.object({ workspaceId: workspaceIdSchema, approverTarget: z.string().optional().default("") }),
  }),
  z.object({
    action: z.literal("workspace:assign-approver"),
    payload: z.object({ workspaceId: workspaceIdSchema, approverTarget: z.string().optional().default("") }),
  }),
  z.object({
    action: z.literal("collaboration:automation-assign-backup-approver"),
    payload: z.object({ workspaceId: workspaceIdSchema, backupApproverTarget: z.string().optional().default("") }),
  }),
  z.object({
    action: z.literal("workspace:assign-backup-approver"),
    payload: z.object({ workspaceId: workspaceIdSchema, backupApproverTarget: z.string().optional().default("") }),
  }),
  z.object({
    action: z.literal("collaboration:automation-bulk-assign"),
    payload: z.object({ environment: z.string().min(1), statuses: statusFilterSchema, owner: z.string().optional().default("") }),
  }),
  z.object({
    action: z.literal("collaboration:automation-bulk-assign-approver"),
    payload: z.object({ environment: z.string().min(1), statuses: statusFilterSchema, approverTarget: z.string().optional().default("") }),
  }),
  z.object({
    action: z.literal("collaboration:automation-bulk-assign-backup-approver"),
    payload: z.object({ environment: z.string().min(1), statuses: statusFilterSchema, backupApproverTarget: z.string().optional().default("") }),
  }),
  z.object({
    action: z.literal("collaboration:automation-snooze"),
    payload: z.object({ workspaceId: workspaceIdSchema, minutes: z.number().int().min(1) }),
  }),
  z.object({
    action: z.literal("workspace:snooze"),
    payload: z.object({ workspaceId: workspaceIdSchema, minutes: z.number().int().min(1) }),
  }),
  z.object({
    action: z.literal("collaboration:automation-bulk-snooze"),
    payload: z.object({ environment: z.string().min(1), statuses: statusFilterSchema, minutes: z.number().int().min(1) }),
  }),
  z.object({
    action: z.literal("collaboration:automation-run-sweep"),
    payload: z.object({ workspaceId: workspaceIdSchema }),
  }),
  z.object({
    action: z.literal("workspace:run-sweep"),
    payload: z.object({ workspaceId: workspaceIdSchema }),
  }),
  z.object({
    action: z.literal("collaboration:automation-bulk-run-sweep"),
    payload: z.object({ environment: z.string().min(1), statuses: statusFilterSchema }),
  }),
  z.object({
    action: z.literal("collaboration:automation-create-followup"),
    payload: z.object({
      workspaceId: workspaceIdSchema,
      owner: z.string().min(1),
      agentName: z.string().min(1),
      description: z.string().min(1),
    }),
  }),
  z.object({
    action: z.literal("workspace:create-followup"),
    payload: z.object({
      workspaceId: workspaceIdSchema,
      owner: z.string().min(1),
      agentName: z.string().min(1),
      description: z.string().min(1),
    }),
  }),
  z.object({
    action: z.literal("collaboration:automation-bulk-create-followup"),
    payload: z.object({
      environment: z.string().min(1),
      statuses: statusFilterSchema,
      owner: z.string().optional().default(""),
      description: z.string().min(1),
    }),
  }),
  z.object({
    action: z.literal("collaboration:automation-add-note"),
    payload: z.object({ workspaceId: workspaceIdSchema, note: z.string().min(1) }),
  }),
  z.object({
    action: z.literal("workspace:add-note"),
    payload: z.object({ workspaceId: workspaceIdSchema, note: z.string().min(1) }),
  }),
  z.object({
    action: z.literal("collaboration:automation-generate-summary"),
    payload: z.object({ workspaceId: workspaceIdSchema }),
  }),
  z.object({
    action: z.literal("workspace:generate-summary"),
    payload: z.object({ workspaceId: workspaceIdSchema }),
  }),
  z.object({
    action: z.literal("collaboration:automation-set-status"),
    payload: z.object({
      workspaceId: workspaceIdSchema,
      incidentStatus: z.enum(SUPPORTED_INCIDENT_STATUSES),
    }),
  }),
  z.object({
    action: z.literal("workspace:set-status"),
    payload: z.object({
      workspaceId: workspaceIdSchema,
      incidentStatus: z.enum(SUPPORTED_INCIDENT_STATUSES),
    }),
  }),
  z.object({
    action: z.literal("collaboration:automation-share-summary"),
    payload: z.object({
      workspaceId: workspaceIdSchema,
      assignedTo: z.string().min(1),
      useHandoffDraft: z.boolean().optional(),
    }),
  }),
  z.object({
    action: z.literal("collaboration:automation-checklist-toggle"),
    payload: z.object({
      workspaceId: workspaceIdSchema,
      itemId: z.string().min(1),
      completed: z.boolean(),
    }),
  }),
  z.object({
    action: z.literal("collaboration:automation-bulk-apply-policy-override"),
    payload: z.object({
      environment: z.string().min(1),
      statuses: statusFilterSchema,
      overrideEnvironment: z.string().min(1),
      incidentApprovalCapacityLimit: z.number().int().min(1),
      trustDropAction: z.string().min(1),
      requireApprovalForResolved: z.boolean(),
      promoteTrustDropToIncident: z.boolean(),
    }),
  }),
  z.object({
    action: z.literal("collaboration:automation-bulk-reset-policy-override"),
    payload: z.object({ environment: z.string().min(1), statuses: statusFilterSchema }),
  }),
  z.object({
    action: z.literal("collaboration:automation-bulk-apply-policy-playbook"),
    payload: z.object({ environment: z.string().min(1), statuses: statusFilterSchema, playbookId: z.string().min(1) }),
  }),
  z.object({
    action: z.literal("collaboration:automation-bulk-stabilize"),
    payload: z.object({
      environment: z.string().min(1),
      statuses: statusFilterSchema,
      owner: z.string().optional().default(""),
      approverTarget: z.string().optional().default(""),
      backupApproverTarget: z.string().optional().default(""),
      description: z.string().min(1),
    }),
  }),
  z.object({
    action: z.literal("collaboration:save-policy-playbook"),
    payload: z.object({
      playbook: z.object({
        name: z.string().min(1),
        environment: z.string().min(1),
        incidentApprovalCapacityLimit: z.number().int().min(1),
        trustDropAction: z.string().min(1),
        requireApprovalForResolved: z.boolean(),
        promoteTrustDropToIncident: z.boolean(),
      }),
    }),
  }),
  z.object({
    action: z.literal("collaboration:delete-policy-playbook"),
    payload: z.object({ playbookId: z.string().min(1) }),
  }),
  z.object({
    action: z.literal("collaboration:rollback-approval-policy"),
    payload: z.object({ promotionId: z.string().min(1) }),
  }),
]);

export type OperationsActionInput = z.infer<typeof actionSchema>;

type OperationsActor = Pick<SessionUser, "id" | "workspaceId" | "name" | "email" | "role">;

const directWorkspaceActions = new Set([
  "collaboration:automation-assign",
  "workspace:assign-owner",
  "collaboration:automation-assign-approver",
  "workspace:assign-approver",
  "collaboration:automation-assign-backup-approver",
  "workspace:assign-backup-approver",
  "collaboration:automation-snooze",
  "workspace:snooze",
  "collaboration:automation-run-sweep",
  "workspace:run-sweep",
  "collaboration:automation-create-followup",
  "workspace:create-followup",
  "collaboration:automation-add-note",
  "workspace:add-note",
  "collaboration:automation-generate-summary",
  "workspace:generate-summary",
  "collaboration:automation-set-status",
  "workspace:set-status",
  "collaboration:automation-share-summary",
  "collaboration:automation-checklist-toggle",
]);

const directApprovalActions = new Set([
  "approval:approve",
  "approval:reject",
  "approval:reassign-target",
  "approval:take-over",
  "approval:bulk-reassign-target",
  "approval:bulk-take-over",
]);

function actorApprovalTargets(actor: OperationsActor) {
  return [actor.email, actor.name, `user:${actor.id}`].filter((value): value is string => Boolean(value));
}

function currentEnvironment(value: string): "development" | "staging" | "production" {
  if (value === "production" || value === "staging") {
    return value;
  }
  return "development";
}

function workspaceSeverityScore(severities: string[]) {
  return severities.reduce((highest, severity) => {
    if (severity === "critical") return Math.max(highest, 4);
    if (severity === "high") return Math.max(highest, 3);
    if (severity === "medium") return Math.max(highest, 2);
    return Math.max(highest, 1);
  }, 0);
}

function workspaceStatusForBulkFilter(workspace: {
  updates: Array<{ severity: string }>;
  operationsState?: { incidentStatus?: string | null } | null;
}) {
  const incidentStatus = workspace.operationsState?.incidentStatus || null;
  if (incidentStatus === "archived") {
    return "archived";
  }
  if (incidentStatus === "resolved" || incidentStatus === "shared" || incidentStatus === "ready_for_closeout") {
    return "resolved";
  }

  const severityScore = workspaceSeverityScore(workspace.updates.map((update) => update.severity));
  if (severityScore >= 4) {
    return "error";
  }
  if (severityScore >= 3) {
    return "stalled";
  }
  return "healthy";
}

async function listBulkTargetWorkspaces(
  actor: OperationsActor,
  environment: string,
  statuses: string[],
) {
  const governanceState = await getPolicyGovernanceSnapshot();
  const defaultEnvironment = currentEnvironment(governanceState.currentEnvironment || "development");
  const workspacePolicyOverrides =
    governanceState.workspacePolicyOverrides && typeof governanceState.workspacePolicyOverrides === "object"
      ? governanceState.workspacePolicyOverrides
      : {};

  const workspaces = await prisma.workspace.findMany({
    where: actor.role === "admin" ? {} : { members: { some: { userId: actor.id } } },
    include: {
      updates: {
        orderBy: { happenedAt: "desc" },
        take: 8,
      },
      operationsState: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return workspaces.filter((workspace) => {
    const override = workspacePolicyOverrides[workspace.id];
    const workspaceEnvironment = currentEnvironment(
      typeof override?.environment === "string" ? override.environment : defaultEnvironment,
    );
    return workspaceEnvironment === environment && statuses.includes(workspaceStatusForBulkFilter(workspace));
  });
}

export async function executeOperationsAction(input: unknown, actor: OperationsActor) {
  const parsed = actionSchema.parse(input);
  const actorName = actor.name || actor.email;

  if (
    parsed.action === "collaboration:automation-bulk-assign" ||
    parsed.action === "collaboration:automation-bulk-assign-approver" ||
    parsed.action === "collaboration:automation-bulk-assign-backup-approver" ||
    parsed.action === "collaboration:automation-bulk-snooze" ||
    parsed.action === "collaboration:automation-bulk-run-sweep" ||
    parsed.action === "collaboration:automation-bulk-create-followup" ||
    parsed.action === "collaboration:automation-bulk-stabilize"
  ) {
    const workspaces = await listBulkTargetWorkspaces(actor, parsed.payload.environment, parsed.payload.statuses);

    if (!workspaces.length) {
      return {
        action: parsed.action,
        output: `No workspaces matched ${parsed.payload.environment} with the selected statuses.`,
      };
    }

    if (parsed.action === "collaboration:automation-bulk-assign") {
      await Promise.all(
        workspaces.map((workspace) =>
          executeOperationsAction(
            {
              action: "collaboration:automation-assign",
              payload: { workspaceId: workspace.id, owner: parsed.payload.owner || "" },
            },
            actor,
          ),
        ),
      );
      return {
        action: parsed.action,
        output: `Updated the incident owner for ${workspaces.length} workspace${workspaces.length === 1 ? "" : "s"}.`,
      };
    }

    if (parsed.action === "collaboration:automation-bulk-assign-approver") {
      await Promise.all(
        workspaces.map((workspace) =>
          executeOperationsAction(
            {
              action: "collaboration:automation-assign-approver",
              payload: { workspaceId: workspace.id, approverTarget: parsed.payload.approverTarget || "" },
            },
            actor,
          ),
        ),
      );
      return {
        action: parsed.action,
        output: `Updated the approver target for ${workspaces.length} workspace${workspaces.length === 1 ? "" : "s"}.`,
      };
    }

    if (parsed.action === "collaboration:automation-bulk-assign-backup-approver") {
      await Promise.all(
        workspaces.map((workspace) =>
          executeOperationsAction(
            {
              action: "collaboration:automation-assign-backup-approver",
              payload: { workspaceId: workspace.id, backupApproverTarget: parsed.payload.backupApproverTarget || "" },
            },
            actor,
          ),
        ),
      );
      return {
        action: parsed.action,
        output: `Updated the backup approver for ${workspaces.length} workspace${workspaces.length === 1 ? "" : "s"}.`,
      };
    }

    if (parsed.action === "collaboration:automation-bulk-snooze") {
      await Promise.all(
        workspaces.map((workspace) =>
          executeOperationsAction(
            {
              action: "collaboration:automation-snooze",
              payload: { workspaceId: workspace.id, minutes: parsed.payload.minutes },
            },
            actor,
          ),
        ),
      );
      return {
        action: parsed.action,
        output: `Snoozed ${workspaces.length} workspace${workspaces.length === 1 ? "" : "s"} for ${parsed.payload.minutes} minutes.`,
      };
    }

    if (parsed.action === "collaboration:automation-bulk-run-sweep") {
      await Promise.all(
        workspaces.map((workspace) =>
          executeOperationsAction(
            {
              action: "collaboration:automation-run-sweep",
              payload: { workspaceId: workspace.id },
            },
            actor,
          ),
        ),
      );
      return {
        action: parsed.action,
        output: `Ran a workspace sweep for ${workspaces.length} workspace${workspaces.length === 1 ? "" : "s"}.`,
      };
    }

    if (parsed.action === "collaboration:automation-bulk-create-followup") {
      const owner = parsed.payload.owner || actorName;
      await Promise.all(
        workspaces.map((workspace) =>
          executeOperationsAction(
            {
              action: "collaboration:automation-create-followup",
              payload: {
                workspaceId: workspace.id,
                owner,
                agentName: "operations-batch",
                description: parsed.payload.description,
              },
            },
            actor,
          ),
        ),
      );
      return {
        action: parsed.action,
        output: `Created follow-ups for ${workspaces.length} workspace${workspaces.length === 1 ? "" : "s"}.`,
      };
    }

    const owner = parsed.payload.owner || actorName;
    await Promise.all(
      workspaces.map(async (workspace) => {
        if (parsed.payload.owner) {
          await executeOperationsAction(
            {
              action: "collaboration:automation-assign",
              payload: { workspaceId: workspace.id, owner: parsed.payload.owner },
            },
            actor,
          );
        }
        if (parsed.payload.approverTarget) {
          await executeOperationsAction(
            {
              action: "collaboration:automation-assign-approver",
              payload: { workspaceId: workspace.id, approverTarget: parsed.payload.approverTarget },
            },
            actor,
          );
        }
        if (parsed.payload.backupApproverTarget) {
          await executeOperationsAction(
            {
              action: "collaboration:automation-assign-backup-approver",
              payload: { workspaceId: workspace.id, backupApproverTarget: parsed.payload.backupApproverTarget },
            },
            actor,
          );
        }
        await executeOperationsAction(
          {
            action: "collaboration:automation-run-sweep",
            payload: { workspaceId: workspace.id },
          },
          actor,
        );
        await executeOperationsAction(
          {
            action: "collaboration:automation-create-followup",
            payload: {
              workspaceId: workspace.id,
              owner,
              agentName: "operations-stabilizer",
              description: parsed.payload.description,
            },
          },
          actor,
        );
      }),
    );
    return {
      action: parsed.action,
      output: `Stabilized ${workspaces.length} workspace${workspaces.length === 1 ? "" : "s"} with updated ownership, sweeps, and follow-ups.`,
    };
  }

  if (parsed.action === "collaboration:automation-bulk-apply-policy-override") {
    const workspaces = await listBulkTargetWorkspaces(actor, parsed.payload.environment, parsed.payload.statuses);
    const governance = await applyPolicyOverrideToWorkspaces({
      workspaceIds: workspaces.map((workspace) => workspace.id),
      override: {
        environment: parsed.payload.overrideEnvironment,
        incidentApprovalCapacityLimit: parsed.payload.incidentApprovalCapacityLimit,
        trustDropAction: parsed.payload.trustDropAction,
        requireApprovalForResolved: parsed.payload.requireApprovalForResolved,
        promoteTrustDropToIncident: parsed.payload.promoteTrustDropToIncident,
      },
      actor,
    });
    return {
      action: parsed.action,
      output: workspaces.length
        ? `Applied the policy override to ${workspaces.length} workspace${workspaces.length === 1 ? "" : "s"}.`
        : `No workspaces matched ${parsed.payload.environment} with the selected statuses.`,
      governance,
    };
  }

  if (parsed.action === "collaboration:automation-bulk-reset-policy-override") {
    const workspaces = await listBulkTargetWorkspaces(actor, parsed.payload.environment, parsed.payload.statuses);
    const governance = await resetPolicyOverrideForWorkspaces(workspaces.map((workspace) => workspace.id));
    return {
      action: parsed.action,
      output: workspaces.length
        ? `Reset policy overrides for ${workspaces.length} workspace${workspaces.length === 1 ? "" : "s"}.`
        : `No workspaces matched ${parsed.payload.environment} with the selected statuses.`,
      governance,
    };
  }

  if (parsed.action === "collaboration:automation-bulk-apply-policy-playbook") {
    const workspaces = await listBulkTargetWorkspaces(actor, parsed.payload.environment, parsed.payload.statuses);
    const governance = await applyPolicyPlaybookToWorkspaces({
      playbookId: parsed.payload.playbookId,
      workspaceIds: workspaces.map((workspace) => workspace.id),
      actor,
    });
    return {
      action: parsed.action,
      output: workspaces.length
        ? `Applied the playbook to ${workspaces.length} workspace${workspaces.length === 1 ? "" : "s"}.`
        : `No workspaces matched ${parsed.payload.environment} with the selected statuses.`,
      governance,
    };
  }

  if (parsed.action === "collaboration:save-policy-playbook") {
    await savePolicyPlaybook(parsed.payload.playbook, actor);
    return {
      action: parsed.action,
      output: `Saved policy playbook ${parsed.payload.playbook.name}.`,
    };
  }

  if (parsed.action === "collaboration:delete-policy-playbook") {
    await deletePolicyPlaybook(parsed.payload.playbookId);
    return {
      action: parsed.action,
      output: `Deleted policy playbook ${parsed.payload.playbookId}.`,
    };
  }

  if (parsed.action === "collaboration:rollback-approval-policy") {
    await rollbackPolicyPlaybookRollout(parsed.payload.promotionId);
    return {
      action: parsed.action,
      output: `Rolled back policy rollout ${parsed.payload.promotionId}.`,
    };
  }

  if (directApprovalActions.has(parsed.action)) {
    const actorTargets = actorApprovalTargets(actor);

    if ("currentTarget" in parsed.payload) {
      const nextTarget =
        parsed.action === "approval:bulk-take-over"
          ? actor.email || `user:${actor.id}`
          : parsed.payload.approverTarget;

      const approvals = await prisma.incidentApprovalRequest.findMany({
        where: {
          status: "pending",
          approverTarget: parsed.payload.currentTarget,
          ...(actor.role === "admin" ? {} : { workspaceId: actor.workspaceId }),
        },
        include: { workspace: true },
        orderBy: { createdAt: "desc" },
      });

      if (!approvals.length) {
        return {
          action: parsed.action,
          output: `No pending approvals are currently assigned to ${parsed.payload.currentTarget}.`,
        };
      }

      if (parsed.action === "approval:bulk-take-over" && actor.role !== "admin") {
        const canTakeOverAll = approvals.every((approval) => actorTargets.includes(approval.approverTarget || ""));
        if (!canTakeOverAll) {
          throw new AppError(403, "incident_approval_forbidden", "You do not have access to all approvals in this batch.");
        }
      }

      await prisma.$transaction(
        approvals.map((approval) =>
          prisma.incidentApprovalRequest.update({
            where: { id: approval.id },
            data: {
              approverTarget: nextTarget,
              routingMode: "manual",
              routingReason:
                parsed.action === "approval:bulk-take-over"
                  ? `${actorName} took ownership of the approval queue`
                  : `Reassigned by ${actorName}`,
              routedFromTarget: approval.approverTarget,
            },
          }),
        ),
      );

      await Promise.all(
        approvals.map((approval) =>
          recordWorkspaceOperationActivity({
            workspaceId: approval.workspaceId,
            userId: actor.id,
            type:
              parsed.action === "approval:bulk-take-over"
                ? "operations.approval.taken_over"
                : "operations.approval.reassigned",
            title:
              parsed.action === "approval:bulk-take-over"
                ? "Approval batch taken over"
                : "Approval batch reassigned",
            description:
              parsed.action === "approval:bulk-take-over"
                ? `${actorName} took ownership of approval ${approval.id}.`
                : `Reassigned approval ${approval.id} from ${approval.approverTarget || "unassigned"} to ${nextTarget}.`,
            metadata: { approvalId: approval.id, approverTarget: nextTarget, previousTarget: approval.approverTarget },
          }),
        ),
      );

      return {
        action: parsed.action,
        output:
          parsed.action === "approval:bulk-take-over"
            ? `Took ownership of ${approvals.length} pending approval${approvals.length === 1 ? "" : "s"}.`
            : `Reassigned ${approvals.length} pending approval${approvals.length === 1 ? "" : "s"} to ${nextTarget}.`,
      };
    }

    if ("approvalId" in parsed.payload) {
      const approval = await prisma.incidentApprovalRequest.findFirst({
        where: { id: parsed.payload.approvalId },
        include: { workspace: true },
      });

      if (!approval) {
        throw new AppError(404, "incident_approval_not_found", "Approval request not found.");
      }

      const canAccess =
        actor.role === "admin" ||
        approval.workspaceId === actor.workspaceId ||
        actorTargets.includes(approval.approverTarget || "");

      if (!canAccess) {
        throw new AppError(403, "incident_approval_forbidden", "You do not have access to this approval.");
      }

      if (parsed.action === "approval:reassign-target") {
        await prisma.incidentApprovalRequest.update({
          where: { id: approval.id },
          data: {
            approverTarget: parsed.payload.approverTarget,
            routingMode: "manual",
            routingReason: `Reassigned by ${actorName}`,
            routedFromTarget: approval.approverTarget,
          },
        });
        await recordWorkspaceOperationActivity({
          workspaceId: approval.workspaceId,
          userId: actor.id,
          type: "operations.approval.reassigned",
          title: "Approval reassigned",
          description: `Reassigned approval ${approval.id} from ${approval.approverTarget || "unassigned"} to ${parsed.payload.approverTarget}.`,
          metadata: { approvalId: approval.id, approverTarget: parsed.payload.approverTarget },
        });
        return { action: parsed.action, output: `Reassigned approval to ${parsed.payload.approverTarget}.` };
      }

      if (parsed.action === "approval:take-over") {
        const nextTarget = actor.email || `user:${actor.id}`;
        await prisma.incidentApprovalRequest.update({
          where: { id: approval.id },
          data: {
            approverTarget: nextTarget,
            routingMode: "manual",
            routingReason: `${actorName} took ownership of the approval`,
            routedFromTarget: approval.approverTarget,
          },
        });
        await recordWorkspaceOperationActivity({
          workspaceId: approval.workspaceId,
          userId: actor.id,
          type: "operations.approval.taken_over",
          title: "Approval taken over",
          description: `${actorName} took ownership of approval ${approval.id}.`,
          metadata: { approvalId: approval.id, approverTarget: nextTarget },
        });
        return { action: parsed.action, output: `Took ownership of approval ${approval.id}.` };
      }

      if (approval.status !== "pending") {
        throw new AppError(400, "incident_approval_not_pending", `Approval is already ${approval.status}.`);
      }

      if (parsed.action === "approval:reject") {
        await prisma.incidentApprovalRequest.update({
          where: { id: approval.id },
          data: {
            status: "rejected",
            rejectedById: actor.id,
            rejectedByName: actorName,
            rejectionNote: parsed.payload.note || null,
            resolvedAt: new Date(),
          },
        });
        await recordWorkspaceOperationActivity({
          workspaceId: approval.workspaceId,
          userId: actor.id,
          type: "operations.approval.rejected",
          title: "Approval rejected",
          description: `Rejected ${approval.requestedStatus} approval for ${approval.workspace.name}.`,
          metadata: { approvalId: approval.id, rejectionNote: parsed.payload.note || null },
        });
        return { action: parsed.action, output: `Rejected ${approval.requestedStatus} approval.` };
      }

      await prisma.$transaction([
        prisma.incidentApprovalRequest.update({
          where: { id: approval.id },
          data: {
            status: "approved",
            approvedById: actor.id,
            approvedByName: actorName,
            resolvedAt: new Date(),
          },
        }),
        prisma.workspaceOperationsState.update({
          where: { workspaceId: approval.workspaceId },
          data: {
            incidentStatus: approval.requestedStatus,
            incidentStatusUpdatedAt: new Date(),
            resolutionCompletedAt:
              approval.requestedStatus === "resolved" || approval.requestedStatus === "archived" ? new Date() : null,
            resolutionOwnerName:
              approval.requestedStatus === "resolved" || approval.requestedStatus === "archived"
                ? actorName
                : undefined,
          },
        }),
      ]);
      await recordWorkspaceOperationActivity({
        workspaceId: approval.workspaceId,
        userId: actor.id,
        type: "operations.approval.approved",
        title: "Approval approved",
        description: `Approved ${approval.requestedStatus} transition for ${approval.workspace.name}.`,
        metadata: { approvalId: approval.id, requestedStatus: approval.requestedStatus },
      });
      return { action: parsed.action, output: `Approved ${approval.requestedStatus} transition.` };
    }
  }

  if (directWorkspaceActions.has(parsed.action)) {
    const actorName = actor.name || actor.email;

    if (!("workspaceId" in parsed.payload) || typeof parsed.payload.workspaceId !== "string") {
      throw new AppError(400, "workspace_required", "Workspace is required.");
    }

    const workspaceId = parsed.payload.workspaceId;
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        ...(actor.role === "admin" ? {} : { members: { some: { userId: actor.id } } }),
      },
      include: {
        updates: {
          orderBy: { happenedAt: "desc" },
          take: 6,
        },
      },
    });

    if (!workspace) {
      throw new AppError(404, "workspace_not_found", "Workspace not found.");
    }

    const state = await ensureWorkspaceOperationsState(workspaceId);

    if (parsed.action === "collaboration:automation-assign" || parsed.action === "workspace:assign-owner") {
      await prisma.workspaceOperationsState.update({
        where: { workspaceId },
        data: { escalationOwner: parsed.payload.owner || null },
      });
      await updateWorkspaceChecklistItem(workspaceId, "owner_assigned", Boolean(parsed.payload.owner), actorName);
      await recordWorkspaceOperationActivity({
        workspaceId,
        userId: actor.id,
        type: "operations.owner.assigned",
        title: "Incident owner updated",
        description: parsed.payload.owner
          ? `Assigned ${parsed.payload.owner} as the incident owner for ${workspace.name}.`
          : `Cleared the incident owner for ${workspace.name}.`,
        metadata: { owner: parsed.payload.owner || null },
      });
      return { action: parsed.action, output: parsed.payload.owner ? `Assigned ${parsed.payload.owner}.` : "Cleared incident owner." };
    }

    if (parsed.action === "collaboration:automation-assign-approver" || parsed.action === "workspace:assign-approver") {
      await prisma.workspaceOperationsState.update({
        where: { workspaceId },
        data: { incidentApproverTarget: parsed.payload.approverTarget || null },
      });
      await recordWorkspaceOperationActivity({
        workspaceId,
        userId: actor.id,
        type: "operations.approver.updated",
        title: "Primary approver updated",
        description: parsed.payload.approverTarget
          ? `Set ${parsed.payload.approverTarget} as the primary approver for ${workspace.name}.`
          : `Cleared the primary approver target for ${workspace.name}.`,
        metadata: { approverTarget: parsed.payload.approverTarget || null },
      });
      return { action: parsed.action, output: parsed.payload.approverTarget ? `Updated approver target to ${parsed.payload.approverTarget}.` : "Cleared approver target." };
    }

    if (parsed.action === "collaboration:automation-assign-backup-approver" || parsed.action === "workspace:assign-backup-approver") {
      await prisma.workspaceOperationsState.update({
        where: { workspaceId },
        data: { backupApproverTarget: parsed.payload.backupApproverTarget || null },
      });
      await recordWorkspaceOperationActivity({
        workspaceId,
        userId: actor.id,
        type: "operations.approver.backup_updated",
        title: "Backup approver updated",
        description: parsed.payload.backupApproverTarget
          ? `Set ${parsed.payload.backupApproverTarget} as the backup approver for ${workspace.name}.`
          : `Cleared the backup approver target for ${workspace.name}.`,
        metadata: { backupApproverTarget: parsed.payload.backupApproverTarget || null },
      });
      return { action: parsed.action, output: parsed.payload.backupApproverTarget ? `Updated backup approver to ${parsed.payload.backupApproverTarget}.` : "Cleared backup approver." };
    }

    if (parsed.action === "collaboration:automation-snooze" || parsed.action === "workspace:snooze") {
      const snoozedUntil = new Date(Date.now() + parsed.payload.minutes * 60_000);
      await prisma.workspaceOperationsState.update({
        where: { workspaceId },
        data: { snoozedUntil },
      });
      await recordWorkspaceOperationActivity({
        workspaceId,
        userId: actor.id,
        type: "operations.workspace.snoozed",
        title: "Workspace snoozed",
        description: `Snoozed ${workspace.name} until ${snoozedUntil.toISOString()}.`,
        metadata: { minutes: parsed.payload.minutes, snoozedUntil: snoozedUntil.toISOString() },
      });
      return { action: parsed.action, output: `Snoozed ${workspace.name} for ${parsed.payload.minutes} minutes.` };
    }

    if (parsed.action === "collaboration:automation-run-sweep" || parsed.action === "workspace:run-sweep") {
      const now = new Date();
      const updateCount = workspace.updates.length;
      await prisma.workspaceOperationsState.update({
        where: { workspaceId },
        data: {
          lastSweepQueuedAt: now,
          lastSweepRunAt: now,
          lastSweepError: null,
          lastGeneratedCount: updateCount,
        },
      });
      await recordWorkspaceOperationActivity({
        workspaceId,
        userId: actor.id,
        type: "operations.sweep.run",
        title: "Digest sweep executed",
        description: `Ran a workspace sweep for ${workspace.name} across ${updateCount} recent updates.`,
        metadata: { updateCount },
      });
      return { action: parsed.action, output: `Queued and completed a sweep for ${workspace.name}.` };
    }

    if (parsed.action === "collaboration:automation-create-followup" || parsed.action === "workspace:create-followup") {
      const followup = await prisma.operationsFollowup.create({
        data: {
          workspaceId,
          agentName: parsed.payload.agentName,
          description: parsed.payload.description,
          ownerName: parsed.payload.owner,
          status: "queued",
          priority: 2,
        },
      });
      await prisma.workspaceOperationsState.update({
        where: { workspaceId },
        data: {
          resolutionTaskId: followup.id,
          resolutionDescription: parsed.payload.description,
          resolutionOwnerName: parsed.payload.owner,
        },
      });
      await updateWorkspaceChecklistItem(workspaceId, "followup_created", true, actorName);
      await recordWorkspaceOperationActivity({
        workspaceId,
        userId: actor.id,
        type: "operations.followup.created",
        title: "Follow-up created",
        description: `Created follow-up ${followup.id} for ${parsed.payload.agentName}: ${parsed.payload.description}`,
        metadata: {
          followupId: followup.id,
          owner: parsed.payload.owner,
          agentName: parsed.payload.agentName,
        },
      });
      return { action: parsed.action, output: `Created follow-up ${followup.id}.` };
    }

    if (parsed.action === "collaboration:automation-add-note" || parsed.action === "workspace:add-note") {
      await recordWorkspaceOperationActivity({
        workspaceId,
        userId: actor.id,
        type: "operations.note.added",
        title: "Workspace note added",
        description: `Added an operational note to ${workspace.name}.`,
        metadata: { note: parsed.payload.note },
      });
      return { action: parsed.action, output: "Added workspace note." };
    }

    if (parsed.action === "collaboration:automation-generate-summary" || parsed.action === "workspace:generate-summary") {
      const latestUpdates = workspace.updates.slice(0, 3);
      const summary =
        latestUpdates.length > 0
          ? `Workspace ${workspace.name} is currently ${state.incidentStatus}. Recent signals: ${latestUpdates
              .map((item) => `${item.title} (${item.severity})`)
              .join("; ")}.`
          : `Workspace ${workspace.name} has no recent monitored updates.`;
      const now = new Date();
      await prisma.workspaceOperationsState.update({
        where: { workspaceId },
        data: {
          incidentSummary: summary,
          incidentSummaryUpdatedAt: now,
          lastGeneratedCount: latestUpdates.length,
          incidentArchiveRecommendation:
            state.incidentStatus === "resolved" || state.incidentStatus === "shared"
              ? "Prepare this workspace for archive after the final summary is shared."
              : state.incidentArchiveRecommendation,
        },
      });
      await updateWorkspaceChecklistItem(workspaceId, "summary_generated", true, actorName);
      await recordWorkspaceOperationActivity({
        workspaceId,
        userId: actor.id,
        type: "operations.summary.generated",
        title: "Incident summary generated",
        description: summary,
      });
      return { action: parsed.action, output: "Generated an updated incident summary." };
    }

    if (parsed.action === "collaboration:automation-set-status" || parsed.action === "workspace:set-status") {
      const nextStatus = parsed.payload.incidentStatus;
      const requiresApproval = ["resolved", "archived"].includes(nextStatus) && Boolean(state.incidentApproverTarget);
      if (requiresApproval) {
        const existingPending = await prisma.incidentApprovalRequest.findFirst({
          where: {
            workspaceId,
            status: "pending",
          },
          orderBy: { createdAt: "desc" },
        });

        if (existingPending) {
          return {
            action: parsed.action,
            output: `Approval ${existingPending.id} is already pending for ${workspace.name}.`,
          };
        }

        const approval = await prisma.incidentApprovalRequest.create({
          data: {
            workspaceId,
            label: `Approve incident ${nextStatus} for ${workspace.name}`,
            requestedStatus: nextStatus,
            approverTarget: state.incidentApproverTarget,
            requestedById: actor.id,
            requestedByName: actorName,
            archiveRationale:
              nextStatus === "archived"
                ? state.incidentArchiveRecommendation || `Archive ${workspace.name} after the final shared handoff.`
                : null,
          },
        });
        await recordWorkspaceOperationActivity({
          workspaceId,
          userId: actor.id,
          type: "operations.approval.requested",
          title: "Incident approval requested",
          description: `Requested ${nextStatus} approval for ${workspace.name}.`,
          metadata: { approvalId: approval.id, approverTarget: approval.approverTarget, requestedStatus: nextStatus },
        });
        return { action: parsed.action, output: `Requested ${nextStatus} approval from ${approval.approverTarget || "an approver"}.` };
      }

      const nextChecklist = buildDefaultChecklist(state.incidentChecklist);
      await prisma.workspaceOperationsState.update({
        where: { workspaceId },
        data: {
          incidentStatus: nextStatus,
          incidentStatusUpdatedAt: new Date(),
          resolutionCompletedAt: nextStatus === "resolved" || nextStatus === "archived" ? new Date() : null,
          resolutionOwnerName: nextStatus === "resolved" || nextStatus === "archived" ? (state.escalationOwner || actorName) : state.resolutionOwnerName,
          incidentChecklist: nextChecklist as never,
        },
      });
      await recordWorkspaceOperationActivity({
        workspaceId,
        userId: actor.id,
        type: "operations.status.updated",
        title: "Incident status updated",
        description: `Moved ${workspace.name} into ${nextStatus}.`,
        metadata: { incidentStatus: nextStatus },
      });
      return { action: parsed.action, output: `Updated incident status to ${nextStatus}.` };
    }

    if (parsed.action === "collaboration:automation-share-summary") {
      const handoff = state.incidentSummary
        ? `${state.incidentSummary}\n\nShared with ${parsed.payload.assignedTo}.`
        : `Workspace ${workspace.name} handoff shared with ${parsed.payload.assignedTo}.`;
      await prisma.workspaceOperationsState.update({
        where: { workspaceId },
        data: {
          incidentHandoffDraft: handoff,
          incidentHandoffDraftUpdatedAt: new Date(),
          incidentArchiveRecommendation:
            state.incidentStatus === "resolved" || state.incidentStatus === "shared"
              ? "Archive after stakeholders confirm the shared handoff."
              : state.incidentArchiveRecommendation,
        },
      });
      await updateWorkspaceChecklistItem(workspaceId, "shared_handoff", true, actorName);
      await recordWorkspaceOperationActivity({
        workspaceId,
        userId: actor.id,
        type: "operations.summary.shared",
        title: "Incident handoff shared",
        description: `Shared the incident handoff for ${workspace.name} with ${parsed.payload.assignedTo}.`,
        metadata: { assignedTo: parsed.payload.assignedTo, useHandoffDraft: parsed.payload.useHandoffDraft ?? false },
      });
      return { action: parsed.action, output: `Shared incident handoff with ${parsed.payload.assignedTo}.` };
    }

    await updateWorkspaceChecklistItem(workspaceId, parsed.payload.itemId, parsed.payload.completed, actorName);
    await recordWorkspaceOperationActivity({
      workspaceId,
      userId: actor.id,
      type: "operations.checklist.updated",
      title: "Checklist updated",
      description: `${parsed.payload.completed ? "Completed" : "Reopened"} checklist item ${parsed.payload.itemId} for ${workspace.name}.`,
      metadata: { itemId: parsed.payload.itemId, completed: parsed.payload.completed },
    });
    return { action: parsed.action, output: `Updated checklist item ${parsed.payload.itemId}.` };
  }

  throw new AppError(
    400,
    "operations_action_not_supported",
    `Action "${parsed.action}" is not supported by the operations service.`,
  );
}
