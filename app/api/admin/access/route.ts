import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { getRuntimePosture } from "@/src/lib/server/runtime";
import { loadAdminAccessRuntimeContext } from "@/src/server/services/admin-access-runtime";
import { getPolicyGovernanceSnapshot } from "@/src/server/services/policy-governance-service";
import { executeGovernedAdminAccessAction } from "@/src/server/services/governed-admin-access-action-service";
import { buildRuntimeWarnings } from "@/src/server/health/runtime-warnings";
import { createRequire } from "node:module";
import { env, getJobQueueMaxPending, getJobQueueMaxRunning, getJobWorkerPollIntervalMs } from "@/src/config/env";
import {
  listAdminAccessPayload,
  listAdminIncidentApprovals,
} from "@/src/server/services/admin-service";

const require = createRequire(import.meta.url);
const { buildQueueHealth, configureJobQueue } = require("../../../../services/jobQueue");

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
    const result = await executeGovernedAdminAccessAction(await request.json(), user);
    if (result.requiresConfirmation || result.simulated) {
      return apiSuccess(result);
    }
    const actionResult = result as unknown as { data: unknown; status?: number };
    return apiSuccess(actionResult.data, actionResult.status ? { status: actionResult.status } : undefined);
  } catch (error) {
    return apiError(error, "Unable to apply admin update.");
  }
}
