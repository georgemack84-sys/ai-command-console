import { z } from "zod";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { getRuntimePosture } from "@/src/lib/server/runtime";
import { loadAdminAccessRuntimeContext } from "@/src/server/services/admin-access-runtime";
import { saveControlCenterGovernance, saveControlCenterWorkspacePolicy } from "@/src/server/services/control-center-service";
import { getPolicyGovernanceSnapshot } from "@/src/server/services/policy-governance-service";
import { buildRuntimeWarnings } from "@/src/server/health/runtime-warnings";
import { createRequire } from "node:module";
import { env, getJobQueueMaxPending, getJobQueueMaxRunning, getJobWorkerPollIntervalMs } from "@/src/config/env";
import {
  createAdminWorkspaceInvite,
  listAdminAccessPayload,
  listAdminIncidentApprovals,
  moveUserToWorkspace,
  renameWorkspace,
  revokeAdminWorkspaceInvite,
  runAdminAiSummaryCheck,
  updateUserRole,
  updateUserStatus,
} from "@/src/server/services/admin-service";

const require = createRequire(import.meta.url);
const { buildQueueHealth, configureJobQueue } = require("../../../../services/jobQueue");

const patchSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("user-role"),
    userId: z.string().min(1),
    role: z.enum(["viewer", "operator", "approver", "admin"]),
  }),
  z.object({
    type: z.literal("user-status"),
    userId: z.string().min(1),
    status: z.enum(["active", "disabled"]),
  }),
  z.object({
    type: z.literal("user-workspace"),
    userId: z.string().min(1),
    workspaceId: z.string().min(1),
  }),
  z.object({
    type: z.literal("workspace-rename"),
    workspaceId: z.string().min(1),
    workspaceName: z.string().min(1),
  }),
  z.object({
    type: z.literal("workspace-invite"),
    workspaceId: z.string().min(1),
    email: z.string().email().optional().nullable(),
  }),
  z.object({
    type: z.literal("workspace-invite-revoke"),
    token: z.string().min(1),
  }),
  z.object({
    type: z.literal("workspace-policy"),
    workspaceId: z.string().min(1),
    reset: z.boolean().optional(),
    policyOverride: z.record(z.string(), z.unknown()).optional(),
  }),
  z.object({
    type: z.literal("governance"),
    governance: z.record(z.string(), z.unknown()),
  }),
  z.object({
    type: z.literal("ai-summary-check"),
    workspaceId: z.string().min(1).optional(),
    forceFallback: z.boolean().optional(),
  }),
]);

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    throw new AppError(403, "forbidden", "Admin access required.");
  }
  return user;
}

export async function GET() {
  try {
    const user = await requireAdmin();
    const payload = await listAdminAccessPayload(user);
    const runtimeContext = loadAdminAccessRuntimeContext();
    const governance = await getPolicyGovernanceSnapshot();
    const approvals = await listAdminIncidentApprovals();
    configureJobQueue({
      executionMode: env.JOB_QUEUE_EXECUTION_MODE,
      workerPollIntervalMs: getJobWorkerPollIntervalMs(),
      maxPendingJobs: getJobQueueMaxPending(),
      maxRunningJobs: getJobQueueMaxRunning(),
    });
    const runtime = getRuntimePosture();
    const jobs = buildQueueHealth();
    const runtimeWarnings = buildRuntimeWarnings(runtime, jobs);

    return apiSuccess({
      ...payload,
      governance: {
        currentEnvironment: String(governance.currentEnvironment || getRuntimePosture().environment),
        sensitiveActionsRequireApproval: Boolean(governance.sensitiveActionsRequireApproval),
        environmentPolicies: governance.environmentPolicies,
        workspacePolicyOverrides: governance.workspacePolicyOverrides,
        workspacePolicyPlaybooks: governance.workspacePolicyPlaybooks,
        workspacePolicyPlaybookRollouts: governance.workspacePolicyPlaybookRollouts,
        defaultPolicyPlaybookPresets: governance.defaultPolicyPlaybookPresets,
        demoScenario: governance.demoScenario,
      },
      approvals,
      audit: runtimeContext.audit,
      runtime: {
        ...runtime,
        jobs: {
          ...runtime.jobs,
          health: jobs,
        },
        warnings: runtimeWarnings,
      },
      diagnostics: runtimeContext.diagnostics,
      aiSummaryReliability: runtimeContext.aiSummaryReliability,
      aiSummaryEvaluations: runtimeContext.aiSummaryEvaluations,
      aiSummaryBudget: runtimeContext.aiSummaryBudget,
      legacyCompatibility: runtimeContext.legacyCompatibility,
    });
  } catch (error) {
    return apiError(error, "Unable to load admin access data.");
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireAdmin();
    const body = patchSchema.parse(await request.json());

    if (body.type === "user-role") {
      const updated = await updateUserRole(body.userId, body.role);
      return apiSuccess({ user: updated });
    }

    if (body.type === "user-status") {
      const updated = await updateUserStatus(body.userId, body.status);
      return apiSuccess({ user: updated });
    }

    if (body.type === "user-workspace") {
      const workspace = await moveUserToWorkspace(body.userId, body.workspaceId);
      return apiSuccess({ workspace });
    }

    if (body.type === "workspace-rename") {
      const workspace = await renameWorkspace(body.workspaceId, body.workspaceName);
      return apiSuccess({ workspace });
    }

    if (body.type === "workspace-invite") {
      const invite = await createAdminWorkspaceInvite({
        workspaceId: body.workspaceId,
        email: body.email,
        createdById: user.id,
      });
      return apiSuccess({ invite }, { status: 201 });
    }

    if (body.type === "workspace-invite-revoke") {
      const invite = await revokeAdminWorkspaceInvite(body.token);
      return apiSuccess({ invite });
    }

    if (body.type === "workspace-policy") {
      const governance = await saveControlCenterWorkspacePolicy(body.workspaceId, body.policyOverride, body.reset, user);
      return apiSuccess({ governance });
    }

    if (body.type === "governance") {
      const governance = await saveControlCenterGovernance(body.governance);
      return apiSuccess({ governance });
    }

    if (body.type === "ai-summary-check") {
      const summaryCheck = await runAdminAiSummaryCheck({
        workspaceId: body.workspaceId || user.workspaceId,
        requestedById: user.id,
        forceFallback: body.forceFallback,
      });
      return apiSuccess({ summaryCheck });
    }

    throw new AppError(400, "invalid_admin_update", "Unsupported admin update.");
  } catch (error) {
    return apiError(error, "Unable to apply admin update.");
  }
}
